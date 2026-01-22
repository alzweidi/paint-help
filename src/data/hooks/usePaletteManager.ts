import { useCallback } from "react"
import { ColorPart, PaletteManager } from "../../types/types"
import { useSwatchAdder } from "./useSwatchAdder"

const usePaletteManager = (initialPalette: ColorPart[]): PaletteManager => {
	const { palette, setPalette, addToPalette } = useSwatchAdder(initialPalette)

	const handleSwatchIncrement = useCallback(
		(index: number) => {
			const updatedPalette = [...palette]
			updatedPalette[index].partsInMix++
			setPalette(updatedPalette)
		},
		[palette]
	)

	const handleSwatchDecrement = useCallback(
		(index: number) => {
			const updatedPalette = [...palette]
			if (updatedPalette[index].partsInMix > 0)
				updatedPalette[index].partsInMix--
			setPalette(updatedPalette)
		},
		[palette]
	)

	const handleRemoveFromPalette = useCallback(
		(index: number) => {
			const updatedPalette = [...palette]
			updatedPalette.splice(index, 1)
			setPalette(updatedPalette)
		},
		[palette]
	)

	const resetPalette = useCallback(() => {
		const resetPalette = palette.map((color) => ({
			...color,
			partsInMix: 0,
		}))
		setPalette(resetPalette)
	}, [palette])

	const updateColorName = (index: number, newName: string) => {
		const updatedPalette = [...palette]
		updatedPalette[index].label = newName
		setPalette(updatedPalette)
	}

	const applyMixParts = useCallback(
		(updates: Array<{ index: number; parts: number }>) => {
			setPalette((currentPalette) => {
				const updatedPalette = currentPalette.map((color) => ({
					...color,
					partsInMix: 0,
				}))

				for (const update of updates) {
					if (updatedPalette[update.index]) {
						updatedPalette[update.index] = {
							...updatedPalette[update.index],
							partsInMix: update.parts,
						}
					}
				}

				return updatedPalette
			})
		},
		[setPalette]
	)
	return {
		palette,
		handleSwatchIncrement,
		handleSwatchDecrement,
		handleRemoveFromPalette,
		resetPalette,
		addToPalette,
		updateColorName,
		applyMixParts,
	}
}

export default usePaletteManager
