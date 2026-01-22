import React, { useState, useEffect, useMemo } from 'react'
import styles from './Mixer.module.scss'

//components
import AddColorUIComponent from '../AddColorUIComponent/AddColorUIComponent'
import ColorBoxUI from '../ColorBoxUI/ColorBoxUI'
import MixGraph from '../MixGraph/MixGraph'
import ColorSwatches from '../ColorSwatches/ColorSwatches'
import MixedColorContainer from '../MixedColorContainer/MixedColorContainer'
import TargetColorContainer from '../TargetColorContainer/TargetColorContainer'
import ImageUploader from '../ImageUploader/ImageUploader'
import ExtractedColorsPanel from '../ExtractedColorsPanel/ExtractedColorsPanel'
import PaintNameSearch from '../PaintNameSearch/PaintNameSearch'

//color mixing and conversion libraries
import { rgbToXyz, xyzToLab, deltaE94, normalizeRgbString } from '../../utils/colorConversion'
import mixbox from 'mixbox'
import tinycolor from "tinycolor2"
import { hsvaToRgbaString } from '@uiw/color-convert'
import { rgbStringToHsva } from '../../utils/rgbStringToHsva'
import { suggestRecipe } from '../../utils/suggestRecipe'

//custom hooks
import usePaletteManager from '../../data/hooks/usePaletteManager'
import { useColorMatching } from '../../data/hooks/useColorMatching'
import { useLocalStorage } from '../../data/hooks/useLocalStorage'
import { useImageColorExtraction } from '../../data/hooks/useImageColorExtraction'

import { defaultPalette } from '../../utils/palettes/defaultPalette'
import { ColorPart, ExtractedColor, RecipeSuggestion } from '../../types/types'

