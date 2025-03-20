module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript'
  ],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'import/order': ['error', {
      'groups': [
        'builtin',
        'external',
        'internal',
        ['parent', 'sibling'],
        'index'
      ],
      'newlines-between': 'always',
      'alphabetize': {
        'order': 'asc',
        'caseInsensitive': true
      }
    }],
    'import/no-unresolved': 'error',
    'import/named': 'error',
    'import/default': 'error',
    'import/namespace': 'error'
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
  },
};