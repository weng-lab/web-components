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
        fileName: (format) => `psychscreen-legacy-components.${format}.js`,
        formats: ["es"],
      },
      rollupOptions: {
        external: Object.keys(peerDependencies),
      },
    },
  })
);
