import pluginVue from 'eslint-plugin-vue'
import pluginTypeScript from '@typescript-eslint/eslint-plugin'
import parserTypeScript from '@typescript-eslint/parser'
import vueParser from 'vue-eslint-parser'

export default [
  {
    ignores: ['node_modules/**', '.output/**', '.nuxt/**', 'dist/**', 'scripts/**', 'modules/**', 'services/**'],
  },
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.{ts,vue}'],
    plugins: { '@typescript-eslint': pluginTypeScript },
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: parserTypeScript,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true }],
      // WordPress HTML is sanitized with sanitizeHtml() before reaching v-html.
      'vue/no-v-html': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-self-closing': ['warn', { html: { void: 'never', normal: 'never', component: 'always' } }],
    },
  },
]
