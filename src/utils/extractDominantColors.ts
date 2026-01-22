import { deltaE94, rgbStringToRgb, rgbToXyz, xyzToLab } from "./colorConversion"

type RgbSample = [ number, number, number ]

const MAX_SAMPLE_PIXELS = 120000
const MIN_ALPHA = 128
const KMEANS_ITERATIONS = 10
const HASH_MULTIPLIER = 2654435761

const clampToByte = (value: number): number => {
    return Math.max(0, Math.min(255, Math.round(value)))
}

const getSamplePixels = (pixels: Uint8ClampedArray): RgbSample[] => {
    const totalPixels = Math.floor(pixels.length / 4)
    const stride = Math.max(1, Math.floor(totalPixels / MAX_SAMPLE_PIXELS))
    const samples: RgbSample[] = []

    for (let i = 0; i < totalPixels; i++) {
        if (stride > 1) {
            const hash = (i * HASH_MULTIPLIER) >>> 0
            if (hash % stride !== 0) {
                continue
            }
        }
        const idx = i * 4
        const alpha = pixels[ idx + 3 ]
        if (alpha < MIN_ALPHA) {
            continue
        }
        samples.push([ pixels[ idx ], pixels[ idx + 1 ], pixels[ idx + 2 ] ])
    }

    return samples
}

const rgbStringToLab = (rgbString: string) => {
    const rgb = rgbStringToRgb(rgbString)
    return xyzToLab(rgbToXyz(rgb))
}

type DistinctSelection = {
    colors: string[]
    clusterSizes: number[]
}

export const selectDistinctColors = (
    colors: string[],
    clusterSizes: number[],
    desiredCount: number
): DistinctSelection => {
    const count = Math.max(0, Math.floor(desiredCount))
    if (!colors.length || count === 0) {
        return { colors: [], clusterSizes: [] }
    }

    const sizes = colors.map((_, index) => clusterSizes[ index ] ?? 0)
    const entries = colors.map((color, index) => ({
        index,
        color,
        size: sizes[ index ],
        lab: rgbStringToLab(color),
    }))

    const candidates = entries.filter((entry) => entry.size > 0)
    if (!candidates.length) {
        return { colors: [], clusterSizes: [] }
    }

    const sortedCandidates = candidates.slice().sort((a, b) => (b.size - a.size) || (a.index - b.index))

    const targetCount = Math.min(count, candidates.length)
    if (targetCount >= candidates.length) {
        return {
            colors: sortedCandidates.map((entry) => entry.color),
            clusterSizes: sortedCandidates.map((entry) => entry.size),
        }
    }

    const initialCandidate = sortedCandidates[ 0 ]
    const selected: typeof candidates = [ initialCandidate ]
    const selectedIndexSet = new Set([ initialCandidate.index ])
    const epsilon = 1e-6

    while (selected.length < targetCount) {
        const remainingCandidates = candidates.filter((candidate) => !selectedIndexSet.has(candidate.index))
        let bestCandidate = remainingCandidates[ remainingCandidates.length - 1 ]
        let bestDistance = Number.POSITIVE_INFINITY

        for (const picked of selected) {
            const distance = deltaE94(bestCandidate.lab, picked.lab)
            if (distance < bestDistance) {
                bestDistance = distance
            }
        }

        for (let i = remainingCandidates.length - 1; i >= 0; i--) {
            const candidate = remainingCandidates[ i ]
            if (candidate.index === bestCandidate.index) {
                continue
            }
            let minDistance = Number.POSITIVE_INFINITY
            for (const picked of selected) {
                const distance = deltaE94(candidate.lab, picked.lab)
                if (distance < minDistance) {
                    minDistance = distance
                }
            }

            if (minDistance > bestDistance + epsilon) {
                bestCandidate = candidate
                bestDistance = minDistance
                continue
            }

            if (Math.abs(minDistance - bestDistance) <= epsilon) {
                if (candidate.size > bestCandidate.size) {
                    bestCandidate = candidate
                    bestDistance = minDistance
                    continue
                }
                if (
                    candidate.size === bestCandidate.size &&
                    candidate.index < bestCandidate.index
                ) {
                    bestCandidate = candidate
                    bestDistance = minDistance
                }
            }
        }

        selected.push(bestCandidate)
        selectedIndexSet.add(bestCandidate.index)
    }

    return {
        colors: selected.map((entry) => entry.color),
        clusterSizes: selected.map((entry) => entry.size),
    }
}

const distanceSquared = (a: RgbSample, b: RgbSample): number => {
    const dr = a[ 0 ] - b[ 0 ]
    const dg = a[ 1 ] - b[ 1 ]
    const db = a[ 2 ] - b[ 2 ]
    return dr * dr + dg * dg + db * db
}

