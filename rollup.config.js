import typescript from "rollup-plugin-typescript2";
import { defineConfig } from "rollup";

export default defineConfig({
  input: "src/index.ts",
  output: [
    {
      file: "dist/index.js",
      format: "esm",
      sourcemap: true,
    },
    {
      file: "dist/index.cjs",
      format: "cjs",
      sourcemap: true,
    },
  ],
  plugins: [
    typescript({
      tsconfig: "./tsconfig.json",
      clean: true,
      useTsconfigDeclarationDir: true,
      abortOnError: false,
    }),
  ],
  external: ["http", "https"],
});
