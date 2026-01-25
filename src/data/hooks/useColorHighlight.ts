import { useCallback } from "react"
import tinycolor from "tinycolor2"

const MAX_DIMENSION = 480
const DEFAULT_TOLERANCE = 40
const DEFAULT_HEATMAP_MAX_DISTANCE = 180
const HEATMAP_ALPHA = 160

type RegionBounds = {
    x: number
    y: number
    width: number
    height: number
}

type HighlightOptions = {
    tolerance?: number
    region?: RegionBounds
    palette?: string[]
    paletteIndex?: number
}

type HeatmapOptions = {
    maxDistance?: number
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

const getScaledDimensions = (width: number, height: number) => {
    let targetWidth = width
    let targetHeight = height

    if (targetWidth > targetHeight && targetWidth > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / targetWidth
        targetWidth = MAX_DIMENSION
        targetHeight = Math.round(targetHeight * scale)
    } else if (targetHeight >= targetWidth && targetHeight > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / targetHeight
        targetHeight = MAX_DIMENSION
        targetWidth = Math.round(targetWidth * scale)
    }

    return { targetWidth, targetHeight }
}

const colorDistance = (
    r1: number,
    g1: number,
    b1: number,
    r2: number,
    g2: number,
    b2: number
): number => {
    const dr = r1 - r2
    const dg = g1 - g2
    const db = b1 - b2
    return Math.sqrt(dr * dr + dg * dg + db * db)
}

const colorDistanceSq = (
    r1: number,
    g1: number,
    b1: number,
    r2: number,
    g2: number,
    b2: number
): number => {
    const dr = r1 - r2
    const dg = g1 - g2
    const db = b1 - b2
    return dr * dr + dg * dg + db * db
}

export const useColorHighlight = () => {
    const generateHighlightMask = useCallback(
        async (
            imageUrl: string,
            targetColor: string,
            options?: HighlightOptions
        ): Promise<string | null> => {
            const tolerance = options?.tolerance ?? DEFAULT_TOLERANCE
            const palette = options?.palette
            const paletteIndex = options?.paletteIndex
            const usePaletteMatching = Array.isArray(palette) &&
                palette.length > 0 &&
                typeof paletteIndex === "number" &&
                paletteIndex >= 0 &&
                paletteIndex < palette.length
            const paletteColors = usePaletteMatching
                ? palette.map((color) => tinycolor(color).toRgb())
                : []
            const toleranceSq = tolerance * tolerance

            try {
                const image = await loadImage(imageUrl)
                const { targetWidth, targetHeight } = getScaledDimensions(image.width, image.height)

                const canvas = document.createElement("canvas")
                canvas.width = targetWidth
                canvas.height = targetHeight
                const ctx = canvas.getContext("2d")
                if (!ctx) {
                    return null
                }

                ctx.drawImage(image, 0, 0, targetWidth, targetHeight)
                const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight)
                const pixels = imageData.data

                const target = usePaletteMatching ? null : tinycolor(targetColor).toRgb()
                const region = options?.region

                let regionX = 0
                let regionY = 0
                let regionW = targetWidth
                let regionH = targetHeight

                if (region) {
                    regionX = Math.floor((region.x / 100) * targetWidth)
                    regionY = Math.floor((region.y / 100) * targetHeight)
                    regionW = Math.floor((region.width / 100) * targetWidth)
                    regionH = Math.floor((region.height / 100) * targetHeight)
                }

                for (let y = 0; y < targetHeight; y++) {
                    for (let x = 0; x < targetWidth; x++) {
                        const i = (y * targetWidth + x) * 4
                        const r = pixels[i]
                        const g = pixels[i + 1]
                        const b = pixels[i + 2]

                        const isInRegion = x >= regionX && x < regionX + regionW &&
                                           y >= regionY && y < regionY + regionH

                        if (isInRegion) {
                            let matches = false

                            if (usePaletteMatching) {
                                let bestIndex = 0
                                let bestDistance = Number.POSITIVE_INFINITY
                                for (let idx = 0; idx < paletteColors.length; idx++) {
                                    const swatch = paletteColors[ idx ]
                                    const distance = colorDistanceSq(r, g, b, swatch.r, swatch.g, swatch.b)
                                    if (distance < bestDistance) {
                                        bestDistance = distance
                                        bestIndex = idx
                                    }
                                }
                                matches = bestIndex === paletteIndex
                            } else if (target) {
                                const distanceSq = colorDistanceSq(r, g, b, target.r, target.g, target.b)
                                matches = distanceSq <= toleranceSq
                            }

                            if (matches) {
                                pixels[i] = 0
                                pixels[i + 1] = 255
                                pixels[i + 2] = 0
                                pixels[i + 3] = 200
                            } else {
                                pixels[i] = 0
                                pixels[i + 1] = 0
                                pixels[i + 2] = 0
                                pixels[i + 3] = 0
                            }
                        } else {
                            pixels[i] = 0
                            pixels[i + 1] = 0
                            pixels[i + 2] = 0
                            pixels[i + 3] = 0
                        }
                    }
                }

                ctx.putImageData(imageData, 0, 0)
                return canvas.toDataURL("image/png")
            } catch {
                return null
            }
        },
        []
    )

    const generateDifferenceHeatmap = useCallback(
        async (
            imageUrl: string,
            targetColor: string,
            options?: HeatmapOptions
        ): Promise<string | null> => {
            const maxDistance = Math.max(1, options?.maxDistance ?? DEFAULT_HEATMAP_MAX_DISTANCE)
            const distanceScale = 1 / maxDistance

            try {
                const image = await loadImage(imageUrl)
                const { targetWidth, targetHeight } = getScaledDimensions(image.width, image.height)

                const canvas = document.createElement("canvas")
                canvas.width = targetWidth
                canvas.height = targetHeight
                const ctx = canvas.getContext("2d")
                if (!ctx) {
                    return null
                }

                ctx.drawImage(image, 0, 0, targetWidth, targetHeight)
                const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight)
                const pixels = imageData.data

                const target = tinycolor(targetColor).toRgb()
                const region = options?.region

                let regionX = 0
                let regionY = 0
                let regionW = targetWidth
                let regionH = targetHeight

                if (region) {
                    regionX = Math.floor((region.x / 100) * targetWidth)
                    regionY = Math.floor((region.y / 100) * targetHeight)
                    regionW = Math.floor((region.width / 100) * targetWidth)
                    regionH = Math.floor((region.height / 100) * targetHeight)
                }

                for (let y = 0; y < targetHeight; y++) {
                    for (let x = 0; x < targetWidth; x++) {
                        const i = (y * targetWidth + x) * 4
                        const isInRegion = x >= regionX && x < regionX + regionW &&
                                           y >= regionY && y < regionY + regionH

                        if (isInRegion) {
                            const r = pixels[i]
                            const g = pixels[i + 1]
                            const b = pixels[i + 2]
                            const distance = colorDistance(r, g, b, target.r, target.g, target.b)
                            const normalized = Math.min(distance * distanceScale, 1)
                            const heatR = Math.round(255 * normalized)
                            const heatG = Math.round(255 * (1 - normalized))

                            pixels[i] = heatR
                            pixels[i + 1] = heatG
                            pixels[i + 2] = 0
                            pixels[i + 3] = HEATMAP_ALPHA
                        } else {
                            pixels[i] = 0
                            pixels[i + 1] = 0
                            pixels[i + 2] = 0
                            pixels[i + 3] = 0
                        }
                    }
                }

                ctx.putImageData(imageData, 0, 0)
                return canvas.toDataURL("image/png")
            } catch {
                return null
            }
        },
        []
    )

    return { generateHighlightMask, generateDifferenceHeatmap }
}
