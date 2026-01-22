export default function isDark(color): boolean {
	if (color.a === 0) {
		return false
	}
	let luma = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b // per ITU-R BT.709
	return luma < 80
}
