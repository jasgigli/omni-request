/**
 * Rollup configuration for OmniRequest
 *
 * This configuration builds the library for both ESM and CommonJS formats
 * with proper TypeScript support and source maps.
 */

import typescript from "rollup-plugin-typescript2";
import { defineConfig } from "rollup";

// Package info
const pkg = require("./package.json");

// Banner to add to the top of each file
const banner = `/**
 * ${pkg.name} v${pkg.version}
 * ${pkg.description}
 *
 * @author ${pkg.author.name} <${pkg.author.email}>
 * @license ${pkg.license}
 * @preserve
 */`;

// External dependencies that should not be bundled
const external = [
  // Node.js built-ins
  "http",
  "https",
  "fs",
  "path",
  "url",
  "stream",
  "events",
  "util",
  // Dependencies from package.json
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
];

const config = defineConfig({
  input: "src/index.ts",
  output: [
    {
      file: pkg.module || "dist/index.js",
      format: "esm",
      sourcemap: true,
      exports: "named",
      banner,
    },
    {
      file: pkg.main.replace("./dist/", "./dist/") || "dist/index.cjs",
      format: "cjs",
      sourcemap: true,
      exports: "named",
      banner,
    },
  ],
  plugins: [
    typescript({
      tsconfig: "./tsconfig.json",
      clean: true,
      useTsconfigDeclarationDir: true,
      abortOnError: false,
      check: false,
      tsconfigOverride: {
        compilerOptions: {
          noEmitOnError: false,
          skipLibCheck: true,
        },
      },
    }),
  ],
  external,
});

export default config;

// For CommonJS compatibility
if (typeof module !== "undefined") {
  module.exports = config;
}
