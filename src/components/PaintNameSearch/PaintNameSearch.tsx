import React, { useEffect, useRef, useState } from 'react'
import styles from './PaintNameSearch.module.scss'

type PaintNameSearchProps = {
    onColorSelect: (rgbString: string, label: string) => void
}

type PaintNameResult = {
    name: string
    hex: string
    rgbString: string
}

const MIN_QUERY_LENGTH = 2
const MAX_RESULTS = 8
const SEARCH_DEBOUNCE_MS = 350

const buildRgbString = (rgb: { r: number; g: number; b: number }) => {
    return `rgb(${ rgb.r }, ${ rgb.g }, ${ rgb.b })`
}

const PaintNameSearch: React.FC<PaintNameSearchProps> = ({ onColorSelect }) => {
    const [ query, setQuery ] = useState('')
    const [ results, setResults ] = useState<PaintNameResult[]>([])
    const [ isLoading, setIsLoading ] = useState(false)
    const [ error, setError ] = useState<string | null>(null)
    const lastQueryRef = useRef<string>('')
    const requestIdRef = useRef(0)

    const performSearch = async (rawQuery: string, force: boolean) => {
        const trimmedQuery = rawQuery.trim()
        if (trimmedQuery.length < MIN_QUERY_LENGTH) {
            requestIdRef.current += 1
            setResults([])
            setIsLoading(false)
            setError(trimmedQuery.length ? `Enter at least ${ MIN_QUERY_LENGTH } characters.` : null)
            return
        }

        if (!force && trimmedQuery === lastQueryRef.current) {
            return
        }

        lastQueryRef.current = trimmedQuery
        setIsLoading(true)
        setError(null)
        setResults([])

        const requestId = ++requestIdRef.current

        try {
            const response = await fetch(`https://api.color.pizza/v1/names/?name=${ encodeURIComponent(trimmedQuery) }`)
            if (!response.ok) {
                throw new Error('Request failed')
            }
            const data = await response.json()
            if (requestId !== requestIdRef.current) {
                return
            }
            const colors = Array.isArray(data?.colors) ? data.colors : []
            const nextResults = colors.slice(0, MAX_RESULTS).map((color: any) => ({
                name: color.name,
                hex: color.hex,
                rgbString: buildRgbString(color.rgb),
            }))

            setResults(nextResults)
            if (!nextResults.length) {
                setError('No results found.')
            }
        } catch (err) {
            if (requestId === requestIdRef.current) {
                setError('Could not fetch colors. Try again.')
            }
        } finally {
            if (requestId === requestIdRef.current) {
                setIsLoading(false)
            }
        }
    }

    const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        performSearch(query, true)
    }

    useEffect(() => {
        if (!query.trim()) {
            requestIdRef.current += 1
            lastQueryRef.current = ''
            setResults([])
            setError(null)
            setIsLoading(false)
            return
        }

        const timeoutId = window.setTimeout(() => {
            performSearch(query, false)
        }, SEARCH_DEBOUNCE_MS)

        return () => {
            window.clearTimeout(timeoutId)
        }
    }, [ query ])

    return (
        <section className={ styles.PaintNameSearch }>
            <form className={ styles.form } onSubmit={ handleSearch }>
                <label htmlFor="paint-name-search">Search paint name</label>
                <div className={ styles.controls }>
                    <input
                        id="paint-name-search"
                        data-testid="paint-name-input"
                        type="text"
                        value={ query }
                        onChange={ (event) => setQuery(event.target.value) }
                        placeholder="Burnt Sienna"
                    />
                    <button type="submit">Search</button>
                </div>
            </form>

            { isLoading && <div className={ styles.helper }>Searching...</div> }
            { error && !isLoading && <div className={ styles.helper }>{ error }</div> }

            { results.length > 0 && (
                <div className={ styles.results }>
                    { results.map((result, index) => (
                        <button
                            key={ `${ result.name }-${ index }` }
                            type="button"
                            data-testid="paint-result"
                            className={ styles.result }
                            onClick={ () => onColorSelect(result.rgbString, result.name) }
                        >
                            <span
                                className={ styles.swatch }
                                style={ { backgroundColor: result.rgbString } }
                            />
                            <span className={ styles.name }>{ result.name }</span>
                            <span className={ styles.hex }>{ result.hex }</span>
                        </button>
                    )) }
                </div>
            ) }
        </section>
    )
}

export default PaintNameSearch
