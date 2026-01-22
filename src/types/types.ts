export type ColorPart = {
	label: string
	partsInMix: number
	rgbString: string
	recipe?: ColorPart[]
}

export type PaletteManager = {
	palette: ColorPart[]
	handleSwatchIncrement: (index: number) => void
	handleSwatchDecrement: (index: number) => void
	handleRemoveFromPalette: (index: number) => void
	resetPalette: () => void
	addToPalette: (rgbString: string, includeRecipe: boolean, labelOverride?: string) => void
	updateColorName: (index: number, newName: string) => void
	applyMixParts: (updates: Array<{ index: number; parts: number }>) => void
}

export type RecipeSuggestion = {
	ingredients: Array<{ index: number; parts: number }>
	resultRgb: string
	deltaE: number
	matchPct: number
}

export type ExtractedColor = {
	rgbString: string
	coveragePct: number
}

export type Rgb = {
	r: number
	g: number
	b: number
	a?: number
}

export type Hsva = {
	h: number
	s: number
	v: number
	a: number
}
