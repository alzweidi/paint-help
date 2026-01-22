import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import ColorSwatches from './ColorSwatches'

interface ColorSwatchesProps {
  palette: any[] // An array representing the color palette.
  handleSwatchIncrement: (index: number) => void // Function to handle the increment of a swatch's parts.
  handleSwatchDecrement: (index: number) => void // Function to handle the decrement of a swatch's parts.
  handleRemoveFromPalette: (index: number) => void // Function to handle the removal of a swatch from the palette.
  updateColorName: (index: number, name: string) => void // Function to update the name of a color swatch.
  totalParts: number // Represents the total parts in the mix.
}

const mockHandleRemoveFromPalette = jest.fn()
const mockHandleSwatchIncrement = jest.fn()
const mockHandleSwatchDecrement = jest.fn()
const mockUpdateColorName = jest.fn()

beforeEach(() => {
  mockHandleRemoveFromPalette.mockClear()
  mockHandleSwatchIncrement.mockClear()
  mockHandleSwatchDecrement.mockClear()
  mockUpdateColorName.mockClear()
})


const mockPalette = [
  {
    rgbString: "#FF5733",
    label: "Red",
    partsInMix: 2,
    recipe: [
      { rgbString: "#FF0000", partsInMix: 1, label: "Pure Red" },
      { rgbString: "#FFA500", partsInMix: 1, label: "Orange" }
    ]
  },
  {
    rgbString: "#33FF57",
    label: "Green",
    partsInMix: 1,
    recipe: null
  }
]


// Mock total parts in the mix
const mockTotalParts = mockPalette.reduce((acc, swatch) => acc + swatch.partsInMix, 0)


describe('<ColorSwatches />', () => {
  it('renders without crashing', () => {
    render(
      <ColorSwatches
        palette={ mockPalette }
        handleSwatchIncrement={ mockHandleSwatchIncrement }
        handleSwatchDecrement={ mockHandleSwatchDecrement }
        handleRemoveFromPalette={ mockHandleRemoveFromPalette }
        updateColorName={ mockUpdateColorName }
        totalParts={ mockTotalParts }
      />
    )
  })

  it('renders the correct number of swatches', () => {
    const { getAllByTestId } = render(
      <ColorSwatches
        palette={ mockPalette }
        handleSwatchIncrement={ mockHandleSwatchIncrement }
        handleSwatchDecrement={ mockHandleSwatchDecrement }
        handleRemoveFromPalette={ mockHandleRemoveFromPalette }
        updateColorName={ mockUpdateColorName }
        totalParts={ mockTotalParts }
      />
    )
    const swatches = getAllByTestId('swatchContainer')
    expect(swatches.length).toBe(mockPalette.length)
  })

  it('calls handleRemoveFromPalette with correct index when remove button is clicked', () => {
    const { getByTestId } = render(
      <ColorSwatches
        palette={ mockPalette }
        handleSwatchIncrement={ mockHandleSwatchIncrement }
        handleSwatchDecrement={ mockHandleSwatchDecrement }
        handleRemoveFromPalette={ mockHandleRemoveFromPalette }
        updateColorName={ mockUpdateColorName }
        totalParts={ mockTotalParts }
      />)

    const removeButton = getByTestId('remove-button-0')
    fireEvent.click(removeButton)
    expect(mockHandleRemoveFromPalette).toHaveBeenCalledWith(0)
  })

  it('allows editing color name and calls updateColorName with correct parameters', () => {
    const { getByTestId, getByRole } = render(
      <ColorSwatches
        palette={ mockPalette }
        handleSwatchIncrement={ mockHandleSwatchIncrement }
        handleSwatchDecrement={ mockHandleSwatchDecrement }
        handleRemoveFromPalette={ mockHandleRemoveFromPalette }
        updateColorName={ mockUpdateColorName }
        totalParts={ mockTotalParts }
      />
    )
    const colorLabel = getByTestId('name-0')
    fireEvent.click(colorLabel)
    const input = getByRole('textbox')
    fireEvent.change(input, { target: { value: 'New Red' } })
    fireEvent.blur(input)

    expect(mockUpdateColorName).toHaveBeenCalledWith(0, 'New Red')
  })

  it('calls handleSwatchIncrement when swatch parts are clicked', () => {
    const { getByTestId } = render(
      <ColorSwatches
        palette={ mockPalette }
        handleSwatchIncrement={ mockHandleSwatchIncrement }
        handleSwatchDecrement={ mockHandleSwatchDecrement }
        handleRemoveFromPalette={ mockHandleRemoveFromPalette }
        updateColorName={ mockUpdateColorName }
        totalParts={ mockTotalParts }
      />
    )
    const swatchParts = getByTestId('swatch-parts-0')
    fireEvent.click(swatchParts)
    expect(mockHandleSwatchIncrement).toHaveBeenCalledWith(0)
  })

  it('calls handleSwatchDecrement when subtract button is clicked', () => {
    const { getByTestId } = render(
      <ColorSwatches
        palette={ mockPalette }
        handleSwatchIncrement={ mockHandleSwatchIncrement }
        handleSwatchDecrement={ mockHandleSwatchDecrement }
        handleRemoveFromPalette={ mockHandleRemoveFromPalette }
        updateColorName={ mockUpdateColorName }
        totalParts={ mockTotalParts }
      />
    )
    const subtractButton = getByTestId('subtract-button-0')
    fireEvent.click(subtractButton)
    expect(mockHandleSwatchDecrement).toHaveBeenCalledWith(0)
  })

  it('toggles recipe info display when info button is clicked', async () => {
    const { getByTestId, queryByText, findByText } = render(
      <ColorSwatches
        palette={ mockPalette }
        handleSwatchIncrement={ mockHandleSwatchIncrement }
        handleSwatchDecrement={ mockHandleSwatchDecrement }
        handleRemoveFromPalette={ mockHandleRemoveFromPalette }
        updateColorName={ mockUpdateColorName }
        totalParts={ mockTotalParts }
      />
    )

    expect(queryByText(/Pure Red/i)).toBeNull()

    fireEvent.click(getByTestId('recipe-info-button-0'))
    await findByText(/Pure Red/i)

    fireEvent.click(getByTestId('recipe-info-button-0'))
    expect(queryByText(/Pure Red/i)).toBeNull()

    fireEvent.click(getByTestId('recipe-info-button-0'))
    await findByText(/Pure Red/i)

    fireEvent.click(getByTestId('recipe-info-0'))
    expect(queryByText(/Pure Red/i)).toBeNull()
  })

  it('edits a dark swatch name to cover dark input styles', () => {
    const darkPalette = [
      {
        rgbString: "rgb(0, 0, 0)",
        label: "Dark",
        partsInMix: 1,
        recipe: null
      }
    ]

    const { getByTestId, getByRole } = render(
      <ColorSwatches
        palette={ darkPalette }
        handleSwatchIncrement={ mockHandleSwatchIncrement }
        handleSwatchDecrement={ mockHandleSwatchDecrement }
        handleRemoveFromPalette={ mockHandleRemoveFromPalette }
        updateColorName={ mockUpdateColorName }
        totalParts={ 1 }
      />
    )

    fireEvent.click(getByTestId('name-0'))
    const input = getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Darker' } })
    fireEvent.blur(input)

    expect(mockUpdateColorName).toHaveBeenCalledWith(0, 'Darker')
  })

  it('handles dark swatches and hides percentages for zero parts', () => {
    const darkPalette = [
      {
        rgbString: "rgb(0, 0, 0)",
        label: "Dark",
        partsInMix: 0,
        recipe: [
          { rgbString: "rgb(255, 255, 255)", partsInMix: 1, label: "Light" },
          { rgbString: "rgb(0, 0, 0)", partsInMix: 1, label: "Dark" }
        ]
      },
      {
        rgbString: "rgb(255, 255, 255)",
        label: "Light",
        partsInMix: 1,
        recipe: null
      }
    ]

    const totalParts = darkPalette.reduce((acc, swatch) => acc + swatch.partsInMix, 0)

    const { getByTestId } = render(
      <ColorSwatches
        palette={ darkPalette }
        handleSwatchIncrement={ mockHandleSwatchIncrement }
        handleSwatchDecrement={ mockHandleSwatchDecrement }
        handleRemoveFromPalette={ mockHandleRemoveFromPalette }
        updateColorName={ mockUpdateColorName }
        totalParts={ totalParts }
      />
    )

    expect(getByTestId('swatch-parts-0').textContent).not.toMatch(/%/)

    fireEvent.click(getByTestId('recipe-info-button-0'))
    expect(getByTestId('recipe-info-0')).toBeInTheDocument()
  })

  it('renders recipe info with a light swatch', () => {
    const lightPalette = [
      {
        rgbString: "rgb(255, 255, 255)",
        label: "Light",
        partsInMix: 1,
        recipe: [
          { rgbString: "rgb(0, 0, 0)", partsInMix: 1, label: "Dark" }
        ]
      }
    ]

    const { getByTestId } = render(
      <ColorSwatches
        palette={ lightPalette }
        handleSwatchIncrement={ mockHandleSwatchIncrement }
        handleSwatchDecrement={ mockHandleSwatchDecrement }
        handleRemoveFromPalette={ mockHandleRemoveFromPalette }
        updateColorName={ mockUpdateColorName }
        totalParts={ 1 }
      />
    )

    fireEvent.click(getByTestId('recipe-info-button-0'))
    expect(getByTestId('recipe-info-0')).toBeInTheDocument()
  })

})
