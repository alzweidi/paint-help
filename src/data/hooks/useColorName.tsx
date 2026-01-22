export const useColorName = async (hexColor: string): Promise<string> => {
    try {
        const response = await fetch(`https://api.color.pizza/v1/?values=${ hexColor }`)
        const data = await response.json()
        return data.colors[ 0 ].name
    } catch (error) {
        return hexColor // Return the hex value as a fallback
    }
}
