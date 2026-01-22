import {
    extractDominantColorsFromPixels,
    pickAutoColorCount,
    selectDistinctColors,
} from "./extractDominantColors"

describe("extractDominantColorsFromPixels", () => {
    it("returns empty output for invalid inputs", () => {
        const result = extractDominantColorsFromPixels(new Uint8ClampedArray([]), 0)

        expect(result.colors).toEqual([])
        expect(result.clusterSizes).toEqual([])
    })

    it("returns dominant colors sorted by cluster size", () => {
        const pixels = new Uint8ClampedArray([
            255, 0, 0, 255,
            255, 0, 0, 255,
            255, 0, 0, 255,
            255, 0, 0, 255,
            0, 0, 255, 255,
            0, 0, 255, 255,
        ])

        const result = extractDominantColorsFromPixels(pixels, 2)

        expect(result.colors).toEqual([ "rgb(255, 0, 0)", "rgb(0, 0, 255)" ])
        expect(result.clusterSizes).toEqual([ 4, 2 ])
    })

    it("handles tied cluster sizes with centroid tie-breakers", () => {
        const pixels = new Uint8ClampedArray([
            10, 20, 30, 255,
            200, 20, 30, 255,
        ])

        const result = extractDominantColorsFromPixels(pixels, 2)

        expect(result.clusterSizes).toEqual([ 1, 1 ])
        expect(result.colors).toEqual([ "rgb(10, 20, 30)", "rgb(200, 20, 30)" ])
    })

    it("uses the green channel as a secondary tie-breaker", () => {
        const pixels = new Uint8ClampedArray([
            10, 20, 30, 255,
            10, 200, 30, 255,
        ])

        const result = extractDominantColorsFromPixels(pixels, 2)

        expect(result.clusterSizes).toEqual([ 1, 1 ])
        expect(result.colors).toEqual([ "rgb(10, 20, 30)", "rgb(10, 200, 30)" ])
    })

    it("uses the blue channel as a tertiary tie-breaker", () => {
        const pixels = new Uint8ClampedArray([
            10, 20, 30, 255,
            10, 20, 200, 255,
        ])

        const result = extractDominantColorsFromPixels(pixels, 2)

        expect(result.clusterSizes).toEqual([ 1, 1 ])
        expect(result.colors).toEqual([ "rgb(10, 20, 30)", "rgb(10, 20, 200)" ])
    })

    it("keeps empty clusters when centroids overlap", () => {
        const pixels = new Uint8ClampedArray([
            50, 50, 50, 255,
            50, 50, 50, 255,
        ])

        const result = extractDominantColorsFromPixels(pixels, 2)

        expect(result.clusterSizes).toEqual([ 2, 0 ])
    })

    it("ignores transparent pixels", () => {
        const pixels = new Uint8ClampedArray([
            255, 0, 0, 255,
            0, 255, 0, 0,
            255, 0, 0, 255,
        ])

        const result = extractDominantColorsFromPixels(pixels, 1)

        expect(result.colors).toEqual([ "rgb(255, 0, 0)" ])
        expect(result.clusterSizes).toEqual([ 2 ])
    })

    it("returns empty output when no visible pixels exist", () => {
        const pixels = new Uint8ClampedArray([
            0, 0, 0, 0,
            0, 0, 0, 0,
        ])

        const result = extractDominantColorsFromPixels(pixels, 3)

        expect(result.colors).toEqual([])
        expect(result.clusterSizes).toEqual([])
    })

    it("uses hashed sampling when the pixel set is large", () => {
        const totalPixels = 240000
        const pixels = new Uint8ClampedArray(totalPixels * 4)

        for (let i = 0; i < totalPixels; i++) {
            const idx = i * 4
            pixels[ idx ] = 10
            pixels[ idx + 1 ] = 20
            pixels[ idx + 2 ] = 30
            pixels[ idx + 3 ] = 255
        }

        const result = extractDominantColorsFromPixels(pixels, 1)

        expect(result.colors).toEqual([ "rgb(10, 20, 30)" ])
        expect(result.clusterSizes[ 0 ]).toBeGreaterThan(0)
    })

    it("prefers distinct colors over near-duplicates when selecting a subset", () => {
        const pixels: number[] = []
        const pushPixel = (r: number, g: number, b: number, count: number) => {
            for (let i = 0; i < count; i++) {
                pixels.push(r, g, b, 255)
            }
        }

        pushPixel(0, 0, 0, 6)
        pushPixel(20, 20, 20, 5)
        pushPixel(255, 255, 0, 1)

        const extraction = extractDominantColorsFromPixels(new Uint8ClampedArray(pixels), 3)
        const selection = selectDistinctColors(extraction.colors, extraction.clusterSizes, 2)

        expect(selection.colors).toEqual([ "rgb(0, 0, 0)", "rgb(255, 255, 0)" ])
        expect(selection.clusterSizes).toEqual([ 6, 1 ])
    })
})

