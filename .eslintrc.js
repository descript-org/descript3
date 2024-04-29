module.exports = {
    extends: [
        'plugin:nop/nop',
        'eslint:recommended',
    ],
    plugins: [
        'jest',
    ],
    env: {
        jest: true,
    },
    rules: {
        'jest/consistent-test-it': [ 'error', {
            fn: 'it',
            withinDescribe: 'it',
        } ],
        'jest/expect-expect': [ 'error', { assertFunctionNames: [ 'expect' ] } ],
        'jest/no-alias-methods': 'error',
        'jest/no-disabled-tests': 'error',
        'jest/no-focused-tests': 'error',
        'jest/no-identical-title': 'error',
        'jest/prefer-to-contain': 'error',
        'jest/prefer-to-have-length': 'error',
        'jest/no-large-snapshots': [ 'error', { maxSize: 500 } ],
        'jest/valid-expect': 'error',
    },
};

