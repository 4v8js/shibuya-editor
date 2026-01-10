import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default [
  {
    input: 'src/packages/shibuya-editor/index.ts',
    output: [
      {
        file: packageJson.main,
        format: 'cjs',
        name: 'shibuya-editor',
        sourcemap: true,
      },
    ],
    external: ['react', 'react-dom', 'styled-components'],
    plugins: [
      resolve({ browser: true, extensions: ['.js', '.jsx', '.ts', '.tsx'] }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.build.json',
        include: ['src/packages/shibuya-editor/**/*'],
        exclude: ['node_modules'],
      }),
      postcss({
        inject: true,
        minimize: true,
      }),
    ],
  },
];
