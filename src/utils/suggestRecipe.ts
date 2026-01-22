import mixbox from "mixbox"
import tinycolor from "tinycolor2"
import { ColorPart, RecipeSuggestion } from "../types/types"
import { deltaE94, normalizeRgbString, rgbToXyz, xyzToLab } from "./colorConversion"

type SuggestRecipeOptions = {
    maxColors?: number
    maxTotalParts?: number
}

type CandidateRecipe = RecipeSuggestion & { totalParts: number }

const DEFAULT_MAX_COLORS = 3
const DEFAULT_MAX_TOTAL_PARTS = 10
const LARGE_PALETTE_THRESHOLD = 25
const MAX_CANDIDATE_PAINTS = 12

const clamp = (value: number, min: number, max: number) => {
    return Math.min(max, Math.max(min, value))
}

const rgbStringToLab = (rgbString: string) => {
    const rgb = tinycolor(rgbString).toRgb()
    return xyzToLab(rgbToXyz(rgb))
}

const mixLatents = (
    ingredients: Array<{ index: number; parts: number }>,
    latents: Array<number[] | null>
): number[] | null => {
    let totalParts = 0
    for (const ingredient of ingredients) {
        totalParts += ingredient.parts
    }

    if (totalParts <= 0) {
        return null
    }

    const latentMix = new Array(7).fill(0)
    for (const ingredient of ingredients) {
        const latent = latents[ ingredient.index ]
        if (!latent) {
            return null
        }
        const weight = ingredient.parts / totalParts
        for (let i = 0; i < latent.length; i++) {
            latentMix[ i ] += latent[ i ] * weight
        }
    }

    return latentMix
}

const pickBestCandidate = (best: CandidateRecipe | null, candidate: CandidateRecipe): CandidateRecipe => {
    if (!best) {
        return candidate
    }

    const deltaGap = candidate.deltaE - best.deltaE
    if (deltaGap < -1e-6) {
        return candidate
    }

    if (Math.abs(deltaGap) <= 1e-6) {
        if (candidate.ingredients.length < best.ingredients.length) {
            return candidate
        }
        if (
            candidate.ingredients.length === best.ingredients.length &&
            candidate.totalParts < best.totalParts
        ) {
            return candidate
        }
    }

    return best
}

const evaluateCandidate = (
    ingredients: Array<{ index: number; parts: number }>,
    latents: Array<number[] | null>,
    targetLab: ReturnType<typeof rgbStringToLab>
): CandidateRecipe | null => {
    const latentMix = mixLatents(ingredients, latents)
    if (!latentMix) {
        return null
    }
    const resultRgb = normalizeRgbString(mixbox.latentToRgb(latentMix))
    const resultLab = rgbStringToLab(resultRgb)
    const deltaE = deltaE94(resultLab, targetLab)
    const matchPct = clamp(100 - deltaE, 0, 100)
    const totalParts = ingredients.reduce((sum, ingredient) => sum + ingredient.parts, 0)

    return {
        ingredients,
        resultRgb,
        deltaE,
        matchPct,
        totalParts,
    }
}

export const suggestRecipe = (
    palette: ColorPart[],
    targetRgb: string,
    options?: SuggestRecipeOptions
): RecipeSuggestion | null => {
    if (!palette.length) {
        return null
    }

    const maxColors = Math.max(0, Math.floor(options?.maxColors ?? DEFAULT_MAX_COLORS))
    const maxTotalParts = Math.max(1, Math.floor(options?.maxTotalParts ?? DEFAULT_MAX_TOTAL_PARTS))

    const targetLab = rgbStringToLab(targetRgb)

    const scoredPalette = palette.map((color, index) => ({
        index,
        deltaE: deltaE94(rgbStringToLab(color.rgbString), targetLab),
    }))

    const candidateIndices =
        palette.length > LARGE_PALETTE_THRESHOLD
            ? scoredPalette
                  .sort((a, b) => (a.deltaE - b.deltaE) || (a.index - b.index))
                  .slice(0, MAX_CANDIDATE_PAINTS)
                  .map((entry) => entry.index)
            : palette.map((_, index) => index)

    const latents = palette.map((color) => mixbox.rgbToLatent(color.rgbString) ?? null)
    const activeIndices = candidateIndices.filter((index) => latents[ index ])

    if (!activeIndices.length) {
        return null
    }

    let best: CandidateRecipe | null = null

    if (maxColors >= 1) {
        for (const index of activeIndices) {
            const candidate = evaluateCandidate([ { index, parts: 1 } ], latents, targetLab)
            if (candidate) {
                best = pickBestCandidate(best, candidate)
            }
        }
    }

    if (maxColors >= 2) {
        for (let a = 0; a < activeIndices.length; a++) {
            for (let b = a + 1; b < activeIndices.length; b++) {
                const indexA = activeIndices[ a ]
                const indexB = activeIndices[ b ]
                    for (let totalParts = 2; totalParts <= maxTotalParts; totalParts++) {
                        for (let partsA = 1; partsA < totalParts; partsA++) {
                            const partsB = totalParts - partsA
                            const candidate = evaluateCandidate(
                                [
                                    { index: indexA, parts: partsA },
                                    { index: indexB, parts: partsB },
                                ],
                                latents,
                                targetLab
                            )
                            if (candidate) {
                                best = pickBestCandidate(best, candidate)
                            }
                        }
                    }
            }
        }
    }

    if (maxColors >= 3) {
        for (let a = 0; a < activeIndices.length; a++) {
            for (let b = a + 1; b < activeIndices.length; b++) {
                for (let c = b + 1; c < activeIndices.length; c++) {
                    const indexA = activeIndices[ a ]
                    const indexB = activeIndices[ b ]
                    const indexC = activeIndices[ c ]
                    for (let totalParts = 3; totalParts <= maxTotalParts; totalParts++) {
                        for (let partsA = 1; partsA <= totalParts - 2; partsA++) {
                            for (let partsB = 1; partsB <= totalParts - partsA - 1; partsB++) {
                                const partsC = totalParts - partsA - partsB
                                const candidate = evaluateCandidate(
                                    [
                                        { index: indexA, parts: partsA },
                                        { index: indexB, parts: partsB },
                                        { index: indexC, parts: partsC },
                                    ],
                                    latents,
                                    targetLab
                                )
                                if (candidate) {
                                    best = pickBestCandidate(best, candidate)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (!best) {
        return null
    }

    const { totalParts, ...result } = best
    return result
}

export const __testOnly = {
    mixLatents,
    pickBestCandidate,
    evaluateCandidate,
}
