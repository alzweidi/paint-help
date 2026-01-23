import mixbox from "mixbox"
import { normalizeRgbString } from "./colorConversion"
import { createRecipeSuggester, suggestRecipe, __testOnly } from "./suggestRecipe"

const mixTwoColors = (colorA: string, colorB: string, partsA: number, partsB: number) => {
    const latentA = mixbox.rgbToLatent(colorA)
    const latentB = mixbox.rgbToLatent(colorB)

    if (!latentA || !latentB) {
        throw new Error("Missing latent values for mix test.")
    }

    const totalParts = partsA + partsB
    const latentMix = latentA.map((value, index) => {
        const weightA = partsA / totalParts
        const weightB = partsB / totalParts
        return value * weightA + latentB[ index ] * weightB
    })

    return normalizeRgbString(mixbox.latentToRgb(latentMix))
}

describe("suggestRecipe", () => {
    const palette = [
        { label: "Red", partsInMix: 0, rgbString: "rgb(255, 0, 0)" },
        { label: "Blue", partsInMix: 0, rgbString: "rgb(0, 0, 255)" },
    ]

    it("returns an exact match when the target exists in the palette", () => {
        const result = suggestRecipe(palette, "rgb(255, 0, 0)")

        expect(result).not.toBeNull()
        expect(result?.ingredients).toEqual([ { index: 0, parts: 1 } ])
        expect(result?.matchPct).toBeGreaterThan(99.9)
    })

    it("finds a 2-color recipe for a known mix", () => {
        const target = mixTwoColors("rgb(255, 0, 0)", "rgb(0, 0, 255)", 2, 1)
        const result = suggestRecipe(palette, target, { maxColors: 2, maxTotalParts: 6 })

        expect(result).not.toBeNull()
        expect(result?.ingredients).toEqual([
            { index: 0, parts: 2 },
            { index: 1, parts: 1 },
        ])
        expect(result?.deltaE).toBeLessThan(0.2)
    })

    it("returns null when the palette is empty", () => {
        const result = suggestRecipe([], "rgb(10, 10, 10)")
        expect(result).toBeNull()
    })

    it("returns null when maxColors is set to 0", () => {
        const result = suggestRecipe(palette, "rgb(255, 0, 0)", { maxColors: 0 })
        expect(result).toBeNull()
    })

    it("evaluates 3-color recipes when enabled", () => {
        const threePalette = [
            { label: "Red", partsInMix: 0, rgbString: "rgb(255, 0, 0)" },
            { label: "Green", partsInMix: 0, rgbString: "rgb(0, 255, 0)" },
            { label: "Blue", partsInMix: 0, rgbString: "rgb(0, 0, 255)" },
        ]
        const latentR = mixbox.rgbToLatent(threePalette[ 0 ].rgbString)!
        const latentG = mixbox.rgbToLatent(threePalette[ 1 ].rgbString)!
        const latentB = mixbox.rgbToLatent(threePalette[ 2 ].rgbString)!
        const latentMix = latentR.map((value, index) => {
            return (value + latentG[ index ] + latentB[ index ]) / 3
        })
        const target = normalizeRgbString(mixbox.latentToRgb(latentMix))

        const result = suggestRecipe(threePalette, target, { maxColors: 3, maxTotalParts: 3 })
        expect(result).not.toBeNull()
        expect(result?.ingredients).toHaveLength(3)
    })

    it("uses the large palette branch when palette exceeds the threshold", () => {
        const bigPalette = Array.from({ length: 26 }, (_, index) => ({
            label: `Color ${ index }`,
            partsInMix: 0,
            rgbString: "rgb(10, 10, 10)",
        }))

        const result = suggestRecipe(bigPalette, "rgb(0, 0, 0)", { maxColors: 1 })
        expect(result).not.toBeNull()
    })

    it("supports createRecipeSuggester with empty palettes", () => {
        const suggester = createRecipeSuggester([])
        expect(suggester("rgb(0, 0, 0)")).toBeNull()
    })
})

describe("__testOnly helpers", () => {
    it("returns null when mixLatents receives zero total parts", () => {
        const result = __testOnly.mixLatents([], [ [ 0, 0, 0, 0, 0, 0, 0 ] ])
        expect(result).toBeNull()
    })

    it("returns null when mixLatents encounters missing latents", () => {
        const result = __testOnly.mixLatents([ { index: 0, parts: 1 } ], [ null ])
        expect(result).toBeNull()
    })

    it("prefers candidates with fewer ingredients when deltaE is equal", () => {
        const best = {
            ingredients: [ { index: 0, parts: 1 }, { index: 1, parts: 1 } ],
            resultRgb: "rgb(0, 0, 0)",
            deltaE: 1,
            matchPct: 99,
            totalParts: 2,
        }
        const candidate = {
            ingredients: [ { index: 0, parts: 1 } ],
            resultRgb: "rgb(0, 0, 0)",
            deltaE: 1,
            matchPct: 99,
            totalParts: 1,
        }

        expect(__testOnly.pickBestCandidate(best, candidate)).toBe(candidate)
    })

    it("prefers candidates with fewer total parts on ties", () => {
        const best = {
            ingredients: [ { index: 0, parts: 2 } ],
            resultRgb: "rgb(0, 0, 0)",
            deltaE: 2,
            matchPct: 98,
            totalParts: 2,
        }
        const candidate = {
            ingredients: [ { index: 0, parts: 1 } ],
            resultRgb: "rgb(0, 0, 0)",
            deltaE: 2,
            matchPct: 98,
            totalParts: 1,
        }

        expect(__testOnly.pickBestCandidate(best, candidate)).toBe(candidate)
    })

    it("returns null from evaluateCandidate when latents are missing", () => {
        const targetLab = { l: 0, a: 0, b: 0 }
        const result = __testOnly.evaluateCandidate(
            [ { index: 0, parts: 1 } ],
            [ null ],
            targetLab
        )

        expect(result).toBeNull()
    })
})
