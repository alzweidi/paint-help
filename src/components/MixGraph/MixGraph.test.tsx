import React from 'react'
import { render } from '@testing-library/react'
import MixGraph from './MixGraph'
import styles from './MixGraph.module.scss'
import '@testing-library/jest-dom/'
describe('MixGraph', () => {
    const palette = [
        { label: "Red", partsInMix: 2, rgbString: "rgb(255,0,0)" },
        { label: "Green", partsInMix: 3, rgbString: "rgb(0,255,0)" },
        { label: "Blue", partsInMix: 0, rgbString: "rgb(0,0,255)" },
    ]

    it('renders without crashing', () => {
        render(<MixGraph palette={ palette } totalParts={ 5 } />)
    })

    it('renders the correct number of color segments', () => {
        const { container } = render(<MixGraph palette={ palette } totalParts={ 5 } />)
        const segments = Array.from(container.querySelectorAll('div > span')) // direct children divs of the main div
        expect(segments.length).toBe(2) // only two have non-zero partsInMix
    })

    it('does not render segments with zero parts', () => {
        const { container } = render(<MixGraph palette={ palette } totalParts={ 5 } />)
        const blueSegment = Array.from(container.getElementsByClassName(styles.segment)).find(
            (div) => (div as HTMLElement).style.backgroundColor === 'rgb(0,0,255)'
        )
        expect(blueSegment).toBeUndefined() // should not find the blue segment
    })
})
