import { StorybookConfig } from "@storybook/react-vite";
import { join, dirname } from "path"
import { loadEnv } from "vite";
import { proxyScreenGraphql } from "../lib/screen-proxy";

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
  viteFinal: async (config, { configType }) => {
    const mode = configType === "PRODUCTION" ? "production" : "development";
    const env = loadEnv(mode, process.cwd(), "");
    process.env.SCREEN_API_KEY = env.SCREEN_API_KEY;
    process.env.NEXT_PUBLIC_MUI_X_LICENSE_KEY = env.NEXT_PUBLIC_MUI_X_LICENSE_KEY;

    // Bundle the MUI X license key into the client — it's a public runtime token.
    // Do NOT add SCREEN_API_KEY here; it must stay server-side.
    config.define = {
      ...config.define,
      'process.env.NEXT_PUBLIC_MUI_X_LICENSE_KEY': JSON.stringify(env.NEXT_PUBLIC_MUI_X_LICENSE_KEY),
    };

    config.plugins = config.plugins ?? [];
    config.plugins.push({
      name: "screen-graphql-dev-proxy",
      configureServer(server) {
        server.middlewares.use("/api/screen-graphql", async (req, res) => {
          if (req.method !== "POST") { res.statusCode = 405; res.end(); return; }
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          try {
            const result = await proxyScreenGraphql(Buffer.concat(chunks).toString("utf8"));
            res.statusCode = result.status;
            res.setHeader("Content-Type", result.contentType);
            res.end(result.body);
          } catch (err) {
            res.statusCode = 500;
            res.end(String(err));
          }
        });
      },
    });

    return config;
  },
};
export default config;
