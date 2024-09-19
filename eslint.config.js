import jsLint from '@eslint/js';
import tsLint from 'typescript-eslint';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import vueLint from 'eslint-plugin-vue';
import vueParse from 'vue-eslint-parser';
import tsParse from '@typescript-eslint/parser';
import globals from 'globals';
import prettierLint from 'eslint-config-prettier';
import prettier from 'eslint-plugin-prettier';

export default [
  {
    files: ['demo/**/*', 'src/**/*']
  },
  jsLint.configs.recommended,
  ...tsLint.configs.recommended,
  ...vueLint.configs['flat/essential'],
  prettierLint,
  {
    plugins: {
      vueLint: vueLint,
      tsPlugin: tsPlugin,
      prettier: prettier
    },
    languageOptions: {
      parser: vueParse,
      parserOptions: {
        parser: tsParse,
        ecmaVersion: 2021,
        sourceType: 'module'
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
      'prettier/prettier': ['error']
    }
  },
  {
    ignores: ['**/*.scss', 'demo/dist/**/*', 'dist/**/*', 'build', '**/*.d.ts']
  }
];
