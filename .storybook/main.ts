// This file has been automatically migrated to valid ESM format by Storybook.
import { createRequire } from "node:module";
import { StorybookConfig } from "@storybook/react-vite";
import { join, dirname } from "path"
import { loadEnv } from "vite";

const require = createRequire(import.meta.url);

/**
* This function is used to resolve the absolute path of a package.
* It is needed in projects that use Yarn PnP or are set up within a monorepo.
*/
function getAbsolutePath(value: string) {
  return dirname(require.resolve(join(value, 'package.json')))
}

const config: StorybookConfig = {
  "stories": [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../packages/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    getAbsolutePath('@chromatic-com/storybook'),
    getAbsolutePath('@storybook/addon-docs'),
    getAbsolutePath("@storybook/addon-a11y"),
    getAbsolutePath("@storybook/addon-vitest"),
    getAbsolutePath("@storybook/addon-themes"),
    getAbsolutePath("@storybook/addon-mcp")
  ],
  "framework": {
    "name": getAbsolutePath('@storybook/react-vite'),
    "options": {}
  },
  staticDirs: ["../public"],
  viteFinal: async (config, { configType }) => {
    const mode = configType === "PRODUCTION" ? "production" : "development";
    const env = loadEnv(mode, process.cwd(), "");

    config.define = {
      ...config.define,
      'process.env.NEXT_PUBLIC_MUI_X_LICENSE_KEY': JSON.stringify(env.NEXT_PUBLIC_MUI_X_LICENSE_KEY),
      'process.env.MOHD_API_KEY': JSON.stringify(env.MOHD_API_KEY),
    };

    return config;
  },
};
export default config;
