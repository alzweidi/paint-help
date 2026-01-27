import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
import Mixer from './Mixer'

const extractColorsMock = jest.fn()

jest.mock('../../data/hooks/useImageColorExtraction', () => ({
    useImageColorExtraction: () => ({
        extractColors: extractColorsMock
    })
}))

jest.mock('../../utils/suggestRecipe', () => ({
    __esModule: true,
    createRecipeSuggester: () => () => null
}))

const mockCreateObjectURL = jest.fn(() => 'blob:preview')
const mockRevokeObjectURL = jest.fn()

const originalCreateObjectURL = URL.createObjectURL
const originalRevokeObjectURL = URL.revokeObjectURL

beforeAll(() => {
    Object.defineProperty(URL, 'createObjectURL', {
        value: mockCreateObjectURL,
        writable: true
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
        value: mockRevokeObjectURL,
        writable: true
    })
})

afterAll(() => {
    if (originalCreateObjectURL) {
        Object.defineProperty(URL, 'createObjectURL', {
            value: originalCreateObjectURL,
            writable: true
        })
    }
    if (originalRevokeObjectURL) {
        Object.defineProperty(URL, 'revokeObjectURL', {
            value: originalRevokeObjectURL,
            writable: true
        })
    }
})

beforeEach(() => {
    extractColorsMock.mockReset()
    mockCreateObjectURL.mockClear()
    mockRevokeObjectURL.mockClear()
})

describe('<Mixer />', () => {
    it('shows analyzing state while extracting colors', async () => {
        let resolveExtract: (colors: Array<{ rgbString: string; coveragePct: number }>) => void
        const extractPromise = new Promise<Array<{ rgbString: string; coveragePct: number }>>((resolve) => {
            resolveExtract = resolve
        })
        extractColorsMock.mockReturnValueOnce(extractPromise)

        const { getByTestId, getByText, queryByText } = render(<Mixer />)
        const file = new File([ 'data' ], 'photo.png', { type: 'image/png' })
        fireEvent.change(getByTestId('image-input'), { target: { files: [ file ] } })

        expect(getByText('Analyzing...')).toBeInTheDocument()
        resolveExtract!([])
        await waitFor(() => expect(queryByText('Analyzing...')).toBeNull())
    })

    it('re-extracts when the distinct toggle changes', async () => {
        extractColorsMock.mockResolvedValue([])

        const { getByTestId } = render(<Mixer />)
        const file = new File([ 'data' ], 'photo.png', { type: 'image/png' })
        fireEvent.change(getByTestId('image-input'), { target: { files: [ file ] } })

        await waitFor(() => expect(extractColorsMock).toHaveBeenCalledTimes(1))
        expect(extractColorsMock.mock.calls[ 0 ][ 2 ].mode).toBe('distinct')

        fireEvent.click(getByTestId('distinct-toggle'))
        await waitFor(() => expect(extractColorsMock).toHaveBeenCalledTimes(2))
        expect(extractColorsMock.mock.calls[ 1 ][ 2 ].mode).toBe('dominant')
    })
})
