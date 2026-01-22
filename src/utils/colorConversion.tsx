type Rgb = { r: number, g: number, b: number, a?: number }
type Xyz = { x: number, y: number, z: number }
type Lab = { l: number, a: number, b: number }
type Hsla = { h: number, s: number, l: number, a?: number }

/**
 * Normalizes a color input into an RGB string format.
 *
 * @param {Rgb | number[] | string} color - The color in various formats. Can be an RGB object, an array of RGB values, or an RGB string.
 * @return {string} The color in 'rgb(0, 0, 0)' format.
 * @throws {Error} Throws an error if the provided color format is unexpected.
 */
export const normalizeRgbString = (color: Rgb | number[] | string): string => {
    if (Array.isArray(color) && color.length >= 3) {
        return `rgb(${ color[ 0 ] }, ${ color[ 1 ] }, ${ color[ 2 ] })`
    } else if (typeof color === 'string') {
        const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/i) // Added 'i' flag for case-insensitive matching
        if (match) {
            return `rgb(${ match[ 1 ] }, ${ match[ 2 ] }, ${ match[ 3 ] })`
        }
        return color
    } else {
        throw new Error(`Unexpected format for color: ${ JSON.stringify(color) }`)
    }
}

/**
 * Converts an RGB string to an RGB object.
 *
 * @param {string} rgbString - The RGB string.
 * @return {Rgb} The RGB values.
 */
export const rgbStringToRgb = (rgbString: string): Rgb => {
    const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (match) {
        return {
            r: parseInt(match[ 1 ]),
            g: parseInt(match[ 2 ]),
            b: parseInt(match[ 3 ]),
        }
    }
    return { r: 0, g: 0, b: 0 } //return black if no match
}

/**
 * Converts an HSLA object into a hex string.
 *
 * @param {h, s, l, a} hsla values between 0 and 1
 * @return {string} hex string in the format '#000000' or '#000000ff' if alpha is not 1
 */
export const hslaToHex = (hsla: Hsla): string => {
    const h = hsla.h / 360
    const s = Math.max(0, Math.min(1, hsla.s))
    const l = Math.max(0, Math.min(1, hsla.l))
    // Clamp the alpha value between 0 and 1
    const a = Math.max(0, Math.min(1, hsla.a))

    let r: number, g: number, b: number

    const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1 / 6) return p + (q - p) * 6 * t
        if (t < 1 / 2) return q
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
    }

    if (s === 0) {
        r = g = b = l // achromatic
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s
        const p = 2 * l - q
        r = hue2rgb(p, q, h + 1 / 3)
        g = hue2rgb(p, q, h)
        b = hue2rgb(p, q, h - 1 / 3)
    }

    const toHex = (x: number) => {
        const hex = Math.round(x * 255).toString(16)
        return hex.length === 1 ? '0' + hex : hex
    }

    // Convert the clamped alpha value to a 2-digit hexadecimal value
    const alphaHex = Math.round(a * 255).toString(16).padStart(2, '0')

    // If alphaHex is 'ff', return the 6-character hex code. Otherwise, include the alpha value.
    return alphaHex === 'ff' ? `#${ toHex(r) }${ toHex(g) }${ toHex(b) }` : `#${ toHex(r) }${ toHex(g) }${ toHex(b) }${ alphaHex }`
}


/**
 * Converts an sRGB value to a linear RGB value.
 *
 * @param {number} value sRGB value between 0 and 1
 * @return {number} linear RGB value between 0 and 1
 */
export const sRGBToLinear = (value: number): number => {
    if (value <= 0) return 0 // Clamp values below 0
    if (value >= 1) return 1 // Clamp values above 1

    if (value <= 0.04045) {
        return value / 12.92
    } else {
        return Math.pow((value + 0.055) / 1.055, 2.4)
    }
}


/**
 * Converts an RGB color to an XYZ color.
 *
 * @param {Rgb} value rgb value between 0 and 1
 * @return {Xyz} xyz object with values between 0 and 100
 */
export const rgbToXyz = (rgb: Rgb): Xyz => {
    // Convert sRGB to linear RGB
    let rLinear = sRGBToLinear(rgb.r / 255.0)
    let gLinear = sRGBToLinear(rgb.g / 255.0)
    let bLinear = sRGBToLinear(rgb.b / 255.0)

    // Apply the transformation matrix for D65 illuminant
    let x = rLinear * 0.4124564 + gLinear * 0.3575761 + bLinear * 0.1804375
    let y = rLinear * 0.2126729 + gLinear * 0.7151522 + bLinear * 0.0721750
    let z = rLinear * 0.0193339 + gLinear * 0.1191920 + bLinear * 0.9503041

    // The XYZ values are sometimes expressed within the range [0, 1]. In this case the range is scaled to [0, 100].
    return { x: x * 100, y: y * 100, z: z * 100 }
}

/**
 * Converts an XYZ color to a LAB color.
 *
 * @param {Xyz} xyz values between 0 and 1
 * @return {Lab} lab values between 0 and 1
 */
export const xyzToLab = (xyz: Xyz): Lab => {
    // Reference-X, Y and Z refer to specific illuminants and observers. D65 is the standard, and the only one we'll use.
    let refX = 95.047
    let refY = 100.000
    let refZ = 108.883

    let x = xyz.x / refX
    let y = xyz.y / refY
    let z = xyz.z / refZ

    if (x > 0.008856) {
        x = Math.pow(x, 1 / 3)
    } else {
        x = (7.787 * x) + (16 / 116)
    }

    if (y > 0.008856) {
        y = Math.pow(y, 1 / 3)
    } else {
        y = (7.787 * y) + (16 / 116)
    }

    if (z > 0.008856) {
        z = Math.pow(z, 1 / 3)
    } else {
        z = (7.787 * z) + (16 / 116)
    }

    const l = (116 * y) - 16
    const a = 500 * (x - y)
    const b = 200 * (y - z)

    return { l, a, b }
}

/**
 * Compares two Lab colors using the CIE94 algorithm.
 * The difference score is between 0 and 100. Below 1 is generally imperceptible.
 * @param {Lab} lab1 values between 0 and 1
 * @param {Lab} lab2 values between 0 and 1
 * @return {number} difference score between 0 and 100
 */
export const deltaE94 = (lab1: Lab, lab2: Lab): number => {
    const kL = 1
    const kC = 1
    const kH = 1
    const K1 = 0.045
    const K2 = 0.015
    const SL = 1
    const SC = 1 + K1 * Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b)
    const SH = 1 + K2 * Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b)

    const deltaL = lab1.l - lab2.l
    const deltaA = lab1.a - lab2.a
    const deltaB = lab1.b - lab2.b
    const deltaC = Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b) - Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b)
    const deltaH2 = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC
    const deltaH = Math.sqrt(Math.max(deltaH2, 0))

    const l = deltaL / (kL * SL)
    const c = deltaC / (kC * SC)
    const h = deltaH / (kH * SH)

    return Math.sqrt(l * l + c * c + h * h)
}
