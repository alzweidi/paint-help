import {
    extractDominantColorsFromPixels,
    pickAutoColorCount,
    selectDistinctColors,
} from "../../utils/extractDominantColors"
import { ExtractedColor } from "../../types/types"

const MAX_DIMENSION = 480
const AUTO_MAX_COLORS_DOMINANT = 12
const AUTO_MAX_COLORS_DISTINCT = 32
const AUTO_MIN_COLORS_DOMINANT = 5
const AUTO_MIN_COLORS_DISTINCT = 8
const AUTO_COVERAGE_PCT_DOMINANT = 99
const AUTO_COVERAGE_PCT_DISTINCT = 99.5
const DISTINCT_CANDIDATE_MULTIPLIER = 2
const MAX_DISTINCT_CANDIDATES = 64

type ExtractionMode = "dominant" | "distinct"

export type RegionBounds = {
    x: number
    y: number
    width: number
    height: number
}

type ExtractColorsOptions = {
    mode?: ExtractionMode
    region?: RegionBounds
}

const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error("Failed to load image"))
        img.src = src
    })
}

const toExtractedColors = (colors: string[], clusterSizes: number[]): ExtractedColor[] => {
    const total = clusterSizes.reduce((sum, size) => sum + size, 0)
    return colors
        .map((rgbString, index) => {
            const size = clusterSizes[ index ] ?? 0
            const coveragePct = total > 0 ? (size / total) * 100 : 0
            return { rgbString, coveragePct, index }
        })
        .sort((a, b) => (b.coveragePct - a.coveragePct) || (a.index - b.index))
        .map(({ rgbString, coveragePct }) => ({ rgbString, coveragePct }))
}

const selectColors = (
    colors: string[],
    clusterSizes: number[],
    count: number,
    mode: ExtractionMode
) => {
    if (mode === "distinct") {
        return selectDistinctColors(colors, clusterSizes, count)
    }

    return {
        colors: colors.slice(0, count),
        clusterSizes: clusterSizes.slice(0, count),
    }
}

const resolveCandidateCount = (targetCount: number, mode: ExtractionMode) => {
    if (mode !== "distinct") {
        return targetCount
    }

    const expanded = Math.floor(targetCount * DISTINCT_CANDIDATE_MULTIPLIER)
    const capped = Math.min(expanded, MAX_DISTINCT_CANDIDATES)
    return Math.max(targetCount, capped)
}

export const useImageColorExtraction = () => {
    const extractColors = async (
        file: File,
        colorCount: number | "auto",
        options?: ExtractColorsOptions
    ): Promise<ExtractedColor[]> => {
        const mode = options?.mode ?? "dominant"
        const objectUrl = URL.createObjectURL(file)

        try {
            const image = await loadImage(objectUrl)
            let targetWidth = image.width
            let targetHeight = image.height

            if (targetWidth > targetHeight && targetWidth > MAX_DIMENSION) {
                const scale = MAX_DIMENSION / targetWidth
                targetWidth = MAX_DIMENSION
                targetHeight = Math.round(targetHeight * scale)
            } else if (targetHeight >= targetWidth && targetHeight > MAX_DIMENSION) {
                const scale = MAX_DIMENSION / targetHeight
                targetHeight = MAX_DIMENSION
                targetWidth = Math.round(targetWidth * scale)
            }

            const canvas = document.createElement("canvas")
            canvas.width = targetWidth
            canvas.height = targetHeight
            const ctx = canvas.getContext("2d")
            if (!ctx) {
                return []
            }

            ctx.drawImage(image, 0, 0, targetWidth, targetHeight)

            let pixelData: Uint8ClampedArray
            const region = options?.region

            if (region) {
                const regionX = Math.floor((region.x / 100) * targetWidth)
                const regionY = Math.floor((region.y / 100) * targetHeight)
                const regionW = Math.max(1, Math.floor((region.width / 100) * targetWidth))
                const regionH = Math.max(1, Math.floor((region.height / 100) * targetHeight))

                pixelData = ctx.getImageData(regionX, regionY, regionW, regionH).data
            } else {
                pixelData = ctx.getImageData(0, 0, targetWidth, targetHeight).data
            }

            const pixels = pixelData

            if (colorCount === "auto") {
                const maxColors =
                    mode === "distinct" ? AUTO_MAX_COLORS_DISTINCT : AUTO_MAX_COLORS_DOMINANT
                const candidateCount = resolveCandidateCount(maxColors, mode)
                const extraction = extractDominantColorsFromPixels(pixels, candidateCount)
                const autoCount = pickAutoColorCount(extraction.clusterSizes, {
                    coveragePct:
                        mode === "distinct"
                            ? AUTO_COVERAGE_PCT_DISTINCT
                            : AUTO_COVERAGE_PCT_DOMINANT,
                    min: mode === "distinct" ? AUTO_MIN_COLORS_DISTINCT : AUTO_MIN_COLORS_DOMINANT,
                    max: maxColors,
                })
                const selected = selectColors(
                    extraction.colors,
                    extraction.clusterSizes,
                    autoCount,
                    mode
                )
                return toExtractedColors(selected.colors, selected.clusterSizes)
            }

            const requestedCount = Math.max(0, Math.floor(colorCount))
            if (requestedCount === 0) {
                return []
            }

            const candidateCount = resolveCandidateCount(requestedCount, mode)
            const extraction = extractDominantColorsFromPixels(pixels, candidateCount)
            const selected = selectColors(
                extraction.colors,
                extraction.clusterSizes,
                requestedCount,
                mode
            )
            return toExtractedColors(selected.colors, selected.clusterSizes)
        } finally {
            URL.revokeObjectURL(objectUrl)
        }
    }

    return { extractColors }
}
