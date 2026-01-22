import { suggestRecipe } from "./suggestRecipe"

jest.mock("mixbox", () => ({
    rgbToLatent: jest.fn(() => null),
    latentToRgb: jest.fn(() => [ 0, 0, 0 ])
}))

describe("suggestRecipe with missing latents", () => {
    it("returns null when no palette entries produce latents", () => {
        const palette = [
            { label: "Bad", partsInMix: 0, rgbString: "not-a-color" }
        ]

        const result = suggestRecipe(palette, "rgb(0, 0, 0)")
        expect(result).toBeNull()
    })
})
