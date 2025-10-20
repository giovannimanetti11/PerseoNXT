import pluginVue from 'eslint-plugin-vue';
import pluginUnicorn from 'eslint-plugin-unicorn';
import pluginTypeScript from '@typescript-eslint/eslint-plugin';
import parserTypeScript from '@typescript-eslint/parser';
import vueParser from 'vue-eslint-parser';

export default [
  {
    files: ['**/*.{js,vue,ts}'],
    ignores: ['node_modules/**', '.output/**', '.nuxt/**', 'dist/**'],
    plugins: {
      vue: pluginVue,
      unicorn: pluginUnicorn,
      '@typescript-eslint': pluginTypeScript,
    },
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: parserTypeScript,
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      'vue/no-unused-vars': 'error',
      'vue/require-prop-types': 'error',
      'unicorn/prefer-at': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "ignoreRestSiblings": true 
      }],
      'unicorn/no-array-reduce': 'warn',
    },
  },
];