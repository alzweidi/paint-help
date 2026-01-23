import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import RegionSelector from './RegionSelector'

const setBoundingClientRect = (element: HTMLElement, rect: DOMRect) => {
    Object.defineProperty(element, 'getBoundingClientRect', {
        value: () => rect
    })
}

describe('<RegionSelector />', () => {
    it('selects a region when dragging a valid area', () => {
        const onRegionSelected = jest.fn()
        const { getByAltText } = render(
            <RegionSelector
                imageUrl="blob:reference"
                onRegionSelected={ onRegionSelected }
                selectedRegion={ null }
            />
        )

        const img = getByAltText('Reference')
        const container = img.parentElement as HTMLElement
        setBoundingClientRect(container, {
            left: 0,
            top: 0,
            width: 200,
            height: 100,
            right: 200,
            bottom: 100,
            x: 0,
            y: 0,
            toJSON: () => ''
        } as DOMRect)

        fireEvent.mouseDown(container, { clientX: 10, clientY: 10 })
        fireEvent.mouseMove(container, { clientX: 110, clientY: 60 })
        fireEvent.mouseUp(container)

        expect(onRegionSelected).toHaveBeenCalledWith(null)
        const region = onRegionSelected.mock.calls[ 1 ][ 0 ]
        expect(region.x).toBeCloseTo(5)
        expect(region.y).toBeCloseTo(10)
        expect(region.width).toBeCloseTo(50)
        expect(region.height).toBeCloseTo(50)
    })

    it('ignores tiny drag regions', () => {
        const onRegionSelected = jest.fn()
        const { getByAltText } = render(
            <RegionSelector
                imageUrl="blob:reference"
                onRegionSelected={ onRegionSelected }
                selectedRegion={ null }
            />
        )

        const img = getByAltText('Reference')
        const container = img.parentElement as HTMLElement
        setBoundingClientRect(container, {
            left: 0,
            top: 0,
            width: 200,
            height: 100,
            right: 200,
            bottom: 100,
            x: 0,
            y: 0,
            toJSON: () => ''
        } as DOMRect)

        fireEvent.mouseDown(container, { clientX: 10, clientY: 10 })
        fireEvent.mouseMove(container, { clientX: 11, clientY: 11 })
        fireEvent.mouseUp(container)

        expect(onRegionSelected).toHaveBeenCalledTimes(1)
        expect(onRegionSelected).toHaveBeenCalledWith(null)
    })

    it('clears a selected region', () => {
        const onRegionSelected = jest.fn()
        const { getByText } = render(
            <RegionSelector
                imageUrl="blob:reference"
                onRegionSelected={ onRegionSelected }
                selectedRegion={ { x: 10, y: 20, width: 30, height: 40 } }
            />
        )

        fireEvent.click(getByText('Clear selection'))
        expect(onRegionSelected).toHaveBeenCalledWith(null)
    })

    it('ignores move and up events when not drawing', () => {
        const onRegionSelected = jest.fn()
        const { getByAltText } = render(
            <RegionSelector
                imageUrl="blob:reference"
                onRegionSelected={ onRegionSelected }
                selectedRegion={ null }
            />
        )

        const img = getByAltText('Reference')
        const container = img.parentElement as HTMLElement
        fireEvent.mouseMove(container, { clientX: 10, clientY: 10 })
        fireEvent.mouseUp(container)

        expect(onRegionSelected).not.toHaveBeenCalled()
    })
})