const initializeCentroids = (samples: RgbSample[], k: number): RgbSample[] => {
    const centroids: RgbSample[] = []

    let sumR = 0
    let sumG = 0
    let sumB = 0
    for (let i = 0; i < samples.length; i++) {
        sumR += samples[ i ][ 0 ]
        sumG += samples[ i ][ 1 ]
        sumB += samples[ i ][ 2 ]
    }
    const mean: RgbSample = [
        sumR / samples.length,
        sumG / samples.length,
        sumB / samples.length,
    ]

    let firstIndex = 0
    let bestDistance = -1
    for (let i = 0; i < samples.length; i++) {
        const distance = distanceSquared(samples[ i ], mean)
        if (distance > bestDistance) {
            bestDistance = distance
            firstIndex = i
        }
    }

    const firstSample = samples[ firstIndex ]
    centroids.push([ firstSample[ 0 ], firstSample[ 1 ], firstSample[ 2 ] ])

    const minDistances = new Array(samples.length).fill(Number.POSITIVE_INFINITY)
    for (let i = 0; i < samples.length; i++) {
        minDistances[ i ] = distanceSquared(samples[ i ], centroids[ 0 ])
    }

    while (centroids.length < k) {
        let nextIndex = 0
        let nextDistance = -1
        for (let i = 0; i < samples.length; i++) {
            const distance = minDistances[ i ]
            if (distance > nextDistance) {
                nextDistance = distance
                nextIndex = i
            }
        }

        const nextSample = samples[ nextIndex ]
        centroids.push([ nextSample[ 0 ], nextSample[ 1 ], nextSample[ 2 ] ])

        for (let i = 0; i < samples.length; i++) {
            const distance = distanceSquared(samples[ i ], centroids[ centroids.length - 1 ])
            if (distance < minDistances[ i ]) {
                minDistances[ i ] = distance
            }
        }
    }

    return centroids
}

const findNearestCentroidIndex = (sample: RgbSample, centroids: RgbSample[]): number => {
    let bestIndex = 0
    let bestDistance = Number.POSITIVE_INFINITY

    for (let i = 0; i < centroids.length; i++) {
        const centroid = centroids[ i ]
        const distance = distanceSquared(sample, centroid)
        if (distance < bestDistance) {
            bestDistance = distance
            bestIndex = i
        }
    }

    return bestIndex
}

const computeClusterSizesFromPixels = (pixels: Uint8ClampedArray, centroids: RgbSample[]): number[] => {
    const sizes = new Array(centroids.length).fill(0)
    const totalPixels = Math.floor(pixels.length / 4)

    for (let i = 0; i < totalPixels; i++) {
        const idx = i * 4
        const alpha = pixels[ idx + 3 ]
        if (alpha < MIN_ALPHA) {
            continue
        }
        const sample: RgbSample = [ pixels[ idx ], pixels[ idx + 1 ], pixels[ idx + 2 ] ]
        const nearest = findNearestCentroidIndex(sample, centroids)
        sizes[ nearest ] += 1
    }

    return sizes
}

export const extractDominantColorsFromPixels = (
    pixels: Uint8ClampedArray,
    colorCount: number
): { colors: string[]; clusterSizes: number[] } => {
    const requestedCount = Math.floor(colorCount)
    if (!pixels || pixels.length < 4 || requestedCount <= 0) {
        return { colors: [], clusterSizes: [] }
    }

    const samples = getSamplePixels(pixels)
    if (samples.length === 0) {
        return { colors: [], clusterSizes: [] }
    }

    const k = Math.min(requestedCount, samples.length)
    let centroids = initializeCentroids(samples, k)

    for (let iteration = 0; iteration < KMEANS_ITERATIONS; iteration++) {
        const sumR = new Array(k).fill(0)
        const sumG = new Array(k).fill(0)
        const sumB = new Array(k).fill(0)
        const counts = new Array(k).fill(0)

        for (let i = 0; i < samples.length; i++) {
            const sample = samples[ i ]
            const nearest = findNearestCentroidIndex(sample, centroids)
            sumR[ nearest ] += sample[ 0 ]
            sumG[ nearest ] += sample[ 1 ]
            sumB[ nearest ] += sample[ 2 ]
            counts[ nearest ] += 1
        }

        for (let i = 0; i < k; i++) {
            if (counts[ i ] === 0) {
                continue
            }
            centroids[ i ] = [
                sumR[ i ] / counts[ i ],
                sumG[ i ] / counts[ i ],
                sumB[ i ] / counts[ i ],
            ]
        }
    }

    const clusterSizes = computeClusterSizesFromPixels(pixels, centroids)
    const clusters = centroids.map((centroid, index) => ({
        centroid,
        size: clusterSizes[ index ],
    }))

    clusters.sort((a, b) => {
        if (b.size !== a.size) {
            return b.size - a.size
        }
        if (a.centroid[ 0 ] !== b.centroid[ 0 ]) {
            return a.centroid[ 0 ] - b.centroid[ 0 ]
        }
        if (a.centroid[ 1 ] !== b.centroid[ 1 ]) {
            return a.centroid[ 1 ] - b.centroid[ 1 ]
        }
        return a.centroid[ 2 ] - b.centroid[ 2 ]
    })

    return {
        colors: clusters.map((cluster) => {
            const [ r, g, b ] = cluster.centroid
            return `rgb(${ clampToByte(r) }, ${ clampToByte(g) }, ${ clampToByte(b) })`
        }),
        clusterSizes: clusters.map((cluster) => cluster.size),
    }
}

export const pickAutoColorCount = (
    clusterSizes: number[],
    options?: { coveragePct?: number; min?: number; max?: number }
): number => {
    if (!clusterSizes.length) {
        return 0
    }

    const coveragePct = options?.coveragePct ?? 99
    const min = options?.min ?? 5
    const max = options?.max ?? 12

    const total = clusterSizes.reduce((sum, size) => sum + size, 0)
    if (total <= 0) {
        return 0
    }

    let cumulative = 0
    let count = 0
    for (let i = 0; i < clusterSizes.length; i++) {
        cumulative += clusterSizes[ i ]
        count += 1
        if ((cumulative / total) * 100 >= coveragePct) {
            break
        }
    }

    const clampedMax = Math.min(max, clusterSizes.length)
    const clampedMin = Math.min(min, clampedMax)
    return Math.min(clampedMax, Math.max(clampedMin, count))
}
