// ESLint flat config: TypeScript rules for all code, Playwright rules for the tests.
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import playwright from 'eslint-plugin-playwright';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['node_modules/', 'playwright-report/', 'test-results/', 'reports/'] },

  js.configs.recommended,
  // Type-aware rules (they read tsconfig.json), e.g. no-floating-promises: a missing
  // `await` in a Playwright test is the classic cause of flaky, half-run tests.
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  {
    files: ['tests/**/*.ts'],
    ignores: ['tests/unit/**'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Helper functions whose names start with "expect" count as assertions.
      'playwright/expect-expect': ['error', { assertFunctionPatterns: ['^expect.*'] }],
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-focused-test': 'error',
      // test.skip(condition, reason) is how visual tests stay off where baselines are not rendered.
      'playwright/no-skipped-test': ['error', { allowConditional: true }],
      // A loop over pages or findings is a deliberate check of every item here.
      'playwright/no-conditional-in-test': 'off',
    },
  },

  // node:test unit tests: describe() and it() return promises that the test runner itself awaits.
  {
    files: ['tests/unit/**/*.ts', 'app/**/*.test.ts'],
    rules: { '@typescript-eslint/no-floating-promises': 'off' },
  },

  // The browser script of the app under test: plain JavaScript, browser globals.
  {
    files: ['app/web/**/*.js'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      ...tseslint.configs.disableTypeChecked.languageOptions,
      globals: { document: 'readonly', window: 'readonly', Intl: 'readonly' },
    },
  },
  { files: ['eslint.config.js'], ...tseslint.configs.disableTypeChecked },

  // Last: turn off every rule that would fight with Prettier's formatting.
  prettier,
);