const Mixer: React.FC = () => {

    const [ mixedColor, setMixedColor ] = useState<string>('rgba(255,255,255,0)')
    const [ showAddColorPicker, setShowAddColorPicker ] = useState(false)
    const [ addColor, setAddColor ] = useState({ h: 214, s: 43, v: 90, a: 1 })
    const [ isUsingTargetColor, setIsUsingTargetColor ] = useState<boolean>(false)
    const [ targetColor, setTargetColor ] = useState({ h: 214, s: 43, v: 90, a: 1 })
    const [ isShowingTargetColorPicker, setIsShowingTargetColorPicker ] = useState<boolean>(false)
    const [ matchPercentage, setMatchPercentage ] = useState<string>('0.00')
    const [ referenceImageFile, setReferenceImageFile ] = useState<File | null>(null)
    const [ referenceImageUrl, setReferenceImageUrl ] = useState<string | null>(null)
    const [ extractedColors, setExtractedColors ] = useState<ExtractedColor[]>([])
    const [ selectedExtractedColorIndex, setSelectedExtractedColorIndex ] = useState<number | null>(null)
    const [ extractedColorCount, setExtractedColorCount ] = useState<number | "auto">("auto")
    const [ preferDistinctColors, setPreferDistinctColors ] = useState<boolean>(true)

    const [ savedPalette, setSavedPalette ] = useLocalStorage('savedPalette', defaultPalette)
    const initialPalette: (any) = savedPalette
    const [ isSavable, setIsSavable ] = useState<boolean>(true)

    const {
        palette,
        handleSwatchIncrement,
        handleSwatchDecrement,
        handleRemoveFromPalette,
        resetPalette,
        addToPalette,
        updateColorName,
        applyMixParts
    } = usePaletteManager(initialPalette)

    const { extractColors } = useImageColorExtraction()

    const { colorName: mixedColorName } = useColorMatching(mixedColor)
    const { colorName: targetColorName } = useColorMatching(hsvaToRgbaString(targetColor))
    const { colorName: addColorName } = useColorMatching(tinycolor(addColor)?.toHexString() ?? '')

    const basePaletteIndices = useMemo(() => {
        return palette.reduce<number[]>((indices, color, index) => {
            if (!color.recipe) {
                indices.push(index)
            }
            return indices
        }, [])
    }, [ palette ])

    const basePalette = useMemo(() => {
        return basePaletteIndices.map((index) => palette[ index ])
    }, [ basePaletteIndices, palette ])

    const recipeSuggestions = useMemo(() => {
        if (!extractedColors.length) {
            return []
        }

        if (!basePalette.length) {
            return extractedColors.map(() => null)
        }

        return extractedColors.map((color) => suggestRecipe(basePalette, color.rgbString))
    }, [ basePalette, extractedColors ])

    const handleApplySuggestion = (suggestion: RecipeSuggestion) => {
        const mappedUpdates = suggestion.ingredients
            .map((ingredient) => {
                const paletteIndex = basePaletteIndices[ ingredient.index ]
                if (paletteIndex === undefined) {
                    return null
                }
                return { index: paletteIndex, parts: ingredient.parts }
            })
            .filter((ingredient): ingredient is { index: number; parts: number } => ingredient !== null)

        if (!mappedUpdates.length) {
            return
        }

        applyMixParts(mappedUpdates)
    }

    // Helper function to toggle the isUsingTargetColor state
    const toggleIsUsingTargetColor = () => {
        setIsUsingTargetColor(!isUsingTargetColor)
        setIsShowingTargetColorPicker(true)
    }

    // Helper function to add the color selected in the color picker to the palette
    const confirmColor = () => {
        if (addColor) {
            const selectedRgbString = tinycolor(addColor)?.toRgbString() ?? ''
            addToPalette(selectedRgbString, false)  // No recipe for colors added from the color picker
            setShowAddColorPicker(false)
        }
    }

    // Helper function to determine if the palette has any colors with partsInMix > 0
    const hasPartsInMix = (): boolean => {
        return palette.some(color => color.partsInMix > 0)
    }

    const refreshExtractedColors = async (
        file: File,
        count: number | "auto",
        distinctMode: boolean
    ) => {
        const colors = await extractColors(file, count, {
            mode: distinctMode ? "distinct" : "dominant",
        })
        setExtractedColors(colors)
        setSelectedExtractedColorIndex(colors.length ? 0 : null)
    }

    const handleImageSelected = async (file: File, objectUrl: string) => {
        setReferenceImageFile(file)
        setReferenceImageUrl(objectUrl)
        await refreshExtractedColors(file, extractedColorCount, preferDistinctColors)
    }

    const handleExtractedColorSelect = (index: number) => {
        const selectedColor = extractedColors[ index ]?.rgbString
        if (!selectedColor) {
            return
        }
        setSelectedExtractedColorIndex(index)
        setTargetColor(rgbStringToHsva(selectedColor))
        setIsUsingTargetColor(true)
        setIsShowingTargetColorPicker(false)
    }

    const handleColorCountChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value
        const nextCount = value === "auto" ? "auto" : Number(value)
        setExtractedColorCount(nextCount)

        if (referenceImageFile) {
            await refreshExtractedColors(referenceImageFile, nextCount, preferDistinctColors)
        }
    }

    // Helper function to calculate the total number of parts in the palette
    const totalParts = palette.reduce((acc, color) => {
        return acc + color.partsInMix
    }, 0)

    // Helper function to get the mixed color by mixing the colors based on partsInMix in the palette
    const getMixedRgbStringFromPalette = (palette: ColorPart[]): string => {
        let totalParts = palette.reduce((acc, color) => {
            return acc + color.partsInMix
        }, 0)

        // If there are colors with non-zero partsInMix, mix them
        if (totalParts !== undefined && totalParts > 0.000001) {
            let latent_mix: number[] = [ 0, 0, 0, 0, 0, 0, 0 ]

            for (let j = 0; j < palette.length; j++) {
                if (palette[ j ].partsInMix > 0.000001) {
                    const latent = mixbox.rgbToLatent(palette[ j ].rgbString)
                    if (latent !== undefined) {
                        const percentageUsedInMix = palette[ j ].partsInMix / totalParts

                        for (let k = 0; k < latent.length; k++) {
                            latent_mix[ k ] += latent[ k ] * percentageUsedInMix
                        }
                    }
                }
            }
            const mixed_color = mixbox.latentToRgb(latent_mix)
            return normalizeRgbString(mixed_color)
        }
        // If there are no colors with non-zero partsInMix,
        // return a transparent color

        return tinycolor('rgba(255,255,255,0)').toRgbString() ?? ''
    }

    // Helper function to check if a color is already in the palette
    const isColorInPalette = (rgbString: string, palette: ColorPart[]): boolean => {
        const normalizedColor = tinycolor(normalizeRgbString(rgbString)).toHexString()
        return palette.some(swatch => tinycolor(swatch.rgbString).toHexString() === normalizedColor)
    }

    // Helper function to get the % match between two colors
    const getRgbColorMatch = (color1: string, color2: string): number => {
        if (!color1 || (color1 === undefined) || !color2 || (color2 === undefined)) {
            return 0
        }
        const color1Rgb = (tinycolor(color1))?.toRgb()
        const color2Rgb = (tinycolor(color2))?.toRgb()
        if (!color1Rgb || !color2Rgb) {
            return 0
        }

        const color1Lab = xyzToLab(rgbToXyz(color1Rgb))
        const color2Lab = xyzToLab(rgbToXyz(color2Rgb))
        /* tslint:enable */
        return (100 - deltaE94(color1Lab, color2Lab)) //convert % difference to % match
    }

    //when the palette changes, update the mixed color
    useEffect(() => {
        const newMixedColor = getMixedRgbStringFromPalette(palette)
        setMixedColor(newMixedColor)
    }, [ palette ])

    //when the mixed or target colors change, update the match percentage
    useEffect(() => {
        setMatchPercentage(getRgbColorMatch((mixedColor), (hsvaToRgbaString(targetColor))).toFixed(2))
    }, [ mixedColor, targetColor ])

    //when the mixed color or palette changes, update the savable state
    useEffect(() => {
        setIsSavable(!isColorInPalette(mixedColor, palette))
    }, [ mixedColor, palette ])

    useEffect(() => {
        if (!referenceImageFile) {
            return
        }
        refreshExtractedColors(referenceImageFile, extractedColorCount, preferDistinctColors)
    }, [ preferDistinctColors ])

    return (

        <main className={ styles.Mixer }>
            <div className={ styles.colorBox }>

                <MixedColorContainer
                    mixedColor={ mixedColor }
                    mixedColorName={ mixedColorName }
                    isUsingTargetColor={ isUsingTargetColor }
                    matchPercentage={ matchPercentage }
                />

                <TargetColorContainer
                    isUsingTargetColor={ isUsingTargetColor }
                    targetColor={ targetColor }
                    isShowingTargetColorPicker={ isShowingTargetColorPicker }
                    targetColorName={ targetColorName }
                    setTargetColor={ setTargetColor }
                    setIsShowingTargetColorPicker={ setIsShowingTargetColorPicker }
                />

                <ColorBoxUI
                    mixedColor={ mixedColor }
                    isUsingTargetColor={ isUsingTargetColor }
                    targetColor={ targetColor }
                    resetPalette={ resetPalette }
                    toggleIsUsingTargetColor={ toggleIsUsingTargetColor }
                    isSavable={ isSavable }
                    addToPalette={ addToPalette }
                    hasPartsInMix={ hasPartsInMix }
                    setMixedColor={ setMixedColor }
                />


                <div className={ styles.transparencyBox }>
                </div>
            </div>

            <MixGraph
                palette={ palette }
                totalParts={ totalParts }
            />

            <div className={ styles.referenceControls }>
                <ImageUploader onImageSelected={ handleImageSelected } />
                <label className={ styles.colorCount }>
                    <span>Color count</span>
                    <select
                        value={ extractedColorCount }
                        onChange={ handleColorCountChange }
                        data-testid="color-count-select"
                    >
                        <option value="auto">Auto</option>
                        <option value={ 4 }>4</option>
                        <option value={ 8 }>8</option>
                        <option value={ 16 }>16</option>
                        <option value={ 20 }>20</option>
                        <option value={ 26 }>26</option>
                        <option value={ 32 }>32</option>
                        <option value={ 48 }>48</option>
                        <option value={ 64 }>64</option>
                    </select>
                </label>
                <label className={ styles.distinctToggle }>
                    <span>Prefer distinct colors</span>
                    <input
                        type="checkbox"
                        checked={ preferDistinctColors }
                        onChange={ (event) => setPreferDistinctColors(event.target.checked) }
                        data-testid="distinct-toggle"
                    />
                </label>
            </div>

            <ColorSwatches
                palette={ palette }
                handleSwatchIncrement={ handleSwatchIncrement }
                handleSwatchDecrement={ handleSwatchDecrement }
                handleRemoveFromPalette={ handleRemoveFromPalette }
                updateColorName={ updateColorName }
                totalParts={ totalParts }
            />

            <PaintNameSearch
                onColorSelect={ (rgbString, label) => addToPalette(rgbString, false, label) }
            />

            <ExtractedColorsPanel
                colors={ extractedColors }
                selectedIndex={ selectedExtractedColorIndex }
                onSelect={ handleExtractedColorSelect }
                referenceImageUrl={ referenceImageUrl }
                palette={ basePalette }
                suggestions={ recipeSuggestions }
                onApplySuggestion={ handleApplySuggestion }
            />

            <AddColorUIComponent
                showAddColorPicker={ showAddColorPicker }
                addColor={ addColor }
                setShowAddColorPicker={ setShowAddColorPicker }
                setAddColor={ setAddColor }
                confirmColor={ confirmColor }
            />
        </main>
    )
}

export default Mixer
