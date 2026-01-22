import React, { useState, useRef, useCallback } from 'react'
import styles from './RegionSelector.module.scss'

export type Region = {
    x: number
    y: number
    width: number
    height: number
}

type RegionSelectorProps = {
    imageUrl: string
    onRegionSelected: (region: Region | null) => void
    selectedRegion: Region | null
}

const RegionSelector: React.FC<RegionSelectorProps> = ({
    imageUrl,
    onRegionSelected,
    selectedRegion
}) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const [ isDrawing, setIsDrawing ] = useState(false)
    const [ startPoint, setStartPoint ] = useState<{ x: number; y: number } | null>(null)
    const [ currentRegion, setCurrentRegion ] = useState<Region | null>(null)

    const getRelativeCoords = useCallback((e: React.MouseEvent): { x: number; y: number } => {
        const container = containerRef.current
        if (!container) {
            return { x: 0, y: 0 }
        }

        const rect = container.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100

        return {
            x: Math.max(0, Math.min(100, x)),
            y: Math.max(0, Math.min(100, y))
        }
    }, [])

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        const coords = getRelativeCoords(e)
        setIsDrawing(true)
        setStartPoint(coords)
        setCurrentRegion(null)
        onRegionSelected(null)
    }, [ getRelativeCoords, onRegionSelected ])

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDrawing || !startPoint) {
            return
        }

        const coords = getRelativeCoords(e)
        const region: Region = {
            x: Math.min(startPoint.x, coords.x),
            y: Math.min(startPoint.y, coords.y),
            width: Math.abs(coords.x - startPoint.x),
            height: Math.abs(coords.y - startPoint.y)
        }

        setCurrentRegion(region)
    }, [ isDrawing, startPoint, getRelativeCoords ])

    const handleMouseUp = useCallback(() => {
        if (!isDrawing) {
            return
        }

        setIsDrawing(false)
        setStartPoint(null)

        if (currentRegion && currentRegion.width > 2 && currentRegion.height > 2) {
            onRegionSelected(currentRegion)
        } else {
            setCurrentRegion(null)
        }
    }, [ isDrawing, currentRegion, onRegionSelected ])

    const handleClearRegion = useCallback(() => {
        setCurrentRegion(null)
        onRegionSelected(null)
    }, [ onRegionSelected ])

    const displayRegion = selectedRegion || currentRegion

    return (
        <div className={ styles.RegionSelector }>
            <div
                ref={ containerRef }
                className={ styles.imageContainer }
                onMouseDown={ handleMouseDown }
                onMouseMove={ handleMouseMove }
                onMouseUp={ handleMouseUp }
                onMouseLeave={ handleMouseUp }
            >
                <img src={ imageUrl } alt="Reference" draggable={ false } />

                { displayRegion && (
                    <div
                        className={ styles.selectionBox }
                        style={ {
                            left: `${ displayRegion.x }%`,
                            top: `${ displayRegion.y }%`,
                            width: `${ displayRegion.width }%`,
                            height: `${ displayRegion.height }%`
                        } }
                    />
                ) }

                { displayRegion && (
                    <div className={ styles.overlay }>
                        <div
                            className={ styles.overlayTop }
                            style={ { height: `${ displayRegion.y }%` } }
                        />
                        <div
                            className={ styles.overlayMiddle }
                            style={ {
                                top: `${ displayRegion.y }%`,
                                height: `${ displayRegion.height }%`
                            } }
                        >
                            <div
                                className={ styles.overlayLeft }
                                style={ { width: `${ displayRegion.x }%` } }
                            />
                            <div
                                className={ styles.overlayRight }
                                style={ {
                                    left: `${ displayRegion.x + displayRegion.width }%`,
                                    width: `${ 100 - displayRegion.x - displayRegion.width }%`
                                } }
                            />
                        </div>
                        <div
                            className={ styles.overlayBottom }
                            style={ {
                                top: `${ displayRegion.y + displayRegion.height }%`,
                                height: `${ 100 - displayRegion.y - displayRegion.height }%`
                            } }
                        />
                    </div>
                ) }
            </div>

            <div className={ styles.instructions }>
                { displayRegion ? (
                    <>
                        <span>Region selected — colors will be extracted from this area</span>
                        <button
                            type="button"
                            className={ styles.clearButton }
                            onClick={ handleClearRegion }
                        >
                            Clear selection
                        </button>
                    </>
                ) : (
                    <span>Click and drag to select a region for detailed color extraction</span>
                ) }
            </div>
        </div>
    )
}

export default RegionSelector
