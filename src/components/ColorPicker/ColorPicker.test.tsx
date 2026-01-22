import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import ColorPicker from './ColorPicker'

jest.mock('@uiw/react-color-wheel', () => {
    return function MockWheel(props: any) {
        return (
            <button
                type="button"
                data-testid="mock-wheel"
                onClick={ () => props.onChange({ hsva: { h: 10, s: 20, v: 30, a: 1 } }) }
            >
                Wheel
            </button>
        )
    }
})

jest.mock('@uiw/react-color-shade-slider', () => {
    return function MockShadeSlider(props: any) {
        return (
            <button
                type="button"
                data-testid="mock-shade"
                onClick={ () => props.onChange({ v: 10 }) }
            >
                Shade
            </button>
        )
    }
})

jest.mock('@uiw/react-color-editable-input', () => {
    return function MockEditableInput() {
        return <div data-testid="mock-editable-input" />
    }
})

jest.mock('@uiw/react-color-editable-input-rgba', () => {
    return function MockEditableInputRgba(props: any) {
        return (
            <button
                type="button"
                data-testid="mock-editable-input-rgba"
                onClick={ () => props.onChange({ hsva: { h: 40, s: 50, v: 60, a: 1 } }) }
            >
                RGBA
            </button>
        )
    }
})

describe('<ColorPicker />', () => {
    const mockColor = { h: 150, s: 50, v: 50, a: 1 }
    const mockOnChange = jest.fn()
    const mockOnClose = jest.fn()
    const mockOnConfirm = jest.fn()

    it('renders without crashing', () => {
        render(<ColorPicker color={ mockColor } onChange={ mockOnChange } onClose={ mockOnClose } onConfirm={ mockOnConfirm } />)
    })

    it('calls onChange from wheel, shade slider, and rgba input', () => {
        const { getByTestId } = render(
            <ColorPicker
                color={ mockColor }
                onChange={ mockOnChange }
                onClose={ mockOnClose }
                onConfirm={ mockOnConfirm }
            />
        )

        fireEvent.click(getByTestId('mock-wheel'))
        fireEvent.click(getByTestId('mock-shade'))
        fireEvent.click(getByTestId('mock-editable-input-rgba'))

        expect(mockOnChange).toHaveBeenCalledTimes(3)
    })

    it('calls onClose when close button is clicked', () => {
        const { getByTestId } = render(<ColorPicker color={ mockColor } onChange={ mockOnChange } onClose={ mockOnClose } onConfirm={ mockOnConfirm } />)
        const closeButton = getByTestId('swatch-remove')
        fireEvent.click(closeButton)
        expect(mockOnClose).toHaveBeenCalled()
    })

    it('calls onConfirm when OK button is clicked', () => {
        const { getByRole } = render(<ColorPicker color={ mockColor } onChange={ mockOnChange } onClose={ mockOnClose } onConfirm={ mockOnConfirm } />)
        const confirmButton = getByRole('button', { name: /ok/i })
        fireEvent.click(confirmButton)
        expect(mockOnConfirm).toHaveBeenCalled()
    })

    it('renders with dark and light colors to cover contrast branches', () => {
        const { rerender } = render(
            <ColorPicker
                color={ { h: 0, s: 0, v: 0, a: 1 } }
                onChange={ mockOnChange }
                onClose={ mockOnClose }
                onConfirm={ mockOnConfirm }
            />
        )

        rerender(
            <ColorPicker
                color={ { h: 0, s: 0, v: 100, a: 1 } }
                onChange={ mockOnChange }
                onClose={ mockOnClose }
                onConfirm={ mockOnConfirm }
            />
        )
    })
})
