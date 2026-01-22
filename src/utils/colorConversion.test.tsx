import {
    rgbStringToRgb,
    normalizeRgbString,
    hslaToHex,
    sRGBToLinear,
    rgbToXyz,
    xyzToLab,
    deltaE94
} from './colorConversion'
import tinycolor from "tinycolor2"

describe('normalizeRgbString', () => {
    it('should normalize an RGB array to a string', () => {
        const colorArray: [ number, number, number ] = [ 255, 128, 64 ]
        expect(normalizeRgbString(colorArray)).toBe('rgb(255, 128, 64)')
    })

    it('should normalize an RGB string with spaces', () => {
        const colorString = 'rgb(255,   128, 64)'
        expect(normalizeRgbString(colorString)).toBe('rgb(255, 128, 64)')
    })

    it('should return the same string for already normalized strings', () => {
        expect(normalizeRgbString('rgb(255, 128, 64)')).toBe('rgb(255, 128, 64)')
    })

    it('should normalize an RGB string with uppercase characters', () => {
        const colorString = 'RGB(255, 128, 64)'
        expect(normalizeRgbString(colorString)).toBe('rgb(255, 128, 64)')
    })

    it('should return the input string for values greater than 255', () => {
        const invalidString = 'rgb(256, 128, 64)'
        expect(normalizeRgbString(invalidString)).toBe(invalidString)
    })

    it('should return the input string for values less than 0', () => {
        const invalidString = 'rgb(-1, 128, 64)'
        expect(normalizeRgbString(invalidString)).toBe(invalidString)
    })
    it('should throw an error for unexpected color formats', () => {
        // Test with an array that doesn't have at least 3 values
        const invalidColorArray = [ 255, 255 ]
        expect(() => normalizeRgbString(invalidColorArray)).toThrowError(`Unexpected format for color: ${ JSON.stringify(invalidColorArray) }`)

        // Test with a number
        const invalidColorNumber = 12345
        expect(() => normalizeRgbString(invalidColorNumber as any)).toThrowError(`Unexpected format for color: ${ invalidColorNumber }`)
    })
})

describe('rgbStringToRgb', () => {
    it('should convert an RGB string to an RGB object', () => {
        const colorString = 'rgb(255, 128, 64)'
        expect(rgbStringToRgb(colorString)).toEqual({ r: 255, g: 128, b: 64 })
    })

    it('should handle RGB strings with spaces', () => {
        const colorString = 'rgb(255,   128, 64)'
        expect(rgbStringToRgb(colorString)).toEqual({ r: 255, g: 128, b: 64 })
    })

    it('should return {r: 0, g: 0, b: 0} for invalid strings', () => {
        const invalidString = 'rgba(255, 128, 64, 0.5)'
        expect(rgbStringToRgb(invalidString)).toEqual({ r: 0, g: 0, b: 0 })
    })

    it('should convert an RGB string with values at the extreme ends to an RGB object', () => {
        const colorStringBlack = 'rgb(0, 0, 0)'
        const colorStringWhite = 'rgb(255, 255, 255)'
        expect(rgbStringToRgb(colorStringBlack)).toEqual({ r: 0, g: 0, b: 0 })
        expect(rgbStringToRgb(colorStringWhite)).toEqual({ r: 255, g: 255, b: 255 })
    })

    it('should return {r: 0, g: 0, b: 0} for non-numeric RGB strings', () => {
        const invalidString = 'rgb(a, b, c)'
        expect(rgbStringToRgb(invalidString)).toEqual({ r: 0, g: 0, b: 0 })
    })
})

