import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import { dts } from "rollup-plugin-dts";

export default [
  {
    input: 'src/index.ts',
    output: {
      file: 'build/jsonpad.js',
      format: 'umd',
      name: 'JSONPad',
    },
    plugins: [
      typescript(),
      nodeResolve({
        preferBuiltins: false,
        mainFields: ['module', 'browser', 'main'],
      }),
      commonjs({
        include: /node_modules/,
        requireReturnsDefault: 'auto',
      }),
      terser(),
    ].filter(Boolean),
  },
  {
    input: './build/index.d.ts',
    output: [{
      file: 'build/jsonpad.d.ts',
      format: 'es',
    }],
    plugins: [dts()],
  },
];
