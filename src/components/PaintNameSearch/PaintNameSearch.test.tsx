import React from 'react'
import { render, fireEvent, act } from '@testing-library/react'
import PaintNameSearch from './PaintNameSearch'

class MockResponse {
    body: any

    constructor(body: any) {
        this.body = body
    }

    get ok() {
        return true
    }

    json() {
        return Promise.resolve(this.body)
    }
}

const mockFetch = jest.fn()
global.fetch = mockFetch as any

describe('<PaintNameSearch />', () => {
    beforeEach(() => {
        mockFetch.mockReset()
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('searches by name and adds a result', async () => {
        mockFetch.mockResolvedValue(
            new MockResponse({
                colors: [
                    {
                        name: 'Burnt Sienna',
                        hex: '#a93400',
                        rgb: { r: 169, g: 52, b: 0 }
                    }
                ]
            })
        )

        const handleSelect = jest.fn()
        const { getByTestId, findByText } = render(
            <PaintNameSearch onColorSelect={ handleSelect } />
        )

        fireEvent.change(getByTestId('paint-name-input'), { target: { value: 'burnt' } })
        await act(async () => {
            jest.advanceTimersByTime(400)
        })

        await findByText('Burnt Sienna')
        fireEvent.click(getByTestId('paint-result'))

        expect(handleSelect).toHaveBeenCalledWith('rgb(169, 52, 0)', 'Burnt Sienna')
    })

    it('shows a validation message for short queries', async () => {
        const { getByTestId, findByText } = render(
            <PaintNameSearch onColorSelect={ jest.fn() } />
        )

        fireEvent.change(getByTestId('paint-name-input'), { target: { value: 'a' } })
        fireEvent.submit(getByTestId('paint-name-input').closest('form') as HTMLFormElement)

        expect(await findByText('Enter at least 2 characters.')).toBeInTheDocument()
        expect(mockFetch).not.toHaveBeenCalled()
    })

    it('does not show a validation message for empty submits', () => {
        const { getByTestId, queryByText } = render(
            <PaintNameSearch onColorSelect={ jest.fn() } />
        )

        fireEvent.submit(getByTestId('paint-name-input').closest('form') as HTMLFormElement)

        expect(queryByText('Enter at least 2 characters.')).toBeNull()
        expect(mockFetch).not.toHaveBeenCalled()
    })

    it('avoids duplicate searches for the same trimmed query', async () => {
        mockFetch.mockResolvedValue(
            new MockResponse({
                colors: [
                    {
                        name: 'Burnt Sienna',
                        hex: '#a93400',
                        rgb: { r: 169, g: 52, b: 0 }
                    }
                ]
            })
        )

        const { getByTestId, findByText } = render(
            <PaintNameSearch onColorSelect={ jest.fn() } />
        )

        fireEvent.change(getByTestId('paint-name-input'), { target: { value: 'burnt' } })
        await act(async () => {
            jest.advanceTimersByTime(400)
        })
        await findByText('Burnt Sienna')

        fireEvent.change(getByTestId('paint-name-input'), { target: { value: 'burnt ' } })
        await act(async () => {
            jest.advanceTimersByTime(400)
        })

        expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('clears errors when the query is empty', async () => {
        mockFetch.mockResolvedValue(
            new MockResponse({
                colors: [
                    {
                        name: 'Blue',
                        hex: '#0000ff',
                        rgb: { r: 0, g: 0, b: 255 }
                    }
                ]
            })
        )

        const { getByTestId, queryByText, findByText } = render(
            <PaintNameSearch onColorSelect={ jest.fn() } />
        )

        fireEvent.change(getByTestId('paint-name-input'), { target: { value: 'blue' } })
        await act(async () => {
            jest.advanceTimersByTime(400)
        })
        await findByText('Blue')

        fireEvent.change(getByTestId('paint-name-input'), { target: { value: '' } })
        await act(async () => {
            jest.advanceTimersByTime(400)
        })

        expect(queryByText('Enter at least 2 characters.')).toBeNull()
    })

    it('handles empty results', async () => {
        mockFetch.mockResolvedValue(new MockResponse({ colors: [] }))

        const { getByTestId, findByText } = render(
            <PaintNameSearch onColorSelect={ jest.fn() } />
        )

        fireEvent.change(getByTestId('paint-name-input'), { target: { value: 'zz' } })
        await act(async () => {
            jest.advanceTimersByTime(400)
        })

        expect(await findByText('No results found.')).toBeInTheDocument()
    })

    it('handles non-array color responses', async () => {
        mockFetch.mockResolvedValue(new MockResponse({ colors: null }))

        const { getByTestId, findByText } = render(
            <PaintNameSearch onColorSelect={ jest.fn() } />
        )

        fireEvent.change(getByTestId('paint-name-input'), { target: { value: 'zz' } })
        await act(async () => {
            jest.advanceTimersByTime(400)
        })

        expect(await findByText('No results found.')).toBeInTheDocument()
    })

    it('handles null payloads from the API', async () => {
        mockFetch.mockResolvedValue(new MockResponse(null))

        const { getByTestId, findByText } = render(
            <PaintNameSearch onColorSelect={ jest.fn() } />
        )

        fireEvent.change(getByTestId('paint-name-input'), { target: { value: 'zz' } })
        await act(async () => {
            jest.advanceTimersByTime(400)
        })

        expect(await findByText('No results found.')).toBeInTheDocument()
    })

    it('shows an error when the request fails', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'))

        const { getByTestId, findByText } = render(
            <PaintNameSearch onColorSelect={ jest.fn() } />
        )

        fireEvent.change(getByTestId('paint-name-input'), { target: { value: 'blue' } })
        await act(async () => {
            jest.advanceTimersByTime(400)
        })

        expect(await findByText('Could not fetch colors. Try again.')).toBeInTheDocument()
    })

    it('handles non-ok responses', async () => {
        mockFetch.mockResolvedValue({ ok: false, json: jest.fn() })

        const { getByTestId, findByText } = render(
            <PaintNameSearch onColorSelect={ jest.fn() } />
        )

        fireEvent.change(getByTestId('paint-name-input'), { target: { value: 'gray' } })
        await act(async () => {
            jest.advanceTimersByTime(400)
        })

        expect(await findByText('Could not fetch colors. Try again.')).toBeInTheDocument()
    })

    it('handles stale responses by keeping the latest results', async () => {
        const first = new MockResponse({
            colors: [
                { name: 'Old', hex: '#000000', rgb: { r: 0, g: 0, b: 0 } }
            ]
        })
        const second = new MockResponse({
            colors: [
                { name: 'New', hex: '#ffffff', rgb: { r: 255, g: 255, b: 255 } }
            ]
        })

        let resolveFirst: (value: MockResponse) => void
        let resolveSecond: (value: MockResponse) => void
        const firstPromise = new Promise<MockResponse>((resolve) => { resolveFirst = resolve })
        const secondPromise = new Promise<MockResponse>((resolve) => { resolveSecond = resolve })

        mockFetch
            .mockImplementationOnce(() => firstPromise)
            .mockImplementationOnce(() => secondPromise)

        const { getByTestId, findByText, queryByText } = render(
            <PaintNameSearch onColorSelect={ jest.fn() } />
        )

        fireEvent.change(getByTestId('paint-name-input'), { target: { value: 'old' } })
        await act(async () => {
            jest.advanceTimersByTime(400)
        })

        fireEvent.change(getByTestId('paint-name-input'), { target: { value: 'new' } })
        await act(async () => {
            jest.advanceTimersByTime(400)
        })

        await act(async () => {
            resolveFirst!(first)
            resolveSecond!(second)
        })

        await findByText('New')
        expect(queryByText('Old')).toBeNull()
    })
})
