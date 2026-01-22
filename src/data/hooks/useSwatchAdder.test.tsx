import React from 'react'
import { render, act, fireEvent } from '@testing-library/react'
import { useSwatchAdder } from './useSwatchAdder'

jest.mock('./useColorName', () => ({
    useColorName: jest.fn().mockResolvedValue('Mock Name')
}))

const TestComponent: React.FC = () => {
    const initialPalette = [
        { rgbString: 'rgb(0, 0, 0)', label: 'Black', partsInMix: 1 }
    ]
    const { palette, addToPalette } = useSwatchAdder(initialPalette)

    return (
        <div>
            <div data-testid="palette">{ JSON.stringify(palette) }</div>
            <button
                data-testid="add-with-recipe"
                onClick={ () => addToPalette('rgb(255, 0, 0)', true, 'Bright Red') }
            >
                Add With Recipe
            </button>
            <button
                data-testid="add-duplicate"
                onClick={ () => addToPalette('rgb(0, 0, 0)', false) }
            >
                Add Duplicate
            </button>
        </div>
    )
}

describe('useSwatchAdder', () => {
    it('adds a color with recipe data when includeRecipe is true', async () => {
        const { getByTestId } = render(<TestComponent />)

        await act(async () => {
            fireEvent.click(getByTestId('add-with-recipe'))
        })

        const palette = JSON.parse(getByTestId('palette').textContent || '[]')
        expect(palette).toHaveLength(2)
        expect(palette[ 1 ].label).toBe('Bright Red')
        expect(palette[ 1 ].recipe).toEqual([
            { rgbString: 'rgb(0, 0, 0)', label: 'Black', partsInMix: 1 }
        ])
    })

    it('logs an error when adding a duplicate color', async () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
        const { getByTestId } = render(<TestComponent />)

        await act(async () => {
            fireEvent.click(getByTestId('add-duplicate'))
        })

        expect(consoleError).toHaveBeenCalledWith(
            'Selected color already in palette',
            'rgb(0, 0, 0)'
        )
        consoleError.mockRestore()
    })
})