describe("selectDistinctColors", () => {
    it("returns empty output when count is zero", () => {
        expect(selectDistinctColors([ "rgb(0, 0, 0)" ], [ 1 ], 0)).toEqual({
            colors: [],
            clusterSizes: [],
        })
    })

    it("returns empty output when all clusters have zero size", () => {
        expect(selectDistinctColors([ "rgb(0, 0, 0)", "rgb(255, 255, 255)" ], [ 0, 0 ], 2)).toEqual({
            colors: [],
            clusterSizes: [],
        })
    })

    it("treats missing cluster sizes as zero", () => {
        const selection = selectDistinctColors(
            [ "rgb(255, 0, 0)", "rgb(0, 0, 255)" ],
            [ 2 ],
            2
        )

        expect(selection.colors).toEqual([ "rgb(255, 0, 0)" ])
        expect(selection.clusterSizes).toEqual([ 2 ])
    })

    it("returns all candidates sorted by size when count exceeds available", () => {
        const selection = selectDistinctColors(
            [ "rgb(255, 0, 0)", "rgb(0, 0, 255)", "rgb(0, 255, 0)" ],
            [ 1, 3, 2 ],
            10
        )

        expect(selection.colors).toEqual([ "rgb(0, 0, 255)", "rgb(0, 255, 0)", "rgb(255, 0, 0)" ])
        expect(selection.clusterSizes).toEqual([ 3, 2, 1 ])
    })

    it("chooses the most distant candidate when distances differ", () => {
        const selection = selectDistinctColors(
            [ "rgb(0, 0, 0)", "rgb(255, 255, 255)", "rgb(10, 10, 10)" ],
            [ 10, 1, 1 ],
            2
        )

        expect(selection.colors).toEqual([ "rgb(0, 0, 0)", "rgb(255, 255, 255)" ])
        expect(selection.clusterSizes).toEqual([ 10, 1 ])
    })

    it("prefers larger clusters when distances tie", () => {
        const selection = selectDistinctColors(
            [ "rgb(255, 255, 255)", "rgb(0, 0, 0)", "rgb(0, 0, 0)" ],
            [ 10, 5, 1 ],
            2
        )

        expect(selection.colors).toEqual([ "rgb(255, 255, 255)", "rgb(0, 0, 0)" ])
        expect(selection.clusterSizes).toEqual([ 10, 5 ])
    })

    it("prefers lower indices when size and distance tie", () => {
        const selection = selectDistinctColors(
            [ "rgb(255, 255, 255)", "rgb(0, 0, 0)", "rgb(0, 0, 0)" ],
            [ 10, 2, 2 ],
            2
        )

        expect(selection.colors).toEqual([ "rgb(255, 255, 255)", "rgb(0, 0, 0)" ])
        expect(selection.clusterSizes).toEqual([ 10, 2 ])
    })
})

describe("pickAutoColorCount", () => {
    it("returns 0 for empty clusters", () => {
        expect(pickAutoColorCount([])).toBe(0)
    })

    it("returns 0 when total cluster size is zero", () => {
        expect(pickAutoColorCount([ 0, 0, 0 ])).toBe(0)
    })

    it("picks the smallest count meeting coverage", () => {
        const count = pickAutoColorCount([ 60, 25, 10, 5 ], {
            coveragePct: 90,
            min: 1,
            max: 4,
        })

        expect(count).toBe(3)
    })

    it("clamps to max", () => {
        const count = pickAutoColorCount([ 40, 30, 20, 10 ], {
            coveragePct: 99,
            min: 1,
            max: 2,
        })

        expect(count).toBe(2)
    })
})
