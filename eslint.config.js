const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-plugin-prettier');
const reactHooks = require('eslint-plugin-react-hooks');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/**', 'node_modules/**', 'ios/**', 'android/**', '.expo/**'],
  },
  {
    plugins: {
      prettier,
    },
    rules: {
      'prettier/prettier': 'warn',
    },
  },
  {
    // Jest test files use jest globals.
    files: ['**/__tests__/**/*.{js,ts,tsx}', '**/*.test.{js,ts,tsx}'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        jest: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
  },
  {
    // Supabase edge functions run on Deno and import via npm:/jsr:
    // specifiers that the node resolver can't see.
    files: ['supabase/functions/**/*.ts'],
    rules: {
      'import/no-unresolved': 'off',
    },
  },
  {
    // Deterministic guards against common LLM failure modes:
    // sprawling functions, deep nesting, and unstructured complexity.
    rules: {
      // New compiler-powered rule; too aggressive about Date.now()-during-render
      // patterns this codebase uses deliberately. Warn, don't block.
      // Guarded: eslint-config-expo ~10 (Expo SDK 54) bundles
      // eslint-plugin-react-hooks 5.x, which predates this rule. The guard
      // activates it automatically once the plugin ships it.
      ...(reactHooks.rules && reactHooks.rules.purity
        ? { 'react-hooks/purity': 'warn' }
        : {}),
      complexity: ['error', 15],
      'max-depth': ['error', 5],
      'max-lines-per-function': [
        'error',
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
      'max-lines': ['error', { max: 1000, skipBlankLines: true, skipComments: true }],
    },
  },
]);
