import React, { useState, useRef, useCallback, useEffect } from 'react'
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
    const pointerIdRef = useRef<number | null>(null)
    const [ isDrawing, setIsDrawing ] = useState(false)
    const [ startPoint, setStartPoint ] = useState<{ x: number; y: number } | null>(null)
    const [ currentRegion, setCurrentRegion ] = useState<Region | null>(null)
    const [ keyboardRegion, setKeyboardRegion ] = useState<Region>(() => selectedRegion ?? {
        x: 10,
        y: 10,
        width: 40,
        height: 40
    })

    useEffect(() => {
        if (selectedRegion) {
            setKeyboardRegion(selectedRegion)
        }
    }, [ selectedRegion ])

    const getRelativeCoords = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) {
            return { x: 0, y: 0 }
        }
        const x = ((clientX - rect.left) / rect.width) * 100
        const y = ((clientY - rect.top) / rect.height) * 100

        return {
            x: Math.max(0, Math.min(100, x)),
            y: Math.max(0, Math.min(100, y))
        }
    }, [])

    const beginDrag = useCallback((clientX: number, clientY: number) => {
        const coords = getRelativeCoords(clientX, clientY)
        setIsDrawing(true)
        setStartPoint(coords)
        setCurrentRegion(null)
        onRegionSelected(null)
    }, [ getRelativeCoords, onRegionSelected ])

    const updateDrag = useCallback((clientX: number, clientY: number) => {
        if (!isDrawing || !startPoint) {
            return
        }

        const coords = getRelativeCoords(clientX, clientY)
        const region: Region = {
            x: Math.min(startPoint.x, coords.x),
            y: Math.min(startPoint.y, coords.y),
            width: Math.abs(coords.x - startPoint.x),
            height: Math.abs(coords.y - startPoint.y)
        }

        setCurrentRegion(region)
    }, [ isDrawing, startPoint, getRelativeCoords ])

    const finishDrag = useCallback(() => {
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

    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (e.button !== 0) {
            return
        }
        e.preventDefault()
        pointerIdRef.current = e.pointerId
        e.currentTarget.setPointerCapture?.(e.pointerId)
        beginDrag(e.clientX, e.clientY)
    }, [ beginDrag ])

    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (pointerIdRef.current !== e.pointerId) {
            return
        }
        updateDrag(e.clientX, e.clientY)
    }, [ updateDrag ])

    const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (pointerIdRef.current !== null) {
            e.currentTarget.releasePointerCapture?.(pointerIdRef.current)
            pointerIdRef.current = null
        }
        finishDrag()
    }, [ finishDrag ])

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (pointerIdRef.current !== null) {
            return
        }
        e.preventDefault()
        beginDrag(e.clientX, e.clientY)
    }, [ beginDrag ])

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (pointerIdRef.current !== null) {
            return
        }
        updateDrag(e.clientX, e.clientY)
    }, [ updateDrag ])

    const handleMouseUp = useCallback(() => {
        if (pointerIdRef.current !== null) {
            return
        }
        finishDrag()
    }, [ finishDrag ])

    const handleClearRegion = useCallback(() => {
        setCurrentRegion(null)
        onRegionSelected(null)
    }, [ onRegionSelected ])

    const clampPercent = (value: number) => Math.max(0, Math.min(100, value))

    const handleKeyboardChange = (field: keyof Region) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextValue = Number(event.target.value)
        setKeyboardRegion((prev) => ({
            ...prev,
            [ field ]: Number.isNaN(nextValue) ? 0 : nextValue
        }))
    }

    const applyKeyboardRegion = () => {
        const x = clampPercent(keyboardRegion.x)
        const y = clampPercent(keyboardRegion.y)
        const width = clampPercent(keyboardRegion.width)
        const height = clampPercent(keyboardRegion.height)
        const maxWidth = Math.max(0, Math.min(width, 100 - x))
        const maxHeight = Math.max(0, Math.min(height, 100 - y))
        const region = {
            x,
            y,
            width: maxWidth,
            height: maxHeight
        }

        if (maxWidth > 2 && maxHeight > 2) {
            setCurrentRegion(region)
            onRegionSelected(region)
        } else {
            setCurrentRegion(null)
            onRegionSelected(null)
        }
    }

    const displayRegion = selectedRegion || currentRegion

    return (
        <div className={ styles.RegionSelector }>
            <div
                ref={ containerRef }
                className={ styles.imageContainer }
                onPointerDown={ handlePointerDown }
                onPointerMove={ handlePointerMove }
                onPointerUp={ handlePointerUp }
                onPointerLeave={ handlePointerUp }
                onPointerCancel={ handlePointerUp }
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

            <div className={ styles.instructions } aria-live="polite">
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

            <div className={ styles.keyboardControls }>
                <div className={ styles.keyboardTitle }>Keyboard selection</div>
                <div className={ styles.inputRow }>
                    <label>
                        X%
                        <input
                            type="number"
                            min={ 0 }
                            max={ 100 }
                            step={ 1 }
                            value={ keyboardRegion.x }
                            onChange={ handleKeyboardChange('x') }
                        />
                    </label>
                    <label>
                        Y%
                        <input
                            type="number"
                            min={ 0 }
                            max={ 100 }
                            step={ 1 }
                            value={ keyboardRegion.y }
                            onChange={ handleKeyboardChange('y') }
                        />
                    </label>
                    <label>
                        Width%
                        <input
                            type="number"
                            min={ 0 }
                            max={ 100 }
                            step={ 1 }
                            value={ keyboardRegion.width }
                            onChange={ handleKeyboardChange('width') }
                        />
                    </label>
                    <label>
                        Height%
                        <input
                            type="number"
                            min={ 0 }
                            max={ 100 }
                            step={ 1 }
                            value={ keyboardRegion.height }
                            onChange={ handleKeyboardChange('height') }
                        />
                    </label>
                </div>
                <button
                    type="button"
                    className={ styles.applyButton }
                    onClick={ applyKeyboardRegion }
                >
                    Apply region
                </button>
            </div>
        </div>
    )
}

export default RegionSelector
