module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:playwright/recommended',
    'prettier'
  ],
  plugins: ['@typescript-eslint', 'playwright'],
  env: {
    node: true,
    es2021: true
  },
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'playwright/no-wait-for-timeout': 'warn',
    'playwright/expect-expect': 'warn'
  },
  ignorePatterns: ['node_modules/', 'playwright-report/', 'test-results/', 'dist/']
};
