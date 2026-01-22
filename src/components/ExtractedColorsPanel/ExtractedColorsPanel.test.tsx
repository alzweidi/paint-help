import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import ExtractedColorsPanel from './ExtractedColorsPanel'

const palette = [
    { label: 'Ultramarine', partsInMix: 0, rgbString: 'rgb(10, 20, 30)' },
    { label: 'Titanium White', partsInMix: 0, rgbString: 'rgb(255, 255, 255)' },
    { label: 'Saved Mix', partsInMix: 0, rgbString: 'rgb(1, 2, 3)', recipe: [] }
]

describe('<ExtractedColorsPanel />', () => {
    it('renders extracted swatches and handles selection', () => {
        const onSelect = jest.fn()
        const { getAllByTestId, getByTestId } = render(
            <ExtractedColorsPanel
                colors={ [
                    { rgbString: 'rgb(1, 2, 3)', coveragePct: 62.5 },
                    { rgbString: 'rgb(9, 8, 7)', coveragePct: 37.5 }
                ] }
                selectedIndex={ 1 }
                onSelect={ onSelect }
                referenceImageUrl={ null }
                palette={ palette }
                suggestions={ [] }
            />
        )

        const swatches = getAllByTestId('extracted-swatch')
        expect(swatches).toHaveLength(2)
        expect(swatches[ 1 ]).toHaveAttribute('aria-pressed', 'true')
        expect(getByTestId('coverage-0')).toHaveTextContent('62.5%')

        fireEvent.click(swatches[ 0 ])
        expect(onSelect).toHaveBeenCalledWith(0)
    })

    it('shows available base paints and suggestion details', () => {
        const onSelect = jest.fn()
        const suggestions = [
            {
                ingredients: [
                    { index: 0, parts: 2 },
                    { index: 1, parts: 1 },
                ],
                resultRgb: 'rgb(120, 130, 140)',
                deltaE: 1,
                matchPct: 98.5
            }
        ]

        const handleApply = jest.fn()
        const { getAllByTestId, getByRole, getByText } = render(
            <ExtractedColorsPanel
                colors={ [ { rgbString: 'rgb(1, 2, 3)', coveragePct: 88.8 } ] }
                selectedIndex={ 0 }
                onSelect={ onSelect }
                referenceImageUrl={ 'blob:reference' }
                palette={ palette }
                suggestions={ suggestions }
                onApplySuggestion={ handleApply }
            />
        )

        expect(getAllByTestId('base-paint')).toHaveLength(2)
        expect(getByText('Ultramarine')).toBeInTheDocument()
        expect(getByText('2 parts Ultramarine + 1 part Titanium White')).toBeInTheDocument()

        fireEvent.click(getByRole('button', { name: /apply to mixer/i }))
        expect(handleApply).toHaveBeenCalledWith(suggestions[ 0 ])
    })

    it('shows placeholders when no colors or base paints are available', () => {
        const onSelect = jest.fn()
        const { getByText } = render(
            <ExtractedColorsPanel
                colors={ [] }
                selectedIndex={ null }
                onSelect={ onSelect }
                referenceImageUrl={ null }
                palette={ [] }
                suggestions={ [] }
            />
        )

        expect(getByText('Upload an image to extract colors.')).toBeInTheDocument()
        expect(getByText('No paints yet.')).toBeInTheDocument()
    })

    it('labels low match suggestions and omits the apply button when not provided', () => {
        const onSelect = jest.fn()
        const lowMatchSuggestions = [
            {
                ingredients: [ { index: 0, parts: 1 } ],
                resultRgb: 'rgb(10, 10, 10)',
                deltaE: 50,
                matchPct: 50
            }
        ]
        const minimalPalette = [
            { label: 'Charcoal', partsInMix: 0, rgbString: 'rgb(0, 0, 0)' }
        ]

        const { getByText, queryByRole } = render(
            <ExtractedColorsPanel
                colors={ [ { rgbString: 'rgb(20, 20, 20)', coveragePct: 12 } ] }
                selectedIndex={ 0 }
                onSelect={ onSelect }
                referenceImageUrl={ 'blob:reference' }
                palette={ minimalPalette }
                suggestions={ lowMatchSuggestions }
            />
        )

        expect(getByText('Best possible match')).toBeInTheDocument()
        expect(queryByRole('button', { name: /apply to mixer/i })).toBeNull()
    })

    it('falls back to generic paint labels when palette indices are missing', () => {
        const onSelect = jest.fn()
        const suggestions = [
            {
                ingredients: [ { index: 0, parts: 1 } ],
                resultRgb: 'rgb(10, 10, 10)',
                deltaE: 1,
                matchPct: 99
            }
        ]

        const { getByText } = render(
            <ExtractedColorsPanel
                colors={ [ { rgbString: 'rgb(20, 20, 20)', coveragePct: 45 } ] }
                selectedIndex={ 0 }
                onSelect={ onSelect }
                referenceImageUrl={ null }
                palette={ [] }
                suggestions={ suggestions }
            />
        )

        expect(getByText('1 part Paint 1')).toBeInTheDocument()
    })
})
