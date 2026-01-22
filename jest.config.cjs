module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        "\\.(css|scss)$": "<rootDir>/__mocks__/styleMock.js"
    },
    setupFilesAfterEnv: ['./src/setupTests.ts'],
};
