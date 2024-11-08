module.exports = {
    'extends': [
        'eslint:recommended',
        'plugin:jest/recommended',
        'plugin:jest/style',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    plugins: [
        'jest',
        '@typescript-eslint',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        },
    },
    rules: {
        'no-var': [ 'off' ],

        '@typescript-eslint/array-type': [ 'error', {
            'default': 'generic',
            readonly: 'generic',
        } ],
        '@typescript-eslint/brace-style': [ 'error', '1tbs' ],
        '@typescript-eslint/consistent-type-imports': [ 'error' ],
        '@typescript-eslint/explicit-function-return-type': [ 'off' ],
        '@typescript-eslint/explicit-module-boundary-types': [ 'off' ],
        '@typescript-eslint/indent': [ 'error', 4, {
            SwitchCase: 1,
        } ],
        '@typescript-eslint/member-delimiter-style': [ 'error' ],
        '@typescript-eslint/naming-convention': [ 'error',
            {
                selector: 'default',
                format: [ 'camelCase' ],
                leadingUnderscore: 'allow',
                trailingUnderscore: 'forbid',
                filter: {
                    regex: '^(UNSAFE_componentWillReceiveProps|UNSAFE_componentWillMount|UNSAFE_componentWillUpdate)$',
                    match: false,
                },
            },
            {
                selector: 'class',
                format: [ 'PascalCase' ],
            },
            {
                selector: 'enum',
                format: [ 'PascalCase', 'UPPER_CASE' ],
            },
            {
                selector: 'enumMember',
                format: [ 'camelCase', 'PascalCase', 'UPPER_CASE' ],
            },
            {
                selector: 'function',
                format: [ 'camelCase', 'PascalCase' ],
            },
            {
                selector: 'interface',
                format: [ 'PascalCase' ],
            },
            {
                selector: 'method',
                format: [ 'camelCase', 'snake_case', 'UPPER_CASE' ],
                leadingUnderscore: 'allow',
                filter: {
                    regex: '^(UNSAFE_componentWillReceiveProps|UNSAFE_componentWillMount|UNSAFE_componentWillUpdate)$',
                    match: false,
                },
            },
            {
                selector: 'parameter',
                format: [ 'camelCase', 'PascalCase' ],
                leadingUnderscore: 'allow',
            },
            {
                selector: 'property',
                format: null,
            },
            {
                selector: 'typeAlias',
                format: [ 'PascalCase' ],
            },
            {
                selector: 'typeParameter',
                format: [ 'PascalCase', 'UPPER_CASE' ],
            },
            {
                selector: 'variable',
                format: [ 'camelCase', 'PascalCase', 'UPPER_CASE' ],
                leadingUnderscore: 'allow',
            } ],
        '@typescript-eslint/no-duplicate-imports': [ 'error' ],
        '@typescript-eslint/no-empty-function': [ 'off' ],
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/no-use-before-define': 'off',
        '@typescript-eslint/no-useless-constructor': [ 'error' ],
        '@typescript-eslint/type-annotation-spacing': 'error',

        // отключены в пользу @typescript-eslint
        'brace-style': 'off',
        camelcase: 'off',
        indent: 'off',
        'no-unused-vars': 'off',
        'no-use-before-define': 'off',
        'no-useless-constructor': 'off',

        'array-bracket-spacing': [ 'error', 'always' ],
        'comma-dangle': [ 'error', 'always-multiline' ],
        'comma-spacing': [ 'error' ],
        'comma-style': [ 'error', 'last' ],
        curly: [ 'error', 'all' ],
        'eol-last': 'error',
        eqeqeq: [ 'error', 'allow-null' ],
        'id-match': [ 'error', '^[\\w$]+$' ],
        'jsx-quotes': [ 'error', 'prefer-double' ],
        'key-spacing': [ 'error', {
            beforeColon: false,
            afterColon: true,
        } ],
        'keyword-spacing': 'error',
        'linebreak-style': [ 'error', 'unix' ],
        'lines-around-comment': [ 'error', {
            beforeBlockComment: true,
            allowBlockStart: true,
        } ],
        'max-len': [ 'error', 160, 4 ],
        'no-console': 'error',
        'no-empty': [ 'error', { allowEmptyCatch: true } ],
        'no-implicit-coercion': [ 'error', {
            number: true,
            'boolean': true,
            string: true,
        } ],
        'no-mixed-operators': [ 'error', {
            groups: [
                [ '&&', '||' ],
            ],
        } ],
        'no-mixed-spaces-and-tabs': 'error',
        'no-multiple-empty-lines': [ 'error', {
            max: 2,
            maxEOF: 0,
            maxBOF: 0,
        } ],
        'no-multi-spaces': 'error',
        'no-multi-str': 'error',
        'no-nested-ternary': 'error',
        // Это правило добавили в eslint@6 в eslint:recommended. Оно нам не надо
        'no-prototype-builtins': 'off',
        'no-trailing-spaces': 'error',
        'no-spaced-func': 'error',
        'no-with': 'error',
        'object-curly-spacing': [ 'error', 'always' ],
        'object-shorthand': 'off',
        'one-var': [ 'error', 'never' ],
        'operator-linebreak': [ 'error', 'after' ],
        'prefer-const': 'error',
        'prefer-rest-params': 'off',
        'prefer-spread': 'off',
        'quote-props': [ 'error', 'as-needed', {
            keywords: true,
            numbers: true,
        } ],
        quotes: [ 'error', 'single', {
            allowTemplateLiterals: true,
        } ],
        radix: 'error',
        semi: [ 'error', 'always' ],
        'space-before-function-paren': [ 'error', 'never' ],
        'space-before-blocks': [ 'error', 'always' ],
        'space-in-parens': [ 'error', 'never' ],
        'space-infix-ops': 'error',
        'space-unary-ops': 'off',
        'template-curly-spacing': [ 'error', 'always' ],
        'valid-jsdoc': [ 'error', {
            requireParamDescription: false,
            requireReturnDescription: false,
            requireReturn: false,
            prefer: {
                'return': 'returns',
            },
        } ],
        'wrap-iife': [ 'error', 'inside' ],
        yoda: [ 'error', 'never', { exceptRange: true } ],

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
    env: {
        node: true,
        jest: true,
    },
    overrides: [
        {
            files: [ '*.ts', '*.tsx' ],
            rules: {
                '@typescript-eslint/no-require-imports': 'error',
                '@typescript-eslint/no-use-before-define': [ 'error', {
                    functions: false,
                } ],
                'prefer-rest-params': 'error',
                'prefer-spread': 'error',
            },
        },
    ],
};
