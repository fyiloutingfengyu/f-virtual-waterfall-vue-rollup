import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import { babel } from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';
import eslint from '@rollup/plugin-eslint';
import vue from 'rollup-plugin-vue';
import path from 'path';
import fRollupClear from '../plugins/f-rollup-plugin-clear.js';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'es',
    }
  ],
  plugins: [
    fRollupClear({ outputDir: 'dist' }),
    postcss({
      extensions: ['.scss', '.css'],
      // 将样式提取到 dist/main.css 文件中
      extract: path.resolve('dist/main.css'),
      minimize: true
    }),
    nodeResolve(),
    commonjs(),
    typescript({ tsconfig: './tsconfig.prod.json' }),
    // eslint(),
    vue(),
    babel({
      include: './src/**/*',
      extensions: ['.js', '.ts'],
      babelHelpers: 'runtime'
    }),
    terser()
  ],
  external: ['vue']
};


