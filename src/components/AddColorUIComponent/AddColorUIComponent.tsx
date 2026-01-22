import React from 'react'
import styles from './AddColorUiComponent.module.scss'
import { MdAddCircleOutline } from 'react-icons/md'
import ColorPicker from '../ColorPicker/ColorPicker'

type Props = {
    showAddColorPicker: boolean
    addColor: any  // type could be improved
    setShowAddColorPicker: (value: boolean) => void
    setAddColor: (color: any) => void  // type could be improved
    confirmColor: () => void
}

const AddColorUIComponent: React.FC<Props> = ({ showAddColorPicker, addColor, setShowAddColorPicker, setAddColor, confirmColor }) => {
    return (
        <div className={ styles.AddColorUIComponent }>
            { !showAddColorPicker && (
                <button
                    style={ {
                        visibility: 'visible',
                        display: 'block',
                        cursor: 'pointer'
                    } }
                    onClick={ () => setShowAddColorPicker(!showAddColorPicker) }
                >
                    <MdAddCircleOutline data-testid="add-circle-outline" />
                </button>
            ) }

            { showAddColorPicker && (
                <div
                    className={ styles.colorPickerContainer }

                    data-testid="add-color-picker"
                >
                    <ColorPicker
                        color={ addColor }
                        onChange={ (newColor) => { setAddColor(newColor) } }
                        onClose={ () => setShowAddColorPicker(false) }
                        onConfirm={ confirmColor }
                    />
                </div>
            ) }
        </div>
    )
}

export default AddColorUIComponent
