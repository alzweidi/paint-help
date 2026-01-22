import { useState } from 'react'
import tinycolor from "tinycolor2"
import { ColorPart } from '../../types/types'
import { useColorName } from './useColorName'

export const useSwatchAdder = (initialPalette: ColorPart[]) => {
    const [ palette, setPalette ] = useState<ColorPart[]>(initialPalette)

    const addToPalette = async (rgbString: string, includeRecipe: boolean, labelOverride?: string) => {
        //check that the color doesn’t already exist in the palette
        if (!isColorInPalette(rgbString)) {

            let updatedPalette = [ ...palette ]
            const hexColor = tinycolor(rgbString).toHexString()
            //look up the color name in the database
            const colorName = labelOverride?.trim() || await useColorName(hexColor.substring(1))

            //add the color to the palette
            const newColor: ColorPart = {
                "rgbString": rgbString,
                "label": colorName,
                "partsInMix": 0,

            }

            //if the color's been mixed, add the recipe to the swatch data.
            if (includeRecipe) {
                newColor.recipe = palette.filter(color => color.partsInMix > 0)
            }
            //add the new color to the palette
            updatedPalette.push(newColor)
            setPalette(updatedPalette)

        } else {
            console.error("Selected color already in palette", rgbString)
        }
    }

    const isColorInPalette = (rgbString: string) => {
        const normalizedColor = tinycolor(rgbString).toHexString()
        return palette.some(swatch => tinycolor(swatch.rgbString).toHexString() === normalizedColor)
    }

    return { palette, setPalette, addToPalette }
}
