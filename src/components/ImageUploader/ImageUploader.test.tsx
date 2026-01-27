import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import ImageUploader from './ImageUploader'

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
    mockCreateObjectURL.mockClear()
    mockRevokeObjectURL.mockClear()
})

describe('<ImageUploader />', () => {
    it('calls onImageSelected and shows a preview for supported images', () => {
        const handleImageSelected = jest.fn()
        const { getByTestId } = render(
            <ImageUploader onImageSelected={ handleImageSelected } />
        )

        const file = new File([ 'data' ], 'photo.png', { type: 'image/png' })
        fireEvent.change(getByTestId('image-input'), { target: { files: [ file ] } })

        expect(handleImageSelected).toHaveBeenCalledWith(file, 'blob:preview')
        expect(getByTestId('image-preview')).toHaveAttribute('src', 'blob:preview')
    })

    it('shows an error for unsupported file types', () => {
        const handleImageSelected = jest.fn()
        const { getByTestId, queryByTestId, getByRole } = render(
            <ImageUploader onImageSelected={ handleImageSelected } />
        )

        const file = new File([ 'data' ], 'note.txt', { type: 'text/plain' })
        fireEvent.change(getByTestId('image-input'), { target: { files: [ file ] } })

        expect(handleImageSelected).not.toHaveBeenCalled()
        expect(queryByTestId('image-preview')).toBeNull()
        expect(getByRole('alert')).toHaveTextContent('Unsupported file type')
    })

    it('ignores empty file selections', () => {
        const handleImageSelected = jest.fn()
        const { getByTestId } = render(
            <ImageUploader onImageSelected={ handleImageSelected } />
        )

        fireEvent.change(getByTestId('image-input'), { target: { files: [] } })
        expect(handleImageSelected).not.toHaveBeenCalled()
    })

    it('handles null file selections', () => {
        const handleImageSelected = jest.fn()
        const { getByTestId } = render(
            <ImageUploader onImageSelected={ handleImageSelected } />
        )

        fireEvent.change(getByTestId('image-input'), { target: { files: null } })
        expect(handleImageSelected).not.toHaveBeenCalled()
    })

    it('toggles dragging state on drag events', () => {
        const handleImageSelected = jest.fn()
        const { getByTestId } = render(
            <ImageUploader onImageSelected={ handleImageSelected } />
        )

        const dropzone = getByTestId('image-dropzone')
        fireEvent.dragOver(dropzone)
        fireEvent.dragLeave(dropzone)
    })

    it('accepts drag and drop uploads', () => {
        const handleImageSelected = jest.fn()
        const { getByTestId } = render(
            <ImageUploader onImageSelected={ handleImageSelected } />
        )

        const file = new File([ 'data' ], 'photo.jpeg', { type: 'image/jpeg' })
        fireEvent.drop(getByTestId('image-dropzone'), { dataTransfer: { files: [ file ] } })

        expect(handleImageSelected).toHaveBeenCalledWith(file, 'blob:preview')
        expect(getByTestId('image-preview')).toHaveAttribute('src', 'blob:preview')
    })

    it('clears the preview and calls onClear', () => {
        const handleImageSelected = jest.fn()
        const handleClear = jest.fn()
        const { getByTestId, getByText, queryByTestId } = render(
            <ImageUploader onImageSelected={ handleImageSelected } onClear={ handleClear } />
        )

        const file = new File([ 'data' ], 'photo.png', { type: 'image/png' })
        fireEvent.change(getByTestId('image-input'), { target: { files: [ file ] } })
        expect(getByTestId('image-preview')).toBeInTheDocument()

        fireEvent.click(getByText('Clear image'))
        expect(handleClear).toHaveBeenCalled()
        expect(queryByTestId('image-preview')).toBeNull()
    })

    it('revokes the object URL on unmount', () => {
        const handleImageSelected = jest.fn()
        const { getByTestId, unmount } = render(
            <ImageUploader onImageSelected={ handleImageSelected } />
        )

        const file = new File([ 'data' ], 'photo.webp', { type: 'image/webp' })
        fireEvent.change(getByTestId('image-input'), { target: { files: [ file ] } })

        unmount()
        expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:preview')
    })

    it('does not revoke when no object URL exists', () => {
        const handleImageSelected = jest.fn()
        const { unmount } = render(
            <ImageUploader onImageSelected={ handleImageSelected } />
        )

        unmount()
        expect(mockRevokeObjectURL).not.toHaveBeenCalled()
    })
})
