import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import ColorBoxUI from './ColorBoxUI'

describe('<ColorBoxUI />', () => {
    const mockProps = {
        mixedColor: "#FFFFFF",
        setMixedColor: jest.fn(),
        isUsingTargetColor: true,
        targetColor: {},
        resetPalette: jest.fn(),
        toggleIsUsingTargetColor: jest.fn(),
        isSavable: true,
        addToPalette: jest.fn(),
        hasPartsInMix: jest.fn().mockReturnValue(true),
        palette: []
    }

    it('renders without crashing', () => {
        render(<ColorBoxUI { ...mockProps } />)
    })

    it('calls resetPalette when reset button is clicked', () => {
        const { getByText } = render(<ColorBoxUI { ...mockProps } />)
        fireEvent.click(getByText('Reset'))
        expect(mockProps.resetPalette).toHaveBeenCalled()
    })
    it('calls addToPalette when save button is clicked', () => {
        const { getByText } = render(<ColorBoxUI { ...mockProps } />)
        fireEvent.click(getByText('Save'))
        expect(mockProps.addToPalette).toHaveBeenCalledWith(mockProps.mixedColor, true)
    })

    it('displays "Saved" when isSavable is false', () => {
        const { queryByText } = render(<ColorBoxUI { ...mockProps } isSavable={ false } />)
        expect(queryByText('Saved')).toBeTruthy()
    })

    it('calls toggleIsUsingTargetColor when target button is clicked', () => {
        const { getByText } = render(<ColorBoxUI { ...mockProps } />)
        fireEvent.click(getByText('Target'))
        expect(mockProps.toggleIsUsingTargetColor).toHaveBeenCalled()
    })

    it('renders target off icon when not using target color', () => {
        const { getByTestId } = render(
            <ColorBoxUI
                { ...mockProps }
                isUsingTargetColor={ false }
                hasPartsInMix={ jest.fn().mockReturnValue(false) }
            />
        )

        expect(getByTestId('target-off-icon')).toBeInTheDocument()
    })

    it('calls hasPartsInMix for opacity calculations', () => {
        const hasPartsInMix = jest.fn().mockReturnValue(false)
        render(<ColorBoxUI { ...mockProps } hasPartsInMix={ hasPartsInMix } />)

        expect(hasPartsInMix).toHaveBeenCalled()
    })

    it('covers light and dark contrast branches', () => {
        const { rerender } = render(
            <ColorBoxUI
                { ...mockProps }
                mixedColor="rgb(255, 255, 255)"
                isUsingTargetColor={ true }
                targetColor={ { h: 0, s: 0, v: 0, a: 1 } }
            />
        )

        rerender(
            <ColorBoxUI
                { ...mockProps }
                mixedColor="rgb(255, 255, 255)"
                isUsingTargetColor={ true }
                targetColor={ { h: 0, s: 0, v: 100, a: 1 } }
            />
        )

        rerender(
            <ColorBoxUI
                { ...mockProps }
                mixedColor="rgb(0, 0, 0)"
                isUsingTargetColor={ false }
                hasPartsInMix={ jest.fn().mockReturnValue(false) }
            />
        )
    })

    it('sets button text colors based on mixed and target colors', () => {
        const { getByText, rerender } = render(
            <ColorBoxUI
                { ...mockProps }
                mixedColor="rgb(0, 0, 0)"
                isUsingTargetColor={ false }
            />
        )

        const resetButton = getByText('Reset').closest('button') as HTMLElement
        const targetButton = getByText('Target').closest('button') as HTMLElement
        expect(resetButton).toHaveStyle({ color: 'white' })
        expect(targetButton).toHaveStyle({ color: 'white' })

        rerender(
            <ColorBoxUI
                { ...mockProps }
                mixedColor="rgb(255, 255, 255)"
                isUsingTargetColor={ true }
                targetColor={ { h: 0, s: 0, v: 100, a: 1 } }
            />
        )

        const resetButtonLight = getByText('Reset').closest('button') as HTMLElement
        const targetButtonLight = getByText('Target').closest('button') as HTMLElement
        expect(resetButtonLight).toHaveStyle({ color: 'black' })
        expect(targetButtonLight).toHaveStyle({ color: 'black' })
    })
})
