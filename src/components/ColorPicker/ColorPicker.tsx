import React from 'react'
import styles from './ColorPicker.module.scss'
import Wheel from "@uiw/react-color-wheel"
import ShadeSlider from '@uiw/react-color-shade-slider'
import EditableInputRGBA from '@uiw/react-color-editable-input-rgba'
import EditableInput from '@uiw/react-color-editable-input'
import tinycolor from "tinycolor2"
import { AiOutlineClose } from 'react-icons/ai'
import { hsvaToRgba, hsvaToHex } from '@uiw/color-convert'

interface ColorPickerProps {
    color: any
    onChange: (color: any) => void
    onClose: () => void
    onConfirm: () => void
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, onClose, onConfirm }) => {
    return (
        <div className={ styles.ColorPicker }
            style={ { background: tinycolor(color).toRgbString() } }
        >
            <button className={ styles.closeButton }
                style={ {
                    color: tinycolor(hsvaToRgba(color)).isDark() ? 'white' : 'black',
                    transition: 'color 0.1s ease-in-out'
                } }
                data-testid="swatch-remove"
                onClick={ onClose }
            >
                <AiOutlineClose />
            </button>
            <Wheel color={ color }
                onChange={ (newColor) => onChange({ ...color, ...newColor.hsva }) }
            />
            <div className={ styles.shadeSlider }>
                <ShadeSlider
                    hsva={ color }
                    onChange={ (newShade) => onChange({ ...color, ...newShade }) }
                />
            </div>

            <div className={ styles.colorInputs }>
                <EditableInput
                    label="Hex"
                    value={ hsvaToHex(color) }

                    style={ {
                        width: '4.5rem',
                    } }
                />
                <EditableInputRGBA
                    hsva={ color }
                    onChange={ (newColor) => onChange({ ...color, ...newColor.hsva }) }
                />
            </div>
            <button
                onClick={ onConfirm }
                style={ {
                    backgroundColor: tinycolor(hsvaToRgba(color)).isDark() ? '#FFF4' : '#0004',
                    color: tinycolor(hsvaToRgba(color)).isDark() ? 'black' : 'white',
                    transition: 'all 0.2s ease-in-out'
                } }
            >
                OK
            </button>
        </div>
    )
}

export default ColorPicker
