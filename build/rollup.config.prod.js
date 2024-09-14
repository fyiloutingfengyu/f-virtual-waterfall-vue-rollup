import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import esbuild from 'rollup-plugin-esbuild';
import { dts } from 'rollup-plugin-dts';
import { babel } from '@rollup/plugin-babel';
import postcss from 'rollup-plugin-postcss';
import eslint from '@rollup/plugin-eslint';
import vue from 'rollup-plugin-vue';
import path from 'path';
import fRollupClear from '../plugins/f-rollup-plugin-clear.js';

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'es',
      }
    ],
    plugins: [
      fRollupClear({ outputDir: 'dist' }),
      nodeResolve(),
      commonjs(),
      esbuild({
        include: /\.[jt]s?$/,
        exclude: /node_modules/,
        sourceMap: false,
        minify: true,
        target: 'esnext',
        tsconfig: 'tsconfig.prod.json'
      }),
      // eslint(),
      vue(),
      babel({
        include: './src/**/*',
        extensions: ['.js', '.ts'],
        babelHelpers: 'runtime'
      }),
      postcss({
        // extensions: ['.scss', '.css'],
        // 将样式提取到 dist/main.css 文件中
        extract: path.resolve('dist/main.css'),
        minimize: true
      }),
    ],
    external: ['vue']
  },
  {
    input: './src/index.d.ts',
    output: {
      file: './dist/index.d.ts',
      format: 'es'
    },
    plugins: [
      dts()
    ],
    // external: [/\.vue$/]
  }
];


