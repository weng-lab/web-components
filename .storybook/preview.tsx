import React, { useEffect, useState } from 'react'; //React must be in scope here or else we get "React is not defined"
import { Decorator, Preview, ReactRenderer } from "@storybook/react-vite";
import { withThemeFromJSXProvider } from '@storybook/addon-themes';
import { darkTheme, lightTheme } from "./theme";
import { Box, CssBaseline, ThemeProvider, Typography } from '@mui/material';
import { setupWorker } from "msw/browser";
import { mswLoader } from "msw-storybook-addon/csf3";
import { INITIAL_VIEWPORTS, MINIMAL_VIEWPORTS } from "storybook/viewport";
import { addons } from "storybook/preview-api";
import { EVENT_ID } from "storybook/actions";
import { genomeSearchHandlers } from "./mocks/genomeSearchHandlers";
import type { LoaderFunction } from "storybook/internal/types";

/** Shows the story's last fn() action, since a phone has no Actions panel. */
const LastAction = () => {
  const [action, setAction] = useState<string | null>(null);
  useEffect(() => {
    const channel = addons.getChannel();
    const handle = (event: { data?: { name?: string } }) => setAction(event.data?.name ?? null);
    channel.on(EVENT_ID, handle);
    return () => channel.off(EVENT_ID, handle);
  }, []);
  return (
    <Typography variant="body2" color="text.secondary">
      Last action: {action ?? "none"}
    </Typography>
  );
};

/**
 * Stories tagged "mobile" render full-width between more of the page, so a swipe over the plot can be
 * checked for scrolling the page. The tests in /mobile find the story by data-mobile-story.
 */
const mobilePage: Decorator = (Story, { tags, viewMode }) =>
  tags.includes("mobile") && viewMode === "story" ? (
    <>
      <Box sx={{ height: 120, mb: 2, borderBottom: 1, borderColor: "divider" }}>
        <Typography variant="body2" color="text.secondary">
          The page above the plot.
        </Typography>
      </Box>
      <div data-mobile-story>
        <Story />
      </div>
      <Box sx={{ mt: 3, pt: 2, height: "150vh", borderTop: 1, borderColor: "divider" }}>
        <LastAction />
        <Typography variant="body2" color="text.secondary">
          The rest of the page, so the plot can be scrolled past.
        </Typography>
      </Box>
    </>
  ) : (
    <Story />
  );

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
    viewport: {
      options: { ...MINIMAL_VIEWPORTS, ...INITIAL_VIEWPORTS },
    },
  },

  loaders: [
    mswLoader(async () => {
      const worker = setupWorker();
      await worker.start({ onUnhandledRequest: "bypass" });
      return worker;
    }) as LoaderFunction<ReactRenderer>,
  ],

  decorators: [
    mobilePage,
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
