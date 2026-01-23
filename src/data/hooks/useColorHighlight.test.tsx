import React, { useEffect } from 'react'
import { render, waitFor } from '@testing-library/react'
import { useColorHighlight } from './useColorHighlight'

type HookApi = ReturnType<typeof useColorHighlight>

const HookHarness = ({ onReady }: { onReady: (api: HookApi) => void }) => {
    const api = useColorHighlight()
    useEffect(() => {
        onReady(api)
    }, [ api, onReady ])
    return null
}

const setMockImage = (options: { width: number; height: number; shouldFail?: boolean }) => {
    const { width, height, shouldFail } = options
    class ImageMock {
        onload: null | (() => void) = null
        onerror: null | (() => void) = null
        width = width
        height = height

        set src(_value: string) {
            if (shouldFail) {
                if (this.onerror) {
                    this.onerror()
                }
                return
            }
            if (this.onload) {
                this.onload()
            }
        }
    }

    global.Image = ImageMock as unknown as typeof Image
}

const setCanvasContextMock = (fillValue = 120) => {
    HTMLCanvasElement.prototype.getContext = jest.fn(function (this: HTMLCanvasElement) {
        return {
            drawImage: jest.fn(),
            getImageData: jest.fn(() => ({
                data: new Uint8ClampedArray(this.width * this.height * 4).fill(fillValue)
            })),
            putImageData: jest.fn()
        } as unknown as CanvasRenderingContext2D
    }) as unknown as HTMLCanvasElement['getContext']
    HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,mock')
}

describe('useColorHighlight', () => {
    const originalImage = global.Image
    const originalGetContext = HTMLCanvasElement.prototype.getContext
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL

    afterEach(() => {
        global.Image = originalImage
        HTMLCanvasElement.prototype.getContext = originalGetContext
        HTMLCanvasElement.prototype.toDataURL = originalToDataURL
        jest.clearAllMocks()
    })

    const getHookApi = async () => {
        let api: HookApi | null = null
        render(<HookHarness onReady={ (value) => { api = value } } />)
        await waitFor(() => expect(api).not.toBeNull())
        return api as HookApi
    }

    it('generates highlight masks with and without a region', async () => {
        setMockImage({ width: 1000, height: 400 })
        setCanvasContextMock()

        const api = await getHookApi()
        const result = await api.generateHighlightMask('blob:img', 'rgb(0, 0, 0)')
        expect(result).toBe('data:image/png;base64,mock')

        const regionResult = await api.generateHighlightMask('blob:img', 'rgb(0, 0, 0)', {
            tolerance: 20,
            region: { x: 10, y: 10, width: 40, height: 40 }
        })
        expect(regionResult).toBe('data:image/png;base64,mock')
    })

    it('returns null when highlight mask cannot get a canvas context', async () => {
        setMockImage({ width: 200, height: 200 })
        HTMLCanvasElement.prototype.getContext = jest.fn(() => null) as unknown as HTMLCanvasElement['getContext']

        const api = await getHookApi()
        const result = await api.generateHighlightMask('blob:img', 'rgb(0, 0, 0)')
        expect(result).toBeNull()
    })

    it('marks close matches in the highlight mask', async () => {
        setMockImage({ width: 200, height: 200 })
        setCanvasContextMock(0)

        const api = await getHookApi()
        const result = await api.generateHighlightMask('blob:img', 'rgb(0, 0, 0)')
        expect(result).toBe('data:image/png;base64,mock')
    })

    it('returns null when highlight image loading fails', async () => {
        setMockImage({ width: 200, height: 200, shouldFail: true })
        setCanvasContextMock()

        const api = await getHookApi()
        const result = await api.generateHighlightMask('blob:img', 'rgb(0, 0, 0)')
        expect(result).toBeNull()
    })

    it('generates heatmaps with and without a region', async () => {
        setMockImage({ width: 400, height: 1000 })
        setCanvasContextMock()

        const api = await getHookApi()
        const result = await api.generateDifferenceHeatmap('blob:img', 'rgb(0, 0, 0)')
        expect(result).toBe('data:image/png;base64,mock')

        const regionResult = await api.generateDifferenceHeatmap('blob:img', 'rgb(0, 0, 0)', {
            maxDistance: 120,
            region: { x: 5, y: 5, width: 20, height: 20 }
        })
        expect(regionResult).toBe('data:image/png;base64,mock')
    })

    it('returns null when heatmap cannot get a canvas context', async () => {
        setMockImage({ width: 200, height: 200 })
        HTMLCanvasElement.prototype.getContext = jest.fn(() => null) as unknown as HTMLCanvasElement['getContext']

        const api = await getHookApi()
        const result = await api.generateDifferenceHeatmap('blob:img', 'rgb(0, 0, 0)')
        expect(result).toBeNull()
    })

    it('returns null when heatmap image loading fails', async () => {
        setMockImage({ width: 200, height: 200, shouldFail: true })
        setCanvasContextMock()

        const api = await getHookApi()
        const result = await api.generateDifferenceHeatmap('blob:img', 'rgb(0, 0, 0)')
        expect(result).toBeNull()
    })
})
