import React from 'react'
import styles from './ColorBoxUI.module.scss'
import { ColorPart } from '../../types/types'

//color conversion libraries
import tinycolor from "tinycolor2"
import { hsvaToRgba } from '@uiw/color-convert'

//SVG icons
import { FaArrowDown } from 'react-icons/fa'
import { TbTargetArrow, TbTargetOff } from 'react-icons/tb'
import { VscDebugRestart } from 'react-icons/vsc'

interface ColorBoxUIProps {
    mixedColor: string
    setMixedColor: React.Dispatch<React.SetStateAction<string>>
    isUsingTargetColor: boolean
    targetColor: any
    resetPalette: () => void
    toggleIsUsingTargetColor: () => void
    isSavable: boolean
    addToPalette: (color: string, includeRecipe: boolean, labelOverride?: string) => void
    hasPartsInMix: () => boolean
}

const ColorBoxUI: React.FC<ColorBoxUIProps> = ({ mixedColor, isUsingTargetColor, targetColor, resetPalette, toggleIsUsingTargetColor, isSavable, addToPalette, hasPartsInMix }) => {
    return (
        <div className={ styles.ColorBoxUi }>
            <div>
                <button
                    className={ styles.resetMix }
                    onClick={ resetPalette }
                    id='reset-mix'
                    style={ {
                        color: tinycolor(mixedColor).isDark() ? 'white' : 'black',
                        opacity: hasPartsInMix() ? 0.5 : 0 // Change the opacity to indicate it's disabled
                    } }
                >
                    <VscDebugRestart />
                    <label className={ styles.buttonResetMix }>Reset</label>
                </button>
            </div>
            <div className={ styles.colorBoxLabel }>
                <button
                    className={ styles.addToPalette }
                    onClick={ () => addToPalette(mixedColor, true) }  // Set includeRecipe to true
                    disabled={ !isSavable } // Disable the button based on canSave state
                    style={ {
                        color: tinycolor(mixedColor).isDark() ? 'white' : 'black',
                        opacity: isSavable ? 1 : 0.5 // Change the opacity when it's disabled
                    } }
                >
                    <FaArrowDown style={ {
                        color: tinycolor(mixedColor).isDark() ? 'white' : 'black',
                        opacity: isSavable ? 1 : 0 // Hide the icon when disabled
                    } }
                    />
                    <label className={ styles.buttonSave }>
                        { isSavable ? 'Save' : 'Saved' }
                    </label>
                </button>
            </div>
            <button
                className={ styles.toggleTargetColor }
                onClick={ toggleIsUsingTargetColor }
                style={ {
                    color: isUsingTargetColor ?
                        tinycolor(hsvaToRgba(targetColor)).isDark() ? 'white' : 'black' : //when the targetColor is visible, contrast with that background color
                        tinycolor(mixedColor).isDark() ? 'white' : 'black' //when the targetColor is not visible, contrast with the mixedColor filling the background
                } }
            >
                { isUsingTargetColor ?
                    <TbTargetArrow data-testid="target-arrow-icon" /> :
                    <TbTargetOff data-testid="target-off-icon" /> }
                <label className={ styles.buttonTargetColor }>Target</label>
            </button>
        </div>
    )
}

export default ColorBoxUI
