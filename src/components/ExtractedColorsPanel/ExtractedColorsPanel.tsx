import React, { useState, useEffect } from 'react'
import styles from './ExtractedColorsPanel.module.scss'
import tinycolor from "tinycolor2"
import { ColorPart, ExtractedColor, RecipeSuggestion } from '../../types/types'
import { useColorHighlight } from '../../data/hooks/useColorHighlight'
import RegionSelector, { Region } from '../RegionSelector/RegionSelector'

type SavedLoadout = {
    name: string
    palette: ColorPart[]
}

type ExtractedColorsPanelProps = {
    colors: ExtractedColor[]
    selectedIndex: number | null
    onSelect: (index: number) => void
    referenceImageUrl: string | null
    palette: ColorPart[]
    suggestions: Array<RecipeSuggestion | null>
    isExtracting?: boolean
    isSuggesting?: boolean
    selectedRegion: Region | null
    onRegionChange: (region: Region | null) => void
    isRegionMode: boolean
    onRemovePaint?: (index: number) => void
    savedLoadouts?: SavedLoadout[]
    onSaveLoadout?: (name: string) => void
    onLoadLoadout?: (name: string) => void
    onDeleteLoadout?: (name: string) => void
    onRenameLoadout?: (fromName: string, toName: string) => void
}

const LOW_MATCH_THRESHOLD = 60

const formatIngredientList = (ingredients: RecipeSuggestion['ingredients'], palette: ColorPart[]): string => {
    return ingredients.map((ingredient) => {
        const paint = palette[ ingredient.index ]
        const label = paint?.label ?? `Paint ${ ingredient.index + 1 }`
        const partLabel = ingredient.parts === 1 ? 'part' : 'parts'
        return `${ ingredient.parts } ${ partLabel } ${ label }`
    }).join(' + ')
}

