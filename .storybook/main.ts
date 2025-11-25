import { StorybookConfig } from "@storybook/react-vite";
import { join, dirname } from "path"

/**
* This function is used to resolve the absolute path of a package.
* It is needed in projects that use Yarn PnP or are set up within a monorepo.
*/
function getAbsolutePath(value) {
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
  ],
  "framework": {
    "name": getAbsolutePath('@storybook/react-vite'),
    "options": {}
  },
  // This defines runtime env variable so that it can be called by MUI X component's story decorators
  viteFinal: async (config) => {
    config.define = {
      ...config.define,
      'process.env.NEXT_PUBLIC_MUI_X_LICENSE_KEY': JSON.stringify(process.env.NEXT_PUBLIC_MUI_X_LICENSE_KEY),
    };
    return config;
  },
};
export default config;