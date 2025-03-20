import json from "@rollup/plugin-json";
import typescript from "rollup-plugin-typescript2";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf8"));

export default {
  input: "src/index.ts",
  output: [
    {
      file: pkg.main,
      format: "cjs",
      sourcemap: true,
      exports: "named",
    },
    {
      file: pkg.module,
      format: "esm",
      sourcemap: true,
    },
  ],
  plugins: [
    json(),
    typescript({
      tsconfig: "./tsconfig.json",
      clean: true,
      check: false, // Disable type checking
      tsconfigOverride: {
        compilerOptions: {
          module: "ESNext",
          moduleResolution: "Node",
          noEmitOnError: true,
          strict: false, // Disable strict mode
          skipLibCheck: true, // Skip type checking of declaration files
        },
        include: ["src/**/*"],
        exclude: ["node_modules", "dist", "**/*.test.ts"],
      },
    }),
  ],
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    "http",
    "https",
    "url",
    "react",
    "react/jsx-runtime",
  ],
};
