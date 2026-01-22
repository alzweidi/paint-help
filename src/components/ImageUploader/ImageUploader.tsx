import React, { useEffect, useState } from 'react'
import styles from './ImageUploader.module.scss'

type ImageUploaderProps = {
    onImageSelected: (file: File, objectUrl: string) => void
}

const ACCEPTED_IMAGE_TYPES = new Set([ 'image/png', 'image/jpeg', 'image/webp' ])

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected }) => {
    const [ objectUrl, setObjectUrl ] = useState<string | null>(null)
    const [ isDragging, setIsDragging ] = useState(false)

    useEffect(() => {
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl)
            }
        }
    }, [ objectUrl ])

    const handleFiles = (files: FileList | null) => {
        const file = files?.[ 0 ]
        if (!file) {
            return
        }

        if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
            return
        }

        const nextObjectUrl = URL.createObjectURL(file)
        setObjectUrl(nextObjectUrl)
        onImageSelected(file, nextObjectUrl)
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(event.target.files)
        event.target.value = ''
    }

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        setIsDragging(false)
        handleFiles(event.dataTransfer.files)
    }

    return (
        <div
            className={ `${ styles.ImageUploader } ${ isDragging ? styles.dragging : '' }` }
            onDragOver={ handleDragOver }
            onDragLeave={ handleDragLeave }
            onDrop={ handleDrop }
            data-testid="image-dropzone"
        >
            <label className={ styles.label }>
                <span>Reference Image</span>
                <span className={ styles.hint }>Drag &amp; drop or click to upload</span>
                <input
                    className={ styles.input }
                    data-testid="image-input"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={ handleFileChange }
                />
            </label>
            { objectUrl && (
                <img
                    className={ styles.preview }
                    data-testid="image-preview"
                    src={ objectUrl }
                    alt="Reference preview"
                />
            ) }
        </div>
    )
}

export default ImageUploader
