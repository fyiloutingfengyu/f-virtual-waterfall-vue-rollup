import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import esbuild from 'rollup-plugin-esbuild';
import babel from '@rollup/plugin-babel';
import postcss from 'rollup-plugin-postcss';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import html from '@rollup/plugin-html';
import replace from '@rollup/plugin-replace';
import vue from 'rollup-plugin-vue';
// import eslint from '@rollup/plugin-eslint';
import { readFileSync } from 'fs';
import path from 'path';

const templateHtml = readFileSync('./demo/template.html', 'utf8');

const config = {
  input: './demo/main.ts',
  output: {
    name: 'demoBundle',
    file: './demo/dist/bundle.js',
    format: 'iife',
    sourcemap: true
  },
  plugins: [
    nodeResolve(),
    commonjs(),
    esbuild({
      include: /\.[jt]s?$/,
      exclude: /node_modules/,
      sourceMap: true,
      minify: process.env.NODE_ENV === 'production',
      target: 'esnext',
      // todo f
      tsconfig: 'tsconfig.dev.json'
    }),
    // eslint(),
    vue(),
    babel({
      exclude: 'node_modules/**',
      extensions: ['.js', '.ts'],
      babelHelpers: 'runtime'
    }),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify('development'),
      'process.env.IS_DIST': process.env.IS_DIST,
      // todo f
      __VUE_OPTIONS_API__: 'true',
      __VUE_PROD_DEVTOOLS__: 'false',
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
    }),
    html({
      fileName: 'index.html',
      template: () => templateHtml,
    }),
    postcss({
      modules: false,
      extract: path.resolve('demo/dist/common.css'),
    }),
    serve({
      open: false,
      openPage: 'index.html',
      contentBase: 'demo/dist/',
      port: 3005
    }),
    livereload({
      watch: 'demo/dist'
    })
  ],
  watch: {
    include: [
      'src/**/*',
      'demo/**/*'
    ],
    exclude: 'node_modules/**'
  }
};

export default config;
