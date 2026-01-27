import React, { useState, useMemo, useEffect, useRef } from 'react'
import styles from './Mixer.module.scss'

//components
import ImageUploader from '../ImageUploader/ImageUploader'
import ExtractedColorsPanel from '../ExtractedColorsPanel/ExtractedColorsPanel'
import PaintNameSearch from '../PaintNameSearch/PaintNameSearch'

//color mixing and conversion libraries
import { createRecipeSuggester } from '../../utils/suggestRecipe'

//custom hooks
import usePaletteManager from '../../data/hooks/usePaletteManager'
import { useLocalStorage } from '../../data/hooks/useLocalStorage'
import { useImageColorExtraction, RegionBounds } from '../../data/hooks/useImageColorExtraction'
import { Region } from '../RegionSelector/RegionSelector'

import { defaultPalette } from '../../utils/palettes/defaultPalette'
import { ExtractedColor, RecipeSuggestion } from '../../types/types'
const Mixer: React.FC = () => {
    const [ referenceImageFile, setReferenceImageFile ] = useState<File | null>(null)
    const [ referenceImageUrl, setReferenceImageUrl ] = useState<string | null>(null)
    const [ extractedColors, setExtractedColors ] = useState<ExtractedColor[]>([])
    const [ recipeSuggestions, setRecipeSuggestions ] = useState<Array<RecipeSuggestion | null>>([])
    const [ selectedExtractedColorIndex, setSelectedExtractedColorIndex ] = useState<number | null>(null)
    const [ extractedColorCount, setExtractedColorCount ] = useState<number | "auto">("auto")
    const [ preferDistinctColors, setPreferDistinctColors ] = useState<boolean>(true)
    const [ selectedRegion, setSelectedRegion ] = useState<Region | null>(null)
    const [ isRegionMode, setIsRegionMode ] = useState<boolean>(false)
    const [ isExtracting, setIsExtracting ] = useState<boolean>(false)
    const [ isSuggesting, setIsSuggesting ] = useState<boolean>(false)
    const extractionRequestId = useRef(0)
    const recipeRequestId = useRef(0)
    const recipeWorkerRef = useRef<Worker | null>(null)
    const workerFailedRef = useRef(false)
    const recipeTimeoutRef = useRef<number | null>(null)

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

    const handleRenameLoadout = (fromName: string, toName: string) => {
        const trimmed = toName.trim()
        if (!trimmed) {
            return
        }

        setSavedLoadouts((current) => {
            const existing = current.find((loadout) => loadout.name === fromName)
            if (!existing) {
                return current
            }
            const withoutOld = current.filter((loadout) => loadout.name !== fromName && loadout.name !== trimmed)
            return [ ...withoutOld, { name: trimmed, palette: [ ...existing.palette ] } ]
        })
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

    useEffect(() => {
        if (typeof Worker === 'undefined') {
            return
        }
        let cancelled = false
        let worker: Worker | null = null

        const setupWorker = async () => {
            try {
                const { getRecipeWorkerUrl } = await import('../../workers/recipeWorkerUrl')
                if (cancelled) {
                    return
                }
                worker = new Worker(getRecipeWorkerUrl(), { type: 'module' })
                recipeWorkerRef.current = worker

                worker.onmessage = (event: MessageEvent<{ id: number; suggestions: Array<RecipeSuggestion | null> }>) => {
                    if (event.data.id !== recipeRequestId.current) {
                        return
                    }
                    if (recipeTimeoutRef.current !== null) {
                        window.clearTimeout(recipeTimeoutRef.current)
                        recipeTimeoutRef.current = null
                    }
                    setRecipeSuggestions(event.data.suggestions)
                    setIsSuggesting(false)
                }

                worker.onerror = () => {
                    workerFailedRef.current = true
                    recipeWorkerRef.current = null
                    if (recipeTimeoutRef.current !== null) {
                        window.clearTimeout(recipeTimeoutRef.current)
                        recipeTimeoutRef.current = null
                    }
                    setIsSuggesting(false)
                }
            } catch {
                workerFailedRef.current = true
                setIsSuggesting(false)
            }
        }

        setupWorker()

        return () => {
            cancelled = true
            if (worker) {
                worker.terminate()
            }
            recipeWorkerRef.current = null
        }
    }, [])

    useEffect(() => {
        const requestId = ++recipeRequestId.current
        const clearTimeoutIfNeeded = () => {
            if (recipeTimeoutRef.current !== null) {
                window.clearTimeout(recipeTimeoutRef.current)
                recipeTimeoutRef.current = null
            }
        }
        const cleanup = () => {
            clearTimeoutIfNeeded()
        }

        if (!extractedColors.length) {
            clearTimeoutIfNeeded()
            setRecipeSuggestions([])
            setIsSuggesting(false)
            return cleanup
        }

        if (!basePalette.length) {
            clearTimeoutIfNeeded()
            setRecipeSuggestions(extractedColors.map(() => null))
            setIsSuggesting(false)
            return cleanup
        }

        const targets = extractedColors.map((color) => color.rgbString)
        const worker = recipeWorkerRef.current

        const computeOnMainThread = () => {
            const suggester = createRecipeSuggester(basePalette)
            const nextSuggestions = new Array<RecipeSuggestion | null>(targets.length).fill(null)
            setRecipeSuggestions(nextSuggestions)
            setIsSuggesting(true)

            let index = 0
            const supportsIdle = typeof window !== 'undefined' && 'requestIdleCallback' in window
            const processChunk = (deadline?: IdleDeadline) => {
                if (recipeRequestId.current !== requestId) {
                    return
                }
                let processed = 0
                while (index < targets.length) {
                    if (supportsIdle && deadline && processed > 0 && deadline.timeRemaining() < 4) {
                        break
                    }
                    if (!supportsIdle && processed >= 1) {
                        break
                    }
                    nextSuggestions[ index ] = suggester(targets[ index ])
                    index += 1
                    processed += 1
                }
                setRecipeSuggestions(nextSuggestions.slice())
                if (index < targets.length && recipeRequestId.current === requestId) {
                    if (supportsIdle) {
                        window.requestIdleCallback(processChunk, { timeout: 200 })
                    } else {
                        window.setTimeout(() => processChunk(), 0)
                    }
                } else {
                    setIsSuggesting(false)
                }
            }

            if (supportsIdle) {
                window.requestIdleCallback(processChunk, { timeout: 200 })
            } else {
                window.setTimeout(() => processChunk(), 0)
            }
        }

        if (worker && !workerFailedRef.current) {
            setIsSuggesting(true)
            setRecipeSuggestions(targets.map(() => null))
            clearTimeoutIfNeeded()
            recipeTimeoutRef.current = window.setTimeout(() => {
                if (recipeRequestId.current !== requestId) {
                    return
                }
                workerFailedRef.current = true
                if (recipeWorkerRef.current) {
                    recipeWorkerRef.current.terminate()
                    recipeWorkerRef.current = null
                }
                computeOnMainThread()
            }, 4000)
            worker.postMessage({
                id: requestId,
                palette: basePalette,
                colors: targets
            })
            return cleanup
        }

        computeOnMainThread()
        return cleanup
    }, [ extractedColors, basePalette ])

    const refreshExtractedColors = async (
        file: File,
        count: number | "auto",
        distinctMode: boolean,
        region?: RegionBounds | null
    ) => {
        const requestId = ++extractionRequestId.current
        setIsExtracting(true)
        try {
            const colors = await extractColors(file, count, {
                mode: distinctMode ? "distinct" : "dominant",
                region: region ?? undefined,
            })
            if (requestId !== extractionRequestId.current) {
                return
            }
            setExtractedColors(colors)
            setSelectedExtractedColorIndex(colors.length ? 0 : null)
        } finally {
            if (requestId === extractionRequestId.current) {
                setIsExtracting(false)
            }
        }
    }

    const handleImageSelected = async (file: File, objectUrl: string) => {
        setReferenceImageFile(file)
        setReferenceImageUrl(objectUrl)
        setSelectedRegion(null)
        setIsRegionMode(false)
        await refreshExtractedColors(file, extractedColorCount, preferDistinctColors)
    }

    const handleClearImage = () => {
        extractionRequestId.current += 1
        recipeRequestId.current += 1
        setReferenceImageFile(null)
        setReferenceImageUrl(null)
        setExtractedColors([])
        setRecipeSuggestions([])
        setSelectedExtractedColorIndex(null)
        setSelectedRegion(null)
        setIsRegionMode(false)
        setIsExtracting(false)
        setIsSuggesting(false)
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

    const handleDistinctToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextDistinct = event.target.checked
        setPreferDistinctColors(nextDistinct)

        if (referenceImageFile) {
            if (isRegionMode && selectedRegion) {
                await refreshExtractedColors(referenceImageFile, extractedColorCount, nextDistinct, selectedRegion)
            } else if (!isRegionMode) {
                await refreshExtractedColors(referenceImageFile, extractedColorCount, nextDistinct)
            }
        }
    }

    const handleRegionChange = async (region: Region | null) => {
        setSelectedRegion(region)
        
        if (region && referenceImageFile) {
            await refreshExtractedColors(referenceImageFile, extractedColorCount, preferDistinctColors, region)
        } else if (isRegionMode) {
            extractionRequestId.current += 1
            recipeRequestId.current += 1
            setExtractedColors([])
            setRecipeSuggestions([])
            setSelectedExtractedColorIndex(null)
            setIsExtracting(false)
            setIsSuggesting(false)
        }
    }

    const toggleRegionMode = async () => {
        const enteringRegionMode = !isRegionMode
        setIsRegionMode(enteringRegionMode)
        setSelectedRegion(null)
        
        if (enteringRegionMode) {
            extractionRequestId.current += 1
            recipeRequestId.current += 1
            setExtractedColors([])
            setRecipeSuggestions([])
            setSelectedExtractedColorIndex(null)
            setIsExtracting(false)
            setIsSuggesting(false)
        } else if (referenceImageFile) {
            await refreshExtractedColors(referenceImageFile, extractedColorCount, preferDistinctColors)
        }
    }

    return (
        <main className={ styles.Mixer }>
            <div className={ styles.referenceControls }>
                <ImageUploader onImageSelected={ handleImageSelected } onClear={ handleClearImage } />
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
                        onChange={ handleDistinctToggle }
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
                isExtracting={ isExtracting }
                isSuggesting={ isSuggesting }
                selectedRegion={ selectedRegion }
                onRegionChange={ handleRegionChange }
                isRegionMode={ isRegionMode }
                onRemovePaint={ handleRemoveFromPalette }
                savedLoadouts={ savedLoadouts }
                onSaveLoadout={ handleSaveLoadout }
                onLoadLoadout={ handleLoadLoadout }
                onDeleteLoadout={ handleDeleteLoadout }
                onRenameLoadout={ handleRenameLoadout }
            />

            <PaintNameSearch
                onColorSelect={ (rgbString, label) => addToPalette(rgbString, false, label) }
            />
        </main>
    )
}

export default Mixer
