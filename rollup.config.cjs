const json = require('@rollup/plugin-json');
const typescript = require('rollup-plugin-typescript2');
const pkg = require('./package.json');

module.exports = {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    {
      file: pkg.module,
      format: 'esm',
      sourcemap: true,
    },
  ],
  plugins: [json(), typescript({ tsconfig: "./tsconfig.json" })],
  external: [
    ...Object.keys(pkg.dependencies || {}),
    "http",
    "https",
    "url",
    "react",
    "react/jsx-runtime"
  ],
};
