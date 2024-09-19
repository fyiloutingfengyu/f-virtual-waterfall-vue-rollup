import jsLint from '@eslint/js';
import tsLint from 'typescript-eslint';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import vueLint from 'eslint-plugin-vue';
import vueParse from 'vue-eslint-parser';
import tsParse from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  {
    files: [
      'demo/**/*',
      'src/**/*',
    ],
  },
  jsLint.configs.recommended,
  ...tsLint.configs.recommended,
  ...vueLint.configs['flat/essential'],
  {
    plugins: {
      vueLint: vueLint,
      tsPlugin: tsPlugin
    },
    languageOptions: {
      parser: vueParse,
      parserOptions: {
        parser: tsParse,
        ecmaVersion: 2021,
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.commonjs
      }
    },
    rules: {
      // 允许使用any类型
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    ignores: [
      '**/*.scss',
      'demo/dist/**/*',
      'dist/**/*',
      'build',
      '**/*.d.ts'
    ]
  }
];