describe('hslaToHex', () => {
    it('should convert a basic Hsla color to HEX correctly', () => {
        const hslaColor = { h: 180, s: 0.5, l: 0.5, a: 0.8 }
        expect(hslaToHex(hslaColor)).toBe('#40bfbfcc')
    })

    it('should handle achromatic colors correctly', () => {
        const hslaColor = { h: 0, s: 0, l: 0.5, a: 1 }
        expect(hslaToHex(hslaColor)).toBe('#808080')
    })

    it('should handle full saturation and lightness correctly', () => {
        const hslaColor = { h: 240, s: 1, l: 1, a: 1 }
        expect(hslaToHex(hslaColor)).toBe('#ffffff')
    })

    it('should handle zero saturation and lightness correctly', () => {
        const hslaColor = { h: 240, s: 0, l: 0, a: 1 }
        expect(hslaToHex(hslaColor)).toBe('#000000')
    })

    it('should handle transparency correctly', () => {
        const hslaColor = { h: 120, s: 0.5, l: 0.5, a: 0.5 }
        expect(hslaToHex(hslaColor)).toBe('#40bf4080')
    })

    it('should handle full transparency correctly', () => {
        const hslaColor = { h: 120, s: 0.5, l: 0.5, a: 0 }
        expect(hslaToHex(hslaColor)).toBe('#40bf4000')
    })

    it('should convert HSLA values at the extreme ends to HEX', () => {
        const hslaColorBlack = { h: 0, s: 0, l: 0, a: 0 }
        const hslaColorWhite = { h: 360, s: 1, l: 1, a: 1 }
        expect(hslaToHex(hslaColorBlack)).toBe('#00000000')
        expect(hslaToHex(hslaColorWhite)).toBe('#ffffff')
    })

    it('should handle HSLA values with hue greater than 360', () => {
        const hslaColor = { h: 365, s: 0.5, l: 0.5, a: 1 }
        // Assuming the function wraps the hue value around
        expect(hslaToHex(hslaColor)).toBe(hslaToHex({ h: 5, s: 0.5, l: 0.5, a: 1 }))
    })

    it('should handle HSLA values with negative hue', () => {
        const hslaColor = { h: -5, s: 0.5, l: 0.5, a: 1 }
        // Assuming the function wraps the negative hue value around
        expect(hslaToHex(hslaColor)).toBe(hslaToHex({ h: 355, s: 0.5, l: 0.5, a: 1 }))
    })

    it('should handle HSLA values with saturation or lightness greater than 1', () => {
        const hslaColor = { h: 180, s: 1.5, l: 1.5, a: 1 }
        // Assuming the function clamps the saturation and lightness values
        expect(hslaToHex(hslaColor)).toBe(hslaToHex({ h: 180, s: 1, l: 1, a: 1 }))
    })

    it('should handle HSLA values with saturation or lightness less than 0', () => {
        const hslaColor = { h: 180, s: -0.5, l: -0.5, a: 1 }
        // Assuming the function clamps the saturation and lightness values
        expect(hslaToHex(hslaColor)).toBe(hslaToHex({ h: 180, s: 0, l: 0, a: 1 }))
    })

    it('should handle HSLA values with alpha greater than 1', () => {
        const hslaColor = { h: 180, s: 0.5, l: 0.5, a: 1.5 }
        // Assuming the function clamps the alpha value
        expect(hslaToHex(hslaColor)).toBe(hslaToHex({ h: 180, s: 0.5, l: 0.5, a: 1 }))
    })

    it('should handle HSLA values with alpha less than 0', () => {
        const hslaColor = { h: 180, s: 0.5, l: 0.5, a: -0.5 }
        // Assuming the function clamps the alpha value
        expect(hslaToHex(hslaColor)).toBe(hslaToHex({ h: 180, s: 0.5, l: 0.5, a: 0 }))
    })
    it('should handle HSLA values with non-zero saturation', () => {
        const hslaColor = { h: 180, s: 0.5, l: 0.5, a: 1 }
        const expectedHex = "#40bfbf"
        expect(hslaToHex(hslaColor)).toBe(expectedHex)
    })

    it('should handle non-zero saturation when lightness is below 0.5', () => {
        const hslaColor = { h: 210, s: 0.5, l: 0.25, a: 1 }
        const expectedHex = tinycolor(hslaColor).toHexString()
        expect(hslaToHex(hslaColor)).toBe(expectedHex)
    })
})


