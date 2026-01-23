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
    selectedRegion: Region | null
    onRegionChange: (region: Region | null) => void
    isRegionMode: boolean
    onRemovePaint?: (index: number) => void
    savedLoadouts?: SavedLoadout[]
    onSaveLoadout?: (name: string) => void
    onLoadLoadout?: (name: string) => void
    onDeleteLoadout?: (name: string) => void
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
    selectedRegion,
    onRegionChange,
    isRegionMode,
    onRemovePaint,
    savedLoadouts = [],
    onSaveLoadout,
    onLoadLoadout,
    onDeleteLoadout
}) => {
    const basePaints = palette.filter((paint) => !paint.recipe)
    const [ highlightMaskUrl, setHighlightMaskUrl ] = useState<string | null>(null)
    const [ isHighlightActive, setIsHighlightActive ] = useState(false)
    const [ heatmapUrl, setHeatmapUrl ] = useState<string | null>(null)
    const [ isHeatmapActive, setIsHeatmapActive ] = useState(false)
    const { generateHighlightMask, generateDifferenceHeatmap } = useColorHighlight()

    const selectedColor = selectedIndex === null ? null : colors[ selectedIndex ] ?? null
    const selectedSuggestion = selectedIndex === null ? null : suggestions[ selectedIndex ] ?? null
    const heatmapTargetColor = selectedSuggestion?.resultRgb ?? selectedColor?.rgbString ?? null
    const matchPct = selectedSuggestion ? Math.min(100, Math.max(0, selectedSuggestion.matchPct)) : 0

    useEffect(() => {
        if (isRegionMode && colors.length === 0) {
            setIsHighlightActive(false)
            setIsHeatmapActive(false)
            setHeatmapUrl(null)
        }
    }, [ isRegionMode, colors.length ])

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

        generateHighlightMask(referenceImageUrl, targetColor, {
            region: selectedRegion ?? undefined
        }).then((maskUrl) => {
            if (!cancelled) {
                setHighlightMaskUrl(maskUrl)
            }
        })

        return () => {
            cancelled = true
        }
    }, [ referenceImageUrl, selectedColor, isHighlightActive, isHeatmapActive, generateHighlightMask, selectedRegion ])

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
        if (!selectedColor) {
            return
        }
        setIsHeatmapActive(false)
        setIsHighlightActive((prev) => !prev)
    }

    const toggleHeatmap = () => {
        if (!heatmapTargetColor) {
            return
        }
        setIsHeatmapActive((prev) => !prev)
        setIsHighlightActive(false)
    }

    return (
        <section className={ styles.ExtractedColorsPanel }>
            <header className={ styles.header }>
                <h3>Reference Analysis</h3>
            </header>

            <div className={ styles.body }>
                <div className={ styles.referenceColumn }>
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
                                    <div className={ styles.placeholder }>No suggestion yet.</div>
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
                                        onClick={ () => {
                                            const name = prompt('Enter loadout name:')
                                            if (name && name.trim()) {
                                                onSaveLoadout(name.trim())
                                            }
                                        } }
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
                                { onDeleteLoadout && savedLoadouts.length > 0 && (
                                    <select
                                        className={ styles.loadoutSelect }
                                        defaultValue=""
                                        onChange={ (e) => {
                                            if (e.target.value && confirm(`Delete loadout "${e.target.value}"?`)) {
                                                onDeleteLoadout(e.target.value)
                                            }
                                            e.target.value = ''
                                        } }
                                    >
                                        <option value="" disabled>Delete...</option>
                                        { savedLoadouts.map((loadout) => (
                                            <option key={ loadout.name } value={ loadout.name }>
                                                { loadout.name }
                                            </option>
                                        )) }
                                    </select>
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
                                                    <div className={ styles.placeholder }>No suggestion yet.</div>
                                                ) }
                                            </div>
                                        </div>
                                    )
                                }) }
                            </div>
                        </>
                    ) : (
                        <div className={ styles.placeholder }>Upload an image to extract colors.</div>
                    ) }
                </div>
            </div>
        </section>
    )
}

export default ExtractedColorsPanel
