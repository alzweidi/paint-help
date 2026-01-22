import "@testing-library/jest-dom"

declare global {
	namespace jest {
		interface Matchers<R> {
			toBeWithinRange(a: number, b: number): R
		}
	}
}

declare const setupFilesAfterEnv: string[]

export { setupFilesAfterEnv }