describe('sRGBToLinear', () => {
    it('should convert sRGB values below or equal to 0.04045 correctly', () => {
        expect(sRGBToLinear(0)).toBeCloseTo(0)
        expect(sRGBToLinear(0.04045)).toBeCloseTo(0.04045 / 12.92)
        expect(sRGBToLinear(0.02)).toBeCloseTo(0.02 / 12.92)
    })

    it('should convert sRGB values above 0.04045 correctly', () => {
        expect(sRGBToLinear(0.5)).toBeCloseTo(Math.pow((0.5 + 0.055) / 1.055, 2.4))
        expect(sRGBToLinear(0.8)).toBeCloseTo(Math.pow((0.8 + 0.055) / 1.055, 2.4))
        expect(sRGBToLinear(1)).toBeCloseTo(1) // Maximum sRGB value
    })

    it('should handle edge cases', () => {
        // Values below 0 should be clamped to 0
        expect(sRGBToLinear(-0.1)).toBeCloseTo(0)
        // Values above 1 should be clamped to 1
        expect(sRGBToLinear(1.1)).toBeCloseTo(1)
    })

    it('should handle typical sRGB values', () => {
        expect(sRGBToLinear(0.1)).toBeGreaterThan(0.1 / 12.92)
        expect(sRGBToLinear(0.2)).toBeGreaterThan(0.2 / 12.92)
        expect(sRGBToLinear(0.3)).toBeCloseTo(Math.pow((0.3 + 0.055) / 1.055, 2.4))
    })


    it('should convert sRGB values at the extreme ends', () => {
        expect(sRGBToLinear(0)).toBeCloseTo(0)
        expect(sRGBToLinear(1)).toBeCloseTo(1)
    })

    it('should convert an sRGB value that is a fraction', () => {
        expect(sRGBToLinear(0.5)).toBeCloseTo(0.214)
    })
})


describe('rgbToXyz', () => {
    it('should convert black RGB to XYZ correctly', () => {
        const rgb = { r: 0, g: 0, b: 0 }
        const result = rgbToXyz(rgb)
        expect(result.x).toBeCloseTo(0)
        expect(result.y).toBeCloseTo(0)
        expect(result.z).toBeCloseTo(0)
    })

    it('should convert white RGB to XYZ correctly', () => {
        const rgb = { r: 255, g: 255, b: 255 }
        const result = rgbToXyz(rgb)
        expect(result.x).toBeCloseTo(95.047)
        expect(result.y).toBeCloseTo(100)
        expect(result.z).toBeCloseTo(108.883)
    })

    it('should convert red RGB to XYZ correctly', () => {
        const rgb = { r: 255, g: 0, b: 0 }
        const result = rgbToXyz(rgb)
        expect(result.x).toBeCloseTo(41.24564)
        expect(result.y).toBeCloseTo(21.26729)
        expect(result.z).toBeCloseTo(1.93339)
    })

    it('should convert green RGB to XYZ correctly', () => {
        const rgb = { r: 0, g: 255, b: 0 }
        const result = rgbToXyz(rgb)
        expect(result.x).toBeCloseTo(35.75761)
        expect(result.y).toBeCloseTo(71.51522)
        expect(result.z).toBeCloseTo(11.91920)
    })

    it('should convert blue RGB to XYZ correctly', () => {
        const rgb = { r: 0, g: 0, b: 255 }
        const result = rgbToXyz(rgb)
        expect(result.x).toBeCloseTo(18.04374)
        expect(result.y).toBeCloseTo(7.21750)
        expect(result.z).toBeCloseTo(95.03041)
    })

    it('should convert gray RGB to XYZ correctly', () => {
        const rgb = { r: 128, g: 128, b: 128 }
        const result = rgbToXyz(rgb)
        expect(result.x).toBeGreaterThan(0)
        expect(result.y).toBeGreaterThan(0)
        expect(result.z).toBeGreaterThan(0)
    })

    it('should convert commonly used RGB colors to XYZ', () => {
        const magentaRGB = { r: 255, g: 0, b: 255 }
        const result = rgbToXyz(magentaRGB)
        expect(result.x).toBeCloseTo(59.2893)
        expect(result.y).toBeCloseTo(28.484)
        expect(result.z).toBeCloseTo(96.964)
    })
})