const ExtractedColorsPanel: React.FC<ExtractedColorsPanelProps> = ({
    colors,
    selectedIndex,
    onSelect,
    referenceImageUrl,
    palette,
    suggestions,
    isExtracting = false,
    isSuggesting = false,
    selectedRegion,
    onRegionChange,
    isRegionMode,
    onRemovePaint,
    savedLoadouts = [],
    onSaveLoadout,
    onLoadLoadout,
    onDeleteLoadout,
    onRenameLoadout
}) => {
    const basePaints = palette.filter((paint) => !paint.recipe)
    const [ highlightMaskUrl, setHighlightMaskUrl ] = useState<string | null>(null)
    const [ isHighlightActive, setIsHighlightActive ] = useState(false)
    const [ heatmapUrl, setHeatmapUrl ] = useState<string | null>(null)
    const [ isHeatmapActive, setIsHeatmapActive ] = useState(false)
    const [ activeDialog, setActiveDialog ] = useState<'save' | 'rename' | 'delete' | null>(null)
    const [ saveName, setSaveName ] = useState('')
    const [ renameFrom, setRenameFrom ] = useState('')
    const [ renameTo, setRenameTo ] = useState('')
    const [ deleteName, setDeleteName ] = useState('')
    const { generateHighlightMask, generateDifferenceHeatmap } = useColorHighlight()

    const selectedColor = selectedIndex === null ? null : colors[ selectedIndex ] ?? null
    const selectedSuggestion = selectedIndex === null ? null : suggestions[ selectedIndex ] ?? null
    const heatmapTargetColor = selectedSuggestion?.resultRgb ?? selectedColor?.rgbString ?? null
    const matchPct = selectedSuggestion ? Math.min(100, Math.max(0, selectedSuggestion.matchPct)) : 0
    const loadoutNames = savedLoadouts.map((loadout) => loadout.name)
    const hasLoadouts = loadoutNames.length > 0
    const saveNameTrimmed = saveName.trim()
    const renameToTrimmed = renameTo.trim()
    const saveExists = saveNameTrimmed.length > 0 && loadoutNames.includes(saveNameTrimmed)
    const renameExists = renameToTrimmed.length > 0 && renameFrom && loadoutNames.includes(renameToTrimmed) && renameToTrimmed !== renameFrom
    const emptyColorsMessage = isExtracting
        ? 'Analyzing colors...'
        : referenceImageUrl
            ? 'No colors extracted yet.'
            : 'Upload an image to extract colors.'

    useEffect(() => {
        if (isRegionMode && colors.length === 0) {
            setIsHighlightActive(false)
            setIsHeatmapActive(false)
            setHeatmapUrl(null)
        }
    }, [ isRegionMode, colors.length ])

    useEffect(() => {
        if (!activeDialog) {
            return
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setActiveDialog(null)
            }
        }

        window.addEventListener('keydown', handleEscape)
        return () => {
            window.removeEventListener('keydown', handleEscape)
        }
    }, [ activeDialog ])

    useEffect(() => {
        if (!referenceImageUrl || !selectedColor) {
            setHighlightMaskUrl(null)
            return
        }

        if (!isHighlightActive || isHeatmapActive) {
            setHighlightMaskUrl(null)
            return
        }

        let cancelled = false
        const targetColor = selectedColor.rgbString
        const highlightPalette = colors.map((color) => color.rgbString)

        generateHighlightMask(referenceImageUrl, targetColor, {
            region: selectedRegion ?? undefined,
            palette: highlightPalette,
            paletteIndex: selectedIndex ?? undefined
        }).then((maskUrl) => {
            if (!cancelled) {
                setHighlightMaskUrl(maskUrl)
            }
        })

        return () => {
            cancelled = true
        }
    }, [
        referenceImageUrl,
        selectedColor,
        selectedIndex,
        colors,
        isHighlightActive,
        isHeatmapActive,
        generateHighlightMask,
        selectedRegion
    ])

    useEffect(() => {
        if (!referenceImageUrl || !heatmapTargetColor || !isHeatmapActive) {
            setHeatmapUrl(null)
            return
        }

        let cancelled = false

        generateDifferenceHeatmap(referenceImageUrl, heatmapTargetColor, {
            region: selectedRegion ?? undefined
        }).then((maskUrl) => {
            if (!cancelled) {
                setHeatmapUrl(maskUrl)
            }
        })

        return () => {
            cancelled = true
        }
    }, [ referenceImageUrl, heatmapTargetColor, isHeatmapActive, generateDifferenceHeatmap, selectedRegion ])

    const handleSwatchClick = (index: number) => {
        if (index === selectedIndex && isHighlightActive && !isHeatmapActive) {
            setIsHighlightActive(false)
        } else {
            onSelect(index)
            setIsHighlightActive(true)
        }
    }

    const toggleHighlight = () => {
        setIsHeatmapActive(false)
        setIsHighlightActive((prev) => !prev)
    }

    const toggleHeatmap = () => {
        setIsHeatmapActive((prev) => !prev)
        setIsHighlightActive(false)
    }

    const openSaveDialog = () => {
        setSaveName('')
        setActiveDialog('save')
    }

    const openRenameDialog = () => {
        const firstName = loadoutNames[ 0 ] ?? ''
        setRenameFrom(firstName)
        setRenameTo('')
        setActiveDialog('rename')
    }

    const openDeleteDialog = () => {
        const firstName = loadoutNames[ 0 ] ?? ''
        setDeleteName(firstName)
        setActiveDialog('delete')
    }

    return (
        <section className={ styles.ExtractedColorsPanel }>
            <header className={ styles.header }>
                <h3>Reference Analysis</h3>
                { isExtracting && (
                    <span className={ styles.analyzingBadge }>Analyzing...</span>
                ) }
            </header>

            <div className={ styles.body }>
                <div className={ styles.referenceColumn }>
                    <div className={ styles.srOnly } aria-live="polite">
                        { isExtracting
                            ? 'Analyzing reference image colors.'
                            : isSuggesting
                                ? 'Analyzing paint mixes.'
                                : '' }
                    </div>
                    <div className={ styles.referenceImage }>
                        { referenceImageUrl ? (
                            <>
                                { isRegionMode && !isHighlightActive ? (
                                    <RegionSelector
                                        imageUrl={ referenceImageUrl }
                                        selectedRegion={ selectedRegion }
                                        onRegionSelected={ onRegionChange }
                                    />
                                ) : (
                                    <div className={ styles.imageContainer }>
                                        <img src={ referenceImageUrl } alt="Reference" />
                                        { heatmapUrl && (
                                            <img
                                                className={ styles.heatmapOverlay }
                                                src={ heatmapUrl }
                                                alt="Difference heatmap"
                                            />
                                        ) }
                                        { !heatmapUrl && highlightMaskUrl && (
                                            <img
                                                className={ styles.highlightOverlay }
                                                src={ highlightMaskUrl }
                                                alt="Color highlight"
                                            />
                                        ) }
                                    </div>
                                ) }
                            </>
                        ) : (
                            <div className={ styles.placeholder }>No reference image yet.</div>
                        ) }
                        { isHighlightActive && !isHeatmapActive && selectedColor && (
                            <div className={ styles.highlightLegend }>
                                <span
                                    className={ styles.legendSwatch }
                                    style={ { backgroundColor: selectedColor.rgbString } }
                                />
                                <span>Highlighting Color { selectedIndex + 1 } in the image</span>
                                <button
                                    type="button"
                                    className={ styles.clearHighlight }
                                    onClick={ () => setIsHighlightActive(false) }
                                >
                                    Clear
                                </button>
                            </div>
                        ) }
                        { isHeatmapActive && heatmapTargetColor && (
                            <div className={ styles.heatmapLegend }>
                                <span>Heatmap: green is close, red is off</span>
                                <button
                                    type="button"
                                    className={ styles.clearHighlight }
                                    onClick={ () => setIsHeatmapActive(false) }
                                >
                                    Clear
                                </button>
                            </div>
                        ) }
                        { isRegionMode && selectedRegion && !isHighlightActive && (
                            <div className={ styles.regionInfo }>
                                <span>Extracting colors from selected region</span>
                            </div>
                        ) }
                    </div>

                    { referenceImageUrl && selectedColor && (
                        <div className={ styles.accuracyPanel }>
                            <div className={ styles.accuracyHeader }>Visual accuracy</div>
                            <div className={ styles.accuracyRow }>
                                <div className={ styles.accuracySwatches }>
                                    <div className={ styles.accuracySwatch }>
                                        <span className={ styles.accuracyLabel }>Target</span>
                                        <span
                                            className={ styles.accuracyChip }
                                            style={ { backgroundColor: selectedColor.rgbString } }
                                        />
                                        <span className={ styles.accuracyValue }>
                                            { selectedColor.rgbString }
                                        </span>
                                    </div>
                                    <div className={ styles.accuracySwatch }>
                                        <span className={ styles.accuracyLabel }>Mix</span>
                                        <span
                                            className={ styles.accuracyChip }
                                            style={ { backgroundColor: selectedSuggestion?.resultRgb ?? '#ffffff' } }
                                        />
                                        <span className={ styles.accuracyValue }>
                                            { selectedSuggestion?.resultRgb ?? 'No mix yet' }
                                        </span>
                                    </div>
                                </div>

                                { selectedSuggestion ? (
                                    <div className={ styles.accuracyMeter }>
                                        <div className={ styles.meterBar }>
                                            <div
                                                className={ styles.meterFill }
                                                style={ { width: `${ matchPct }%` } }
                                            />
                                        </div>
                                        <div className={ styles.meterMeta }>
                                            <span>Match { matchPct.toFixed(1) }%</span>
                                            <span>Delta E { selectedSuggestion.deltaE.toFixed(2) }</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={ styles.placeholder }>
                                        { isSuggesting ? 'Analyzing mixes...' : 'No suggestion yet.' }
                                    </div>
                                ) }

                                <div className={ styles.overlayControls }>
                                    <button
                                        type="button"
                                        className={ `${ styles.overlayButton } ${ isHighlightActive && !isHeatmapActive ? styles.activeOverlay : '' }` }
                                        onClick={ toggleHighlight }
                                    >
                                        Highlight
                                    </button>
                                    <button
                                        type="button"
                                        className={ `${ styles.overlayButton } ${ isHeatmapActive ? styles.activeOverlay : '' }` }
                                        onClick={ toggleHeatmap }
                                        disabled={ !heatmapTargetColor }
                                    >
                                        Heatmap
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) }

                    <div className={ styles.basePaints }>
                        <div className={ styles.paintsHeader }>
                            <h4>Available paints</h4>
                            <div className={ styles.loadoutControls }>
                                { onSaveLoadout && (
                                    <button
                                        type="button"
                                        className={ styles.loadoutButton }
                                        onClick={ openSaveDialog }
                                        title="Save current paints as a named loadout"
                                    >
                                        Save
                                    </button>
                                ) }
                                { onLoadLoadout && savedLoadouts.length > 0 && (
                                    <select
                                        className={ styles.loadoutSelect }
                                        defaultValue=""
                                        onChange={ (e) => {
                                            if (e.target.value) {
                                                onLoadLoadout(e.target.value)
                                                e.target.value = ''
                                            }
                                        } }
                                    >
                                        <option value="" disabled>Load...</option>
                                        { savedLoadouts.map((loadout) => (
                                            <option key={ loadout.name } value={ loadout.name }>
                                                { loadout.name }
                                            </option>
                                        )) }
                                    </select>
                                ) }
                                { onRenameLoadout && (
                                    <button
                                        type="button"
                                        className={ styles.loadoutButton }
                                        onClick={ openRenameDialog }
                                        disabled={ !hasLoadouts }
                                    >
                                        Rename
                                    </button>
                                ) }
                                { onDeleteLoadout && (
                                    <button
                                        type="button"
                                        className={ styles.loadoutButton }
                                        onClick={ openDeleteDialog }
                                        disabled={ !hasLoadouts }
                                    >
                                        Delete
                                    </button>
                                ) }
                            </div>
                        </div>
                        { basePaints.length ? (
                            <div className={ styles.paintList }>
                                { basePaints.map((paint, index) => (
                                    <span
                                        key={ `${ paint.label }-${ index }` }
                                        className={ styles.paintChip }
                                        data-testid="base-paint"
                                        style={ {
                                            backgroundColor: paint.rgbString,
                                            color: tinycolor(paint.rgbString).isDark() ? 'white' : 'black'
                                        } }
                                    >
                                        { paint.label }
                                        { onRemovePaint && (
                                            <button
                                                type="button"
                                                className={ styles.removePaint }
                                                onClick={ () => onRemovePaint(index) }
                                                aria-label={ `Remove ${ paint.label }` }
                                            >
                                                ×
                                            </button>
                                        ) }
                                    </span>
                                )) }
                            </div>
                        ) : (
                            <div className={ styles.placeholder }>No paints yet. Use search below to add paints.</div>
                        ) }
                    </div>
                </div>

                <div className={ styles.colorsColumn }>
                    <h4>Extracted colors</h4>
                    { colors.length ? (
                        <>
                            <div className={ styles.swatchRow }>
                                { colors.map((color, index) => {
                                    const isSelected = index === selectedIndex
                                    return (
                                        <button
                                            key={ `${ color.rgbString }-${ index }` }
                                            type="button"
                                            className={ `${ styles.swatchButton } ${ isSelected ? styles.selected : '' }` }
                                            style={ { backgroundColor: color.rgbString } }
                                            onClick={ () => handleSwatchClick(index) }
                                            data-testid="extracted-swatch"
                                            aria-pressed={ isSelected }
                                        >
                                            <span className={ styles.swatchIndex }>{ index + 1 }</span>
                                        </button>
                                    )
                                }) }
                            </div>

                            <div className={ styles.colorList }>
                                { colors.map((color, index) => {
                                    const suggestion = suggestions[ index ]
                                    return (
                                        <div key={ `${ color.rgbString }-detail-${ index }` } className={ styles.colorCard }>
                                            <div
                                                className={ styles.colorPreview }
                                                style={ { backgroundColor: color.rgbString } }
                                            />
                                            <div className={ styles.colorDetails }>
                                                <div className={ styles.colorTitle }>Color { index + 1 }</div>
                                                <div className={ styles.colorMeta }>
                                                    <span className={ styles.coverageLabel }>Image share</span>
                                                    <span
                                                        className={ styles.coverageValue }
                                                        data-testid={ `coverage-${ index }` }
                                                    >
                                                        { color.coveragePct.toFixed(1) }%
                                                    </span>
                                                </div>

                                                { suggestion ? (
                                                    <div className={ styles.suggestion }>
                                                        <div className={ styles.suggestionRow }>
                                                            <span
                                                                className={ styles.resultSwatch }
                                                                style={ { backgroundColor: suggestion.resultRgb } }
                                                            />
                                                            <span className={ styles.matchPct }>
                                                                { suggestion.matchPct.toFixed(1) }%
                                                            </span>
                                                            { suggestion.matchPct < LOW_MATCH_THRESHOLD && (
                                                                <span className={ styles.lowMatch }>
                                                                    Best possible match
                                                                </span>
                                                            ) }
                                                        </div>
                                                        <div className={ styles.ingredients }>
                                                            { formatIngredientList(suggestion.ingredients, palette) }
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className={ styles.placeholder }>
                                                        { isSuggesting ? 'Analyzing mixes...' : 'No suggestion yet.' }
                                                    </div>
                                                ) }
                                            </div>
                                        </div>
                                    )
                                }) }
                            </div>
                        </>
                    ) : (
                        <div className={ styles.placeholder }>{ emptyColorsMessage }</div>
                    ) }
                </div>
            </div>

            { activeDialog === 'save' && (
                <div className={ styles.dialogBackdrop } role="presentation">
                    <div
                        className={ styles.dialog }
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="save-loadout-title"
                    >
                        <h4 id="save-loadout-title">Save loadout</h4>
                        <form
                            onSubmit={ (event) => {
                                event.preventDefault()
                                if (onSaveLoadout && saveNameTrimmed) {
                                    onSaveLoadout(saveNameTrimmed)
                                    setActiveDialog(null)
                                }
                            } }
                        >
                            <label className={ styles.dialogLabel } htmlFor="save-loadout-name">
                                Loadout name
                            </label>
                            <input
                                id="save-loadout-name"
                                className={ styles.dialogInput }
                                type="text"
                                value={ saveName }
                                onChange={ (event) => setSaveName(event.target.value) }
                                autoFocus
                            />
                            { saveExists && (
                                <div className={ styles.dialogHint }>
                                    A loadout with this name already exists. Saving will overwrite it.
                                </div>
                            ) }
                            <div className={ styles.dialogActions }>
                                <button type="button" onClick={ () => setActiveDialog(null) }>
                                    Cancel
                                </button>
                                <button type="submit" disabled={ !saveNameTrimmed }>
                                    { saveExists ? 'Overwrite' : 'Save' }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) }

            { activeDialog === 'rename' && (
                <div className={ styles.dialogBackdrop } role="presentation">
                    <div
                        className={ styles.dialog }
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="rename-loadout-title"
                    >
                        <h4 id="rename-loadout-title">Rename loadout</h4>
                        <form
                            onSubmit={ (event) => {
                                event.preventDefault()
                                if (onRenameLoadout && renameFrom && renameToTrimmed) {
                                    onRenameLoadout(renameFrom, renameToTrimmed)
                                    setActiveDialog(null)
                                }
                            } }
                        >
                            <label className={ styles.dialogLabel } htmlFor="rename-loadout-select">
                                Choose loadout
                            </label>
                            <select
                                id="rename-loadout-select"
                                className={ styles.dialogInput }
                                value={ renameFrom }
                                onChange={ (event) => setRenameFrom(event.target.value) }
                            >
                                { loadoutNames.map((name) => (
                                    <option key={ name } value={ name }>
                                        { name }
                                    </option>
                                )) }
                            </select>
                            <label className={ styles.dialogLabel } htmlFor="rename-loadout-name">
                                New name
                            </label>
                            <input
                                id="rename-loadout-name"
                                className={ styles.dialogInput }
                                type="text"
                                value={ renameTo }
                                onChange={ (event) => setRenameTo(event.target.value) }
                            />
                            { renameExists && (
                                <div className={ styles.dialogHint }>
                                    Another loadout uses this name. Renaming will overwrite it.
                                </div>
                            ) }
                            <div className={ styles.dialogActions }>
                                <button type="button" onClick={ () => setActiveDialog(null) }>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={ !renameFrom || !renameToTrimmed || renameToTrimmed === renameFrom }
                                >
                                    { renameExists ? 'Overwrite' : 'Rename' }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) }

            { activeDialog === 'delete' && (
                <div className={ styles.dialogBackdrop } role="presentation">
                    <div
                        className={ styles.dialog }
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-loadout-title"
                    >
                        <h4 id="delete-loadout-title">Delete loadout</h4>
                        <form
                            onSubmit={ (event) => {
                                event.preventDefault()
                                if (onDeleteLoadout && deleteName) {
                                    onDeleteLoadout(deleteName)
                                    setActiveDialog(null)
                                }
                            } }
                        >
                            <label className={ styles.dialogLabel } htmlFor="delete-loadout-select">
                                Choose loadout
                            </label>
                            <select
                                id="delete-loadout-select"
                                className={ styles.dialogInput }
                                value={ deleteName }
                                onChange={ (event) => setDeleteName(event.target.value) }
                            >
                                { loadoutNames.map((name) => (
                                    <option key={ name } value={ name }>
                                        { name }
                                    </option>
                                )) }
                            </select>
                            <div className={ styles.dialogHint }>
                                This action cannot be undone.
                            </div>
                            <div className={ styles.dialogActions }>
                                <button type="button" onClick={ () => setActiveDialog(null) }>
                                    Cancel
                                </button>
                                <button type="submit" disabled={ !deleteName }>
                                    Delete
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) }
        </section>
    )
}

export default ExtractedColorsPanel
