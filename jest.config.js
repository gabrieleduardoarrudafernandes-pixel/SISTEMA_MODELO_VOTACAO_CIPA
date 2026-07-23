module.exports = {
    testEnvironment: 'node',
    testMatch: ['<rootDir>/tests/**/*.test.js'],
    verbose: true,
    forceExit: true,
    // This is important to ensure Jest doesn't try to run tests in node_modules
    testPathIgnorePatterns: [
        "/node_modules/"
    ],
    // Setup files to run before each test file
    setupFilesAfterEnv: [],
    // To ensure mocks are cleared between tests
    clearMocks: true,
};