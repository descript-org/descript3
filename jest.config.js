/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/tests/expect.ts',
        '/tests/server.js',
        '/tests/helpers.ts',
    ],
    setupFilesAfterEnv: [
        './tests/expect.ts',
    ],
    preset: 'ts-jest/presets/js-with-ts',
    //preset: 'ts-jest',

    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                useESM: true,
            },
        ],
    },
    testEnvironment: 'node',
    testRunner: 'jest-circus/runner',
};
