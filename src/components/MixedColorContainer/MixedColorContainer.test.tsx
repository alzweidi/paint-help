import React from 'react'
import { render } from '@testing-library/react'
import MixedColorContainer from './MixedColorContainer'

describe('<MixedColorContainer />', () => {
    it('renders without crashing', () => {
        const mockProps = {
            mixedColor: "rgb(255, 255, 255)",
            mixedColorName: "Sunset Orange",
            isUsingTargetColor: true,
            matchPercentage: "95"
        }

        const { getByText } = render(<MixedColorContainer { ...mockProps } />)

        expect(getByText("Sunset Orange")).toBeInTheDocument()
        expect(getByText("95%")).toBeInTheDocument()
    })

    it('hides color details when mixed color is transparent', () => {
        const { queryByText } = render(
            <MixedColorContainer
                mixedColor="rgba(0, 0, 0, 0)"
                mixedColorName="Invisible"
                isUsingTargetColor={ false }
                matchPercentage="0"
            />
        )

        expect(queryByText("Mixed Color")).toBeNull()
        expect(queryByText("Invisible")).toBeNull()
    })

    it('hides match percentage when target color is not active', () => {
        const { queryByText } = render(
            <MixedColorContainer
                mixedColor="#FF5733"
                mixedColorName="Sunset Orange"
                isUsingTargetColor={ false }
                matchPercentage="50"
            />
        )

        expect(queryByText("Target Match")).toBeNull()
    })

    it('renders dark mixed color for contrast branch coverage', () => {
        const { getByText } = render(
            <MixedColorContainer
                mixedColor="rgb(0, 0, 0)"
                mixedColorName="Night"
                isUsingTargetColor={ true }
                matchPercentage="12"
            />
        )

        expect(getByText("Night")).toBeInTheDocument()
    })
})
