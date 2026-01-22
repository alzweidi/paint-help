import React, { useState } from 'react'
import styles from './ColorSwatches.module.scss'
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import tinycolor from "tinycolor2"
import { AiOutlineClose } from 'react-icons/ai'
import { FaInfo } from 'react-icons/fa'

interface ColorSwatchesProps {
    palette: any[]
    handleSwatchIncrement: (index: number) => void
    handleSwatchDecrement: (index: number) => void
    handleRemoveFromPalette: (index: number) => void
    updateColorName: (index: number, name: string) => void
    totalParts: number
}

const ColorSwatches: React.FC<ColorSwatchesProps> = ({ palette, handleSwatchIncrement, handleSwatchDecrement, handleRemoveFromPalette, updateColorName, totalParts }) => {

    const [ editingColorNameIndex, setEditingColorNameIndex ] = useState<number | null>(null)
    const [ tempColorName, setTempColorName ] = useState<string>('')
    const [ activeInfoIndex, setActiveInfoIndex ] = useState<number | null>(null)

    return (
        <>
            <div className={ styles.proportionalParts }>
            </div>
            <TransitionGroup className={ styles.ColorSwatches }>
                { palette.map((swatch, i) => (
                    <CSSTransition
                        key={ i }
                        timeout={ 500 }
                        classNames="fade"
                    >
                        <div className={ styles.swatchContainer }
                            data-testid="swatchContainer">
                            <div
                                className={ styles.swatch }
                                style={ { backgroundColor: `${ swatch.rgbString }` } }
                            >
                                <div className={ styles.swatchUi }>
                                    { swatch.recipe && (
                                        <div className={ styles.recipeInfoButton }>
                                            <a
                                                style={ { color: tinycolor(swatch.rgbString).isDark() ? 'white' : 'black' } }
                                                onClick={ () => setActiveInfoIndex(i === activeInfoIndex ? null : i) }
                                                data-testid={ `recipe-info-button-${ i }` }
                                            >
                                                <FaInfo />
                                            </a>
                                        </div>
                                    ) }
                                    <button
                                        className={ styles.removeFromPalette }
                                        onClick={ () => handleRemoveFromPalette(i) }
                                        style={ { color: tinycolor(swatch.rgbString).isDark() ? 'white' : 'black' } }
                                        data-testid={ `remove-button-${ i }` }
                                    >
                                        <AiOutlineClose />
                                    </button>
                                    { editingColorNameIndex === i ? (
                                        <input
                                            value={ tempColorName }
                                            onChange={ (e) => setTempColorName(e.target.value) }
                                            onBlur={ () => {
                                                updateColorName(i, tempColorName)
                                                setEditingColorNameIndex(null)
                                            } }
                                            style={ {
                                                color: tinycolor(swatch.rgbString).isDark() ? 'white' : 'black',
                                                backgroundColor: tinycolor(swatch.rgbString).isDark() ? 'black' : 'white'
                                            } }
                                            autoFocus
                                        />
                                    ) : (
                                        <div className={ styles.name }
                                            onClick={ () => {
                                                setEditingColorNameIndex(i)
                                                setTempColorName(swatch.label)
                                            } }
                                            style={ { color: tinycolor(swatch.rgbString).isDark() ? 'white' : 'black' } }
                                            data-testid={ `name-${ i }` }
                                        >
                                            { swatch.label }
                                        </div>
                                    ) }

                                    <div
                                        className={ styles.partsInMix }
                                        onClick={ () => handleSwatchIncrement(i) }
                                        data-testid={ `swatch-parts-${ i }` }
                                        style={ { color: tinycolor(swatch.rgbString).isDark() ? 'white' : 'black' } }
                                    >
                                        { swatch.partsInMix }
                                        <div className={ styles.partsPercentage }>
                                            { (swatch.partsInMix > 0.000001) ? (swatch.partsInMix / totalParts * 100).toFixed(0) + '%' : '' }
                                        </div>
                                    </div>

                                    { i === activeInfoIndex && swatch.recipe && (
                                        <div className={ styles.recipeInfo }
                                            style={ {
                                                color: tinycolor(swatch.rgbString).isDark() ? 'white' : 'black',
                                                backgroundColor: swatch.rgbString
                                            } }
                                            onClick={ () => setActiveInfoIndex(null) }
                                            data-testid={ `recipe-info-${ i }` }
                                        >
                                            { swatch.recipe.map((ingredient, index) => (
                                                <div key={ index }>
                                                    <div
                                                        className={ styles.recipeList }
                                                        style={ {
                                                            backgroundColor: ingredient.rgbString,
                                                            color: tinycolor(ingredient.rgbString).isDark() ? 'white' : 'black'
                                                        } }>
                                                        { ingredient.partsInMix } { ingredient.label }
                                                    </div>
                                                </div>
                                            )) }
                                        </div>
                                    ) }
                                </div>
                            </div>

                            <div className={ styles.changePartsQty }>
                                <button
                                    className={ styles.subtractParts }
                                    onClick={ () => handleSwatchDecrement(i) }
                                    data-testid={ `subtract-button-${ i }` }
                                >
                                    -
                                </button>
                            </div>
                        </div>
                    </CSSTransition>
                )) }
            </TransitionGroup>
        </>
    )
}

export default ColorSwatches
