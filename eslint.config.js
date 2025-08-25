const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const typescriptParser = require('@typescript-eslint/parser');
const typescriptPlugin = require('@typescript-eslint/eslint-plugin');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const reactNativePlugin = require('eslint-plugin-react-native');
const prettierPlugin = require('eslint-plugin-prettier');

module.exports = defineConfig([
  ...expoConfig,
  {
    ignores: [
      'eslint.config.js', 
      'eslint.config.strict.js', 
      'jest.config.js', 
      'babel.config.js',
      'admin-web/.next/**',
      'admin-web/node_modules/**',
      'admin-web/next.config.js',
      'admin-web/**/*.js',
      'admin-web/**/*.tsx',
      'admin-web/**/*.ts',
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
      globals: {
        __DEV__: 'readonly',
        global: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-native': reactNativePlugin,
      prettier: prettierPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      // ============================================
      // 🚨 ERREURS CRITIQUES - Toujours actives
      // ============================================
      
      // TypeScript - Erreurs importantes uniquement
      '@typescript-eslint/no-explicit-any': 'off', // Désactivé - certains types tiers sont complexes // Warning au lieu d'erreur
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'warn', // Warning car parfois nécessaire
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'off', // Désactivé - préférence de style
      
      // React - Règles essentielles
      'react/prop-types': 'off', // Pas nécessaire avec TypeScript
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-pascal-case': 'error',
      'react/no-children-prop': 'error',
      'react/no-danger': 'error',
      'react/no-deprecated': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/no-unknown-property': 'error',
      'react/self-closing-comp': 'warn',
      
      // React Hooks - Critique
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off', // Désactivé - trop de faux positifs
      
      // React Native - Pragmatique
      'react-native/no-unused-styles': 'off', // Désactivé temporairement - trop de faux positifs
      'react-native/no-raw-text': [
        'warn',
        {
          skip: ['ThemedText', 'Text'],
        },
      ],
      
      // ============================================
      // ⚠️ WARNINGS - Qualité de code
      // ============================================
      
      // Code smells mais pas critiques
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-debugger': 'error',
      'no-alert': 'warn',
      'no-var': 'error',
      'prefer-const': 'warn',
      'prefer-arrow-callback': 'warn',
      'prefer-template': 'warn',
      'no-multiple-empty-lines': ['warn', { max: 2 }],
      'no-trailing-spaces': 'warn',
      'eol-last': 'warn',
      'comma-dangle': ['warn', 'always-multiline'],
      'semi': ['warn', 'always'],
      'quotes': ['warn', 'single', { avoidEscape: true }],
      
      // ============================================
      // ❌ DÉSACTIVÉES - Trop strictes
      // ============================================
      
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/no-floating-promises': 'off', // Problématique en React Native
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off', // Change la logique
      '@typescript-eslint/naming-convention': 'off', // Trop rigide
      '@typescript-eslint/no-use-before-define': 'off', // OK pour les fonctions
      '@typescript-eslint/no-shadow': 'off', // Parfois nécessaire
      
      'react/no-array-index-key': 'off', // OK si pas de réordonnancement
      'react/no-unescaped-entities': 'off', // Faux positifs fréquents
      'react/jsx-boolean-value': 'off',
      'react/jsx-curly-brace-presence': 'off',
      
      'react-native/no-inline-styles': 'off', // Parfois nécessaire
      'react-native/no-color-literals': 'off', // Trop verbeux
      
      // Règles de complexité - désactivées
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'max-depth': 'off',
      'max-params': 'off',
      'complexity': 'off',
      'no-magic-numbers': 'off',
      'no-nested-ternary': 'off', // Parfois plus lisible
      'curly': ['warn', 'multi-line'], // Plus flexible
      'operator-assignment': 'off',
      
      // Import/Export
      'import/no-unresolved': 'off', // Géré par TypeScript
      'import/namespace': 'off',
      'import/first': 'warn',
      'no-duplicate-imports': 'warn',
      
      // Promises
      'promise/catch-or-return': 'off',
      'promise/always-return': 'off',
      'promise/avoid-new': 'off',
    },
  },
  {
    // Fichiers de test - règles plus souples
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-magic-numbers': 'off',
      'max-lines-per-function': 'off',
    },
  },
  {
    // Fichiers de configuration - pas de règles strictes
    files: ['*.config.js', '*.config.ts', 'babel.config.js', 'metro.config.js'],
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      'import/no-commonjs': 'off',
    },
  },
  {
    ignores: [
      'dist/**',
      'build/**',
      'node_modules/**',
      '.expo/**',
      'coverage/**',
      'android/**',
      'ios/**',
      'web-build/**',
      '.git/**',
      '.vscode/**',
      '.idea/**',
      'scripts/**',
      'jest.setup.js',
      '.eslintrc.js',
      '.prettierrc.js',
    ],
  },
]);