import React, { useState, useEffect } from 'react'
import styles from './ExtractedColorsPanel.module.scss'
import tinycolor from "tinycolor2"
import { ColorPart, ExtractedColor, RecipeSuggestion } from '../../types/types'
import { useColorHighlight } from '../../data/hooks/useColorHighlight'
import RegionSelector, { Region } from '../RegionSelector/RegionSelector'

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
    onRemovePaint
}) => {
    const basePaints = palette.filter((paint) => !paint.recipe)
    const [ highlightMaskUrl, setHighlightMaskUrl ] = useState<string | null>(null)
    const [ isHighlightActive, setIsHighlightActive ] = useState(false)
    const { generateHighlightMask } = useColorHighlight()

    useEffect(() => {
        if (isRegionMode && colors.length === 0) {
            setIsHighlightActive(false)
        }
    }, [ isRegionMode, colors.length ])

    useEffect(() => {
        if (!referenceImageUrl || selectedIndex === null || !colors[ selectedIndex ]) {
            setHighlightMaskUrl(null)
            return
        }

        if (!isHighlightActive) {
            setHighlightMaskUrl(null)
            return
        }

        let cancelled = false
        const targetColor = colors[ selectedIndex ].rgbString

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
    }, [ referenceImageUrl, selectedIndex, colors, isHighlightActive, generateHighlightMask, selectedRegion ])

    const handleSwatchClick = (index: number) => {
        if (index === selectedIndex && isHighlightActive) {
            setIsHighlightActive(false)
        } else {
            onSelect(index)
            setIsHighlightActive(true)
        }
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
                                        { highlightMaskUrl && (
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
                        { isHighlightActive && selectedIndex !== null && colors[ selectedIndex ] && (
                            <div className={ styles.highlightLegend }>
                                <span
                                    className={ styles.legendSwatch }
                                    style={ { backgroundColor: colors[ selectedIndex ].rgbString } }
                                />
                                <span>Showing where Color { selectedIndex + 1 } appears</span>
                                <button
                                    type="button"
                                    className={ styles.clearHighlight }
                                    onClick={ () => setIsHighlightActive(false) }
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

                    <div className={ styles.basePaints }>
                        <h4>Available paints</h4>
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
