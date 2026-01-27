import { createRecipeSuggester } from '../utils/suggestRecipe'
import { ColorPart, RecipeSuggestion } from '../types/types'

type SuggestRecipeOptions = {
    maxColors?: number
    maxTotalParts?: number
}

type RecipeWorkerRequest = {
    id: number
    palette: ColorPart[]
    colors: string[]
    options?: SuggestRecipeOptions
}

type RecipeWorkerResponse = {
    id: number
    suggestions: Array<RecipeSuggestion | null>
}

const MAX_SUGGESTION_CACHE = 250
const MAX_PALETTE_CACHE = 8
const suggestionCache = new Map<string, RecipeSuggestion | null>()
const paletteCache = new Map<string, (targetRgb: string) => RecipeSuggestion | null>()

const buildOptionsKey = (options?: SuggestRecipeOptions) => {
    if (!options) {
        return 'default'
    }
    const maxColors = options.maxColors ?? 'default'
    const maxTotalParts = options.maxTotalParts ?? 'default'
    return `${ maxColors }|${ maxTotalParts }`
}

const buildPaletteKey = (palette: ColorPart[], options?: SuggestRecipeOptions) => {
    const paletteKey = palette.map((color) => color.rgbString).join('|')
    return `${ paletteKey }::${ buildOptionsKey(options) }`
}

const getSuggester = (palette: ColorPart[], options?: SuggestRecipeOptions) => {
    const key = buildPaletteKey(palette, options)
    const cached = paletteCache.get(key)
    if (cached) {
        return cached
    }

    const suggester = createRecipeSuggester(palette, options)
    paletteCache.set(key, suggester)
    if (paletteCache.size > MAX_PALETTE_CACHE) {
        const firstKey = paletteCache.keys().next().value
        if (firstKey) {
            paletteCache.delete(firstKey)
        }
    }
    return suggester
}

const setSuggestionCache = (key: string, value: RecipeSuggestion | null) => {
    suggestionCache.set(key, value)
    if (suggestionCache.size > MAX_SUGGESTION_CACHE) {
        const firstKey = suggestionCache.keys().next().value
        if (firstKey) {
            suggestionCache.delete(firstKey)
        }
    }
}

const ctx = self as unknown as {
    onmessage: ((event: MessageEvent<RecipeWorkerRequest>) => void) | null
    postMessage: (message: RecipeWorkerResponse) => void
}

ctx.onmessage = (event: MessageEvent<RecipeWorkerRequest>) => {
    const { id, palette, colors, options } = event.data
    const paletteKey = buildPaletteKey(palette, options)
    const suggester = getSuggester(palette, options)

    const suggestions = colors.map((targetRgb) => {
        const cacheKey = `${ paletteKey }::${ targetRgb }`
        if (suggestionCache.has(cacheKey)) {
            return suggestionCache.get(cacheKey) ?? null
        }
        const result = suggester(targetRgb)
        setSuggestionCache(cacheKey, result)
        return result
    })

    const response: RecipeWorkerResponse = { id, suggestions }
    ctx.postMessage(response)
}
