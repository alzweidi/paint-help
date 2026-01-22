/* eslint-env jest */
import React from 'react'
import '@testing-library/jest-dom'
import { render, fireEvent } from '@testing-library/react'
import TargetColorContainer from './TargetColorContainer'

jest.mock('../ColorPicker/ColorPicker', () => {
    return function MockColorPicker(props: any) {
        return (
            <div data-testid="mock-target-color-picker">
                <button type="button" onClick={ props.onClose }>Close</button>
                <button type="button" onClick={ props.onConfirm }>Confirm</button>
            </div>
        )
    }
})

describe('<TargetColorContainer />', () => {
    let mockSetTargetColor, mockSetIsShowingTargetColorPicker

    beforeEach(() => {
        mockSetTargetColor = jest.fn()
        mockSetIsShowingTargetColorPicker = jest.fn()
    })

    it('should render the target color container when isUsingTargetColor is true', () => {
        const { getByText } = render(
            <TargetColorContainer
                isUsingTargetColor={ true }
                targetColor={ { h: 0, s: 0, v: 0, a: 1 } }
                isShowingTargetColorPicker={ false }
                targetColorName="White"
                setTargetColor={ mockSetTargetColor }
                setIsShowingTargetColorPicker={ mockSetIsShowingTargetColorPicker }
            />
        )
        const targetColorText = getByText(/Target Color/i)
        expect(targetColorText).toBeInTheDocument()

    })

    it('does not render when isUsingTargetColor is false', () => {
        const { queryByText } = render(
            <TargetColorContainer
                isUsingTargetColor={ false }
                targetColor={ { h: 0, s: 0, v: 0, a: 1 } }
                isShowingTargetColorPicker={ false }
                targetColorName="White"
                setTargetColor={ mockSetTargetColor }
                setIsShowingTargetColorPicker={ mockSetIsShowingTargetColorPicker }
            />
        )

        expect(queryByText(/Target Color/i)).toBeNull()
    })

    it('should render the ColorPicker when isShowingTargetColorPicker is true', () => {
        const { getByTestId } = render(
            <TargetColorContainer
                isUsingTargetColor={ true }
                targetColor={ { h: 0, s: 0, v: 0, a: 1 } }
                isShowingTargetColorPicker={ true }
                targetColorName="White"
                setTargetColor={ mockSetTargetColor }
                setIsShowingTargetColorPicker={ mockSetIsShowingTargetColorPicker }
            />
        )
        const colorPicker = getByTestId('target-color-picker')
        expect(colorPicker).toBeInTheDocument()
    })

    it('closes the color picker on close or confirm', () => {
        const { getByText } = render(
            <TargetColorContainer
                isUsingTargetColor={ true }
                targetColor={ { h: 0, s: 0, v: 0, a: 1 } }
                isShowingTargetColorPicker={ true }
                targetColorName="White"
                setTargetColor={ mockSetTargetColor }
                setIsShowingTargetColorPicker={ mockSetIsShowingTargetColorPicker }
            />
        )

        fireEvent.click(getByText('Close'))
        fireEvent.click(getByText('Confirm'))

        expect(mockSetIsShowingTargetColorPicker).toHaveBeenCalledWith(false)
    })

    it('renders with a light target color', () => {
        const { getByText } = render(
            <TargetColorContainer
                isUsingTargetColor={ true }
                targetColor={ { h: 0, s: 0, v: 100, a: 1 } }
                isShowingTargetColorPicker={ false }
                targetColorName="White"
                setTargetColor={ mockSetTargetColor }
                setIsShowingTargetColorPicker={ mockSetIsShowingTargetColorPicker }
            />
        )

        expect(getByText(/Target Color/i)).toBeInTheDocument()
    })

    // Add more tests as needed...
})
