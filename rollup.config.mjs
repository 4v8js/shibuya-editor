import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import postcss from 'rollup-plugin-postcss';

const packageJson = require('./package.json');

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
    external: ['react', 'react-dom'],
    plugins: [
      resolve({ browser: true }),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      postcss({
        inject: true,
        minimize: true,
      }),
    ],
  },
];
