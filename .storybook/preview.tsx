import React, { useState } from 'react'; //React must be in scope here or else we get "React is not defined"
import { Preview, ReactRenderer } from "@storybook/react-vite";
import { withThemeFromJSXProvider } from '@storybook/addon-themes';
import { darkTheme, lightTheme } from "./theme";
import { CssBaseline, ThemeProvider } from '@mui/material';
import { setupWorker } from "msw/browser";
import { mswLoader } from "msw-storybook-addon/csf3";
import { genomeSearchHandlers } from "./mocks/genomeSearchHandlers";
import type { LoaderFunction } from "storybook/internal/types";

export const decorators = [
  withThemeFromJSXProvider({
    themes: {
      light: lightTheme,
      dark: darkTheme,
    },
    defaultTheme: "light",
    Provider: ThemeProvider,
    GlobalStyles: CssBaseline,
  }),
];

const preview: Preview = {
  parameters: {
    backgrounds: {
      options: {
        dark: { name: "Dark", value: darkTheme.palette.background.default },
        light: { name: "Light", value: lightTheme.palette.background.default },
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
    msw: { handlers: genomeSearchHandlers },
  },

  loaders: [
    mswLoader(async () => {
      const worker = setupWorker();
      await worker.start({ onUnhandledRequest: "bypass" });
      return worker;
    }) as LoaderFunction<ReactRenderer>,
  ],

  decorators: [
    withThemeFromJSXProvider({
      themes: {
        light: lightTheme,
        dark: darkTheme,
      },
      defaultTheme: "light",
      Provider: ThemeProvider,
      GlobalStyles: CssBaseline,
    }),
  ],

  initialGlobals: {
    backgrounds: {
      value: "light"
    }
  }
};

export default preview;
