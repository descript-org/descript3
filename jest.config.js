module.exports = {
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/tests/expect.js',
        '/tests/server.js',
        '/tests/helpers.js',
    ],
    setupFilesAfterEnv: [
        './tests/expect.js',
    ],
    testEnvironment: 'node',
    testRunner: 'jest-circus/runner',
};

