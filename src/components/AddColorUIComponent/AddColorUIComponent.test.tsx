import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

import AddColorUIComponent from './AddColorUIComponent'

jest.mock('../ColorPicker/ColorPicker', () => {
    return function MockColorPicker(props: any) {
        return (
            <div data-testid="mock-color-picker">
                <button type="button" onClick={ () => props.onChange({ h: 20 }) }>
                    Change
                </button>
                <button type="button" onClick={ props.onClose }>Close</button>
                <button type="button" onClick={ props.onConfirm }>Confirm</button>
            </div>
        )
    }
})

describe('<AddColorUIComponent />', () => {
    const mockProps = {
        showAddColorPicker: true,
        addColor: "#FF5733",
        setShowAddColorPicker: jest.fn(),
        setAddColor: jest.fn(),
        confirmColor: jest.fn()
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders without crashing', () => {
        render(<AddColorUIComponent { ...mockProps } />)
    })

    describe('Visibility of Add Color Button', () => {
        it('hides the add color button when showAddColorPicker is true', () => {
            const { queryByTestId } = render(<AddColorUIComponent { ...mockProps } />)
            expect(queryByTestId('add-circle-outline')).toBeFalsy()
        })

        it('shows the add color button when showAddColorPicker is false', () => {
            const propsWithPickerHidden = { ...mockProps, showAddColorPicker: false }
            const { queryByTestId } = render(<AddColorUIComponent { ...propsWithPickerHidden } />)
            expect(queryByTestId('add-circle-outline')).toBeTruthy()
        })
    })

    describe('Color Picker Visibility', () => {
        it('shows the color picker when showAddColorPicker is true', () => {
            render(<AddColorUIComponent { ...mockProps } />)
            expect(screen.getByTestId('add-color-picker')).toBeTruthy()
        })

        it('hides the color picker when showAddColorPicker is false', () => {
            const propsWithPickerHidden = { ...mockProps, showAddColorPicker: false }
            render(<AddColorUIComponent { ...propsWithPickerHidden } />)
            expect(screen.queryByTestId('add-color-picker')).toBeFalsy()
        })
    })

    it('toggles the add color picker when the button is clicked', () => {
        const propsWithPickerHidden = { ...mockProps, showAddColorPicker: false }
        const { getByTestId } = render(<AddColorUIComponent { ...propsWithPickerHidden } />)

        fireEvent.click(getByTestId('add-circle-outline'))
        expect(mockProps.setShowAddColorPicker).toHaveBeenCalledWith(true)
    })

    it('calls color picker callbacks when rendered', () => {
        const { getByText } = render(<AddColorUIComponent { ...mockProps } />)

        fireEvent.click(getByText('Change'))
        expect(mockProps.setAddColor).toHaveBeenCalledWith({ h: 20 })

        fireEvent.click(getByText('Close'))
        expect(mockProps.setShowAddColorPicker).toHaveBeenCalledWith(false)

        fireEvent.click(getByText('Confirm'))
        expect(mockProps.confirmColor).toHaveBeenCalled()
    })

})
