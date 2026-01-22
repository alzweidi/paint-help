import { rgbStringToHsva } from "./rgbStringToHsva"

describe("rgbStringToHsva", () => {
    it("converts rgb string to hsva with 0-100 s/v", () => {
        const hsva = rgbStringToHsva("rgb(255, 0, 0)")

        expect(hsva.h).toBeCloseTo(0)
        expect(hsva.s).toBeCloseTo(100)
        expect(hsva.v).toBeCloseTo(100)
        expect(hsva.a).toBeCloseTo(1)
    })
})