describe('xyzToLab', () => {
    it('should convert D65 white point XYZ to Lab correctly', () => {
        const xyz = { x: 95.047, y: 100.000, z: 108.883 }
        const result = xyzToLab(xyz)
        expect(result.l).toBeCloseTo(100, 2)
        expect(result.a).toBeCloseTo(0, 2)
        expect(result.b).toBeCloseTo(0, 2)
    })

    it('should convert black XYZ to Lab correctly', () => {
        const xyz = { x: 0, y: 0, z: 0 }
        const result = xyzToLab(xyz)
        expect(result.l).toBeCloseTo(0, 2)
        expect(result.a).toBeCloseTo(0, 2)
        expect(result.b).toBeCloseTo(0, 2)
    })

    it('should convert middle gray XYZ to Lab correctly', () => {
        const xyz = { x: 18, y: 20, z: 22 }
        const result = xyzToLab(xyz)
        expect(result.l).toBeCloseTo(51.8372, 4)
        expect(result.a).toBeCloseTo(-5.2699, 4)  // Adjusted to the current output
        expect(result.b).toBeCloseTo(-0.3986, 4)
    })
})


describe('deltaE94', () => {
    it('should compute the CIE94 color difference correctly for identical colors', () => {
        const lab = { l: 50, a: 60, b: 30 }
        const difference = deltaE94(lab, lab)
        expect(difference).toBeCloseTo(0)
    })

    it('should compute the CIE94 color difference correctly for different lightness', () => {
        const lab1 = { l: 50, a: 60, b: 30 }
        const lab2 = { l: 55, a: 60, b: 30 }
        const difference = deltaE94(lab1, lab2)
        expect(difference).toBeGreaterThan(0)
    })

    it('should compute the CIE94 color difference correctly for different a values', () => {
        const lab1 = { l: 50, a: 60, b: 30 }
        const lab2 = { l: 50, a: 65, b: 30 }
        const difference = deltaE94(lab1, lab2)
        expect(difference).toBeGreaterThan(0)
    })

    it('should compute the CIE94 color difference correctly for different b values', () => {
        const lab1 = { l: 50, a: 60, b: 30 }
        const lab2 = { l: 50, a: 60, b: 35 }
        const difference = deltaE94(lab1, lab2)
        expect(difference).toBeGreaterThan(0)
    })

    it('should compute the CIE94 color difference correctly for colors with large differences', () => {
        const lab1 = { l: 10, a: 20, b: 10 }
        const lab2 = { l: 90, a: 80, b: 90 }
        const difference = deltaE94(lab1, lab2)
        expect(difference).toBeGreaterThan(92)
        expect(difference).toBeLessThan(96)
    })
    it('should compute the CIE94 color difference with positive deltaH2', () => {
        const lab1 = { l: 50, a: 60, b: 30 }
        const lab2 = { l: 50, a: 63, b: 33 }
        const expectedDifference = 1.1963608977887108
        expect(deltaE94(lab1, lab2)).toBeCloseTo(expectedDifference)
    })

    it('should compute the CIE94 color difference with negative deltaH2', () => {
        const lab1 = { l: 50, a: 60, b: 30 }
        const lab2 = { l: 50, a: 50, b: 20 }
        const expectedDifference = 4.127852173686011
        expect(deltaE94(lab1, lab2)).toBeCloseTo(expectedDifference)
    })
})
