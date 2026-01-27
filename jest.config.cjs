module.exports = {
    testEnvironment: 'jsdom',
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    moduleNameMapper: {
        "\\.(css|scss)$": "<rootDir>/__mocks__/styleMock.js"
    },
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { useESM: true, tsconfig: '<rootDir>/tsconfig.jest.json' }]
    },
    setupFilesAfterEnv: ['./src/setupTests.ts'],
};
