import tinycolor from "tinycolor2"
import { Hsva } from "../types/types"

export const rgbStringToHsva = (rgbString: string): Hsva => {
    const hsv = tinycolor(rgbString).toHsv()

    return {
        h: hsv.h,
        s: hsv.s * 100,
        v: hsv.v * 100,
        a: hsv.a,
    }
}
