import React from 'react'
import styles from './TargetColorContainer.module.scss'
import tinycolor from "tinycolor2"
import { hsvaToRgba, hsvaToRgbaString } from '@uiw/color-convert'
import ColorPicker from '../ColorPicker/ColorPicker'
import { Hsva } from '../../types/types'


interface TargetColorContainerProps {
    isUsingTargetColor: boolean
    targetColor: Hsva
    isShowingTargetColorPicker: boolean
    targetColorName: string
    setTargetColor: (color: any) => void // Update the type accordingly
    setIsShowingTargetColorPicker: (value: boolean) => void
}

const TargetColorContainer: React.FC<TargetColorContainerProps> = ({
    isUsingTargetColor,
    targetColor,
    isShowingTargetColorPicker,
    targetColorName,
    setTargetColor,
    setIsShowingTargetColorPicker
}) => {
    return (
        isUsingTargetColor && (
            <section className={ styles.TargetColorContainer }
                style={ {
                    background: hsvaToRgbaString(targetColor),
                    color: tinycolor(hsvaToRgba(targetColor)).isDark() ? 'white' : 'black',
                } }
            >
                { isShowingTargetColorPicker && (
                    <div data-testid="target-color-picker" className={ styles.targetColorPickerWrapper }>
                        <ColorPicker
                            color={ targetColor }
                            onChange={ setTargetColor }
                            onClose={ () => setIsShowingTargetColorPicker(false) }
                            onConfirm={ () => setIsShowingTargetColorPicker(false) }
                        />
                    </div>
                ) }
                { !isShowingTargetColorPicker && (
                    <div className={ styles.targetColorValues }>
                        <label htmlFor="target-color">Target Color</label>
                        <div id="target-color">
                            { tinycolor(targetColor).toHexString() }
                            <p>{ targetColorName }</p>
                        </div>
                    </div>
                ) }
            </section>
        )
    )
}

export default TargetColorContainer
