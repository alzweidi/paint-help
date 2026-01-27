import React from 'react'
import { render, fireEvent, waitFor, within } from '@testing-library/react'
import ExtractedColorsPanel from './ExtractedColorsPanel'

jest.mock('../../data/hooks/useColorHighlight', () => ({
    useColorHighlight: () => ({
        generateHighlightMask: () => Promise.resolve('data:highlight-mask'),
        generateDifferenceHeatmap: () => Promise.resolve('data:heatmap-mask')
    })
}))

const palette = [
    { label: 'Ultramarine', partsInMix: 0, rgbString: 'rgb(10, 20, 30)' },
    { label: 'Titanium White', partsInMix: 0, rgbString: 'rgb(255, 255, 255)' },
    { label: 'Saved Mix', partsInMix: 0, rgbString: 'rgb(1, 2, 3)', recipe: [] }
]

const regionProps = {
    selectedRegion: null,
    onRegionChange: jest.fn(),
    isRegionMode: false,
    savedLoadouts: [],
    onSaveLoadout: jest.fn(),
    onLoadLoadout: jest.fn(),
    onDeleteLoadout: jest.fn(),
    onRenameLoadout: jest.fn()
}

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
                { ...regionProps }
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

        const { getAllByTestId, getByText } = render(
            <ExtractedColorsPanel
                colors={ [ { rgbString: 'rgb(1, 2, 3)', coveragePct: 88.8 } ] }
                selectedIndex={ 0 }
                onSelect={ onSelect }
                referenceImageUrl={ 'blob:reference' }
                palette={ palette }
                suggestions={ suggestions }
                { ...regionProps }
            />
        )

        expect(getAllByTestId('base-paint')).toHaveLength(2)
        expect(getByText('Ultramarine')).toBeInTheDocument()
        expect(getByText('2 parts Ultramarine + 1 part Titanium White')).toBeInTheDocument()
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
                { ...regionProps }
            />
        )

        expect(getByText('Upload an image to extract colors.')).toBeInTheDocument()
        expect(getByText('No paints yet. Use search below to add paints.')).toBeInTheDocument()
    })

    it('renders the accuracy panel and toggles highlight/heatmap overlays', async () => {
        const onSelect = jest.fn()
        const suggestions = [
            {
                ingredients: [ { index: 0, parts: 1 } ],
                resultRgb: 'rgb(120, 130, 140)',
                deltaE: 1,
                matchPct: 98.5
            }
        ]

        const { getByText, getByAltText, queryByAltText } = render(
            <ExtractedColorsPanel
                colors={ [ { rgbString: 'rgb(1, 2, 3)', coveragePct: 88.8 } ] }
                selectedIndex={ 0 }
                onSelect={ onSelect }
                referenceImageUrl={ 'blob:reference' }
                palette={ palette }
                suggestions={ suggestions }
                { ...regionProps }
                selectedRegion={ { x: 10, y: 10, width: 20, height: 20 } }
            />
        )

        expect(getByText('Visual accuracy')).toBeInTheDocument()
        expect(getByText('Match 98.5%')).toBeInTheDocument()
        expect(getByText('Delta E 1.00')).toBeInTheDocument()

        fireEvent.click(getByText('Highlight'))
        await waitFor(() => expect(getByAltText('Color highlight')).toBeInTheDocument())
        expect(getByText('Highlighting Color 1 in the image')).toBeInTheDocument()
        fireEvent.click(getByText('Clear'))
        await waitFor(() => expect(queryByAltText('Color highlight')).toBeNull())

        fireEvent.click(getByText('Heatmap'))
        await waitFor(() => expect(getByAltText('Difference heatmap')).toBeInTheDocument())
        expect(getByText('Heatmap: green is close, red is off')).toBeInTheDocument()
        fireEvent.click(getByText('Clear'))
        await waitFor(() => expect(queryByAltText('Difference heatmap')).toBeNull())
    })

    it('toggles highlight state when clicking the same swatch', async () => {
        const onSelect = jest.fn()
        const { getAllByTestId, getByText, queryByText } = render(
            <ExtractedColorsPanel
                colors={ [ { rgbString: 'rgb(1, 2, 3)', coveragePct: 88.8 } ] }
                selectedIndex={ 0 }
                onSelect={ onSelect }
                referenceImageUrl={ 'blob:reference' }
                palette={ palette }
                suggestions={ [] }
                { ...regionProps }
            />
        )

        const swatch = getAllByTestId('extracted-swatch')[ 0 ]
        fireEvent.click(swatch)
        expect(onSelect).toHaveBeenCalledWith(0)
        expect(getByText('Highlighting Color 1 in the image')).toBeInTheDocument()

        fireEvent.click(swatch)
        await waitFor(() => expect(queryByText('Highlighting Color 1 in the image')).toBeNull())
    })

    it('renders heatmaps without a selected region', async () => {
        const onSelect = jest.fn()
        const suggestions = [
            {
                ingredients: [ { index: 0, parts: 1 } ],
                resultRgb: 'rgb(120, 130, 140)',
                deltaE: 1,
                matchPct: 98.5
            }
        ]

        const { getByText, getByAltText } = render(
            <ExtractedColorsPanel
                colors={ [ { rgbString: 'rgb(1, 2, 3)', coveragePct: 88.8 } ] }
                selectedIndex={ 0 }
                onSelect={ onSelect }
                referenceImageUrl={ 'blob:reference' }
                palette={ palette }
                suggestions={ suggestions }
                { ...regionProps }
            />
        )

        fireEvent.click(getByText('Heatmap'))
        await waitFor(() => expect(getByAltText('Difference heatmap')).toBeInTheDocument())
    })

    it('renders region selector and region info when in region mode', () => {
        const onSelect = jest.fn()
        const selectedRegion = { x: 10, y: 20, width: 30, height: 40 }
        const { getByText } = render(
            <ExtractedColorsPanel
                colors={ [] }
                selectedIndex={ null }
                onSelect={ onSelect }
                referenceImageUrl={ 'blob:reference' }
                palette={ palette }
                suggestions={ [] }
                selectedRegion={ selectedRegion }
                onRegionChange={ jest.fn() }
                isRegionMode={ true }
                onSaveLoadout={ jest.fn() }
                onLoadLoadout={ jest.fn() }
                onDeleteLoadout={ jest.fn() }
                savedLoadouts={ [] }
            />
        )

        expect(getByText('Region selected — colors will be extracted from this area')).toBeInTheDocument()
        expect(getByText('Extracting colors from selected region')).toBeInTheDocument()
    })

    it('supports loadout save, load, rename, delete, and paint removal', () => {
        const onSelect = jest.fn()
        const onRemovePaint = jest.fn()
        const onSaveLoadout = jest.fn()
        const onLoadLoadout = jest.fn()
        const onDeleteLoadout = jest.fn()
        const onRenameLoadout = jest.fn()
        const savedLoadouts = [ { name: 'Studio', palette } ]

        const { getByText, getAllByTestId, getAllByRole, getByRole } = render(
            <ExtractedColorsPanel
                colors={ [ { rgbString: 'rgb(1, 2, 3)', coveragePct: 88.8 } ] }
                selectedIndex={ 0 }
                onSelect={ onSelect }
                referenceImageUrl={ 'blob:reference' }
                palette={ palette }
                suggestions={ [] }
                selectedRegion={ null }
                onRegionChange={ jest.fn() }
                isRegionMode={ false }
                onRemovePaint={ onRemovePaint }
                onSaveLoadout={ onSaveLoadout }
                onLoadLoadout={ onLoadLoadout }
                onDeleteLoadout={ onDeleteLoadout }
                onRenameLoadout={ onRenameLoadout }
                savedLoadouts={ savedLoadouts }
            />
        )

        fireEvent.click(getByRole('button', { name: 'Save' }))
        const saveDialog = getByRole('dialog', { name: 'Save loadout' })
        fireEvent.change(within(saveDialog).getByLabelText('Loadout name'), { target: { value: 'Session' } })
        fireEvent.click(within(saveDialog).getByRole('button', { name: 'Save' }))
        expect(onSaveLoadout).toHaveBeenCalledWith('Session')

        const selects = getAllByRole('combobox')
        fireEvent.change(selects[ 0 ], { target: { value: 'Studio' } })
        expect(onLoadLoadout).toHaveBeenCalledWith('Studio')

        fireEvent.click(getByRole('button', { name: 'Rename' }))
        const renameDialog = getByRole('dialog', { name: 'Rename loadout' })
        fireEvent.change(within(renameDialog).getByLabelText('New name'), { target: { value: 'Studio 2' } })
        fireEvent.click(within(renameDialog).getByRole('button', { name: 'Rename' }))
        expect(onRenameLoadout).toHaveBeenCalledWith('Studio', 'Studio 2')

        fireEvent.click(getByRole('button', { name: 'Delete' }))
        const deleteDialog = getByRole('dialog', { name: 'Delete loadout' })
        fireEvent.click(within(deleteDialog).getByRole('button', { name: 'Delete' }))
        expect(onDeleteLoadout).toHaveBeenCalledWith('Studio')

        fireEvent.click(getAllByTestId('base-paint')[ 0 ].querySelector('button') as HTMLElement)
        expect(onRemovePaint).toHaveBeenCalledWith(0)
    })

    it('handles missing selected colors safely', () => {
        const onSelect = jest.fn()
        const { getByText } = render(
            <ExtractedColorsPanel
                colors={ [] }
                selectedIndex={ 0 }
                onSelect={ onSelect }
                referenceImageUrl={ null }
                palette={ [] }
                suggestions={ [] }
                selectedRegion={ null }
                onRegionChange={ jest.fn() }
                isRegionMode={ false }
            />
        )

        expect(getByText('Upload an image to extract colors.')).toBeInTheDocument()
    })

    it('labels low match suggestions appropriately', () => {
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

        const { getByText } = render(
            <ExtractedColorsPanel
                colors={ [ { rgbString: 'rgb(20, 20, 20)', coveragePct: 12 } ] }
                selectedIndex={ 0 }
                onSelect={ onSelect }
                referenceImageUrl={ 'blob:reference' }
                palette={ minimalPalette }
                suggestions={ lowMatchSuggestions }
                { ...regionProps }
            />
        )

        expect(getByText('Best possible match')).toBeInTheDocument()
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
                { ...regionProps }
            />
        )

        expect(getByText('1 part Paint 1')).toBeInTheDocument()
    })
})
