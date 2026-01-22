import React, { useState, useMemo } from 'react'
import styles from './Mixer.module.scss'

//components
import ImageUploader from '../ImageUploader/ImageUploader'
import ExtractedColorsPanel from '../ExtractedColorsPanel/ExtractedColorsPanel'
import PaintNameSearch from '../PaintNameSearch/PaintNameSearch'

//color mixing and conversion libraries
import { suggestRecipe } from '../../utils/suggestRecipe'

//custom hooks
import usePaletteManager from '../../data/hooks/usePaletteManager'
import { useLocalStorage } from '../../data/hooks/useLocalStorage'
import { useImageColorExtraction, RegionBounds } from '../../data/hooks/useImageColorExtraction'
import { Region } from '../RegionSelector/RegionSelector'

import { defaultPalette } from '../../utils/palettes/defaultPalette'
import { ExtractedColor, RecipeSuggestion } from '../../types/types'
import tinycolor from 'tinycolor2'

const Mixer: React.FC = () => {
    const [ referenceImageFile, setReferenceImageFile ] = useState<File | null>(null)
    const [ referenceImageUrl, setReferenceImageUrl ] = useState<string | null>(null)
    const [ extractedColors, setExtractedColors ] = useState<ExtractedColor[]>([])
    const [ selectedExtractedColorIndex, setSelectedExtractedColorIndex ] = useState<number | null>(null)
    const [ extractedColorCount, setExtractedColorCount ] = useState<number | "auto">("auto")
    const [ preferDistinctColors, setPreferDistinctColors ] = useState<boolean>(true)
    const [ selectedRegion, setSelectedRegion ] = useState<Region | null>(null)
    const [ isRegionMode, setIsRegionMode ] = useState<boolean>(false)

    type SavedLoadout = {
        name: string
        palette: typeof defaultPalette
    }

    const [ savedLoadouts, setSavedLoadouts ] = useLocalStorage<SavedLoadout[]>('savedLoadouts', [])
    const initialPalette: (any) = defaultPalette

    const {
        palette,
        setPalette,
        handleRemoveFromPalette,
        addToPalette
    } = usePaletteManager(initialPalette)

    const handleSaveLoadout = (name: string) => {
        const existingIndex = savedLoadouts.findIndex(l => l.name === name)
        if (existingIndex >= 0) {
            const updated = [ ...savedLoadouts ]
            updated[ existingIndex ] = { name, palette: [ ...palette ] }
            setSavedLoadouts(updated)
        } else {
            setSavedLoadouts([ ...savedLoadouts, { name, palette: [ ...palette ] } ])
        }
    }

    const handleLoadLoadout = (name: string) => {
        const loadout = savedLoadouts.find(l => l.name === name)
        if (loadout) {
            setPalette(loadout.palette)
        }
    }

    const handleDeleteLoadout = (name: string) => {
        setSavedLoadouts(savedLoadouts.filter(l => l.name !== name))
    }

    const { extractColors } = useImageColorExtraction()

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

    const refreshExtractedColors = async (
        file: File,
        count: number | "auto",
        distinctMode: boolean,
        region?: RegionBounds | null
    ) => {
        const colors = await extractColors(file, count, {
            mode: distinctMode ? "distinct" : "dominant",
            region: region ?? undefined,
        })
        setExtractedColors(colors)
        setSelectedExtractedColorIndex(colors.length ? 0 : null)
    }

    const handleImageSelected = async (file: File, objectUrl: string) => {
        setReferenceImageFile(file)
        setReferenceImageUrl(objectUrl)
        setSelectedRegion(null)
        setIsRegionMode(false)
        await refreshExtractedColors(file, extractedColorCount, preferDistinctColors)
    }

    const handleExtractedColorSelect = (index: number) => {
        setSelectedExtractedColorIndex(index)
    }

    const handleColorCountChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value
        const nextCount = value === "auto" ? "auto" : Number(value)
        setExtractedColorCount(nextCount)

        if (referenceImageFile) {
            if (isRegionMode && selectedRegion) {
                await refreshExtractedColors(referenceImageFile, nextCount, preferDistinctColors, selectedRegion)
            } else if (!isRegionMode) {
                await refreshExtractedColors(referenceImageFile, nextCount, preferDistinctColors)
            }
        }
    }

    const handleRegionChange = async (region: Region | null) => {
        setSelectedRegion(region)
        
        if (region && referenceImageFile) {
            await refreshExtractedColors(referenceImageFile, extractedColorCount, preferDistinctColors, region)
        } else if (isRegionMode) {
            setExtractedColors([])
            setSelectedExtractedColorIndex(null)
        }
    }

    const toggleRegionMode = async () => {
        const enteringRegionMode = !isRegionMode
        setIsRegionMode(enteringRegionMode)
        setSelectedRegion(null)
        
        if (enteringRegionMode) {
            setExtractedColors([])
            setSelectedExtractedColorIndex(null)
        } else if (referenceImageFile) {
            await refreshExtractedColors(referenceImageFile, extractedColorCount, preferDistinctColors)
        }
    }

    return (
        <main className={ styles.Mixer }>
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
                { referenceImageUrl && (
                    <button
                        type="button"
                        className={ styles.regionModeButton }
                        onClick={ toggleRegionMode }
                    >
                        { isRegionMode ? 'Exit region select' : 'Select region' }
                    </button>
                ) }
            </div>

            <ExtractedColorsPanel
                colors={ extractedColors }
                selectedIndex={ selectedExtractedColorIndex }
                onSelect={ handleExtractedColorSelect }
                referenceImageUrl={ referenceImageUrl }
                palette={ basePalette }
                suggestions={ recipeSuggestions }
                selectedRegion={ selectedRegion }
                onRegionChange={ handleRegionChange }
                isRegionMode={ isRegionMode }
                onRemovePaint={ handleRemoveFromPalette }
                savedLoadouts={ savedLoadouts }
                onSaveLoadout={ handleSaveLoadout }
                onLoadLoadout={ handleLoadLoadout }
                onDeleteLoadout={ handleDeleteLoadout }
            />

            <PaintNameSearch
                onColorSelect={ (rgbString, label) => addToPalette(rgbString, false, label) }
            />
        </main>
    )
}

export default Mixer
