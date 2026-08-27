import { defineConfig, mergeConfig } from "vite";
import baseConfig from "../../vite.base.config";
import dts from "vite-plugin-dts";
import path from "path";
import {peerDependencies} from './package.json'

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [
      dts({
        tsconfigPath: path.resolve(__dirname, "tsconfig.json"),
        insertTypesEntry: true,
      }),
    ],
    build: {
      lib: {
        entry: path.resolve(__dirname, "src/index.ts"),
        fileName: (format) => `visualization.${format}.js`,
        formats: ["es"],
      },
      rollupOptions: {
        // Match subpaths too (e.g. "react-dom/client"), not just the bare peer dep name -
        // Rollup's external only does exact-string matching by default, so without this a
        // subpath import gets bundled straight into dist, baking in whatever version of that
        // peer happened to be installed here at build time instead of deferring to whatever
        // version the consuming app actually has installed.
        external: (id) =>
          Object.keys(peerDependencies).some((dep) => id === dep || id.startsWith(`${dep}/`)),
      },
    },
  })
);
