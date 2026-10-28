import { defineConfig, devices } from "@playwright/test";

/**
 * Touch tests for the stories tagged "mobile", in Chromium emulating the devices below. See the
 * README's "Mobile touch tests" for the commands and the iOS Safari check.
 */

// The iPhone and iPad descriptors default to WebKit; their sizes and touch settings are kept, in Chromium.
const DEVICES = ["iPhone SE (3rd gen)", "iPhone 15", "Pixel 7", "iPhone 15 landscape", "iPad Mini"];
const device = (name: string) => ({ ...devices[name], defaultBrowserType: "chromium" as const });

export default defineConfig({
  testDir: "./mobile",
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:6006",
  },
  webServer: {
    command: "pnpm storybook --ci",
    url: "http://localhost:6006/index.json",
    reuseExistingServer: true,
    timeout: 180_000,
  },
  projects: [
    ...DEVICES.map((name) => ({
      name: `mobile:${name}`,
      testMatch: /\.spec\.ts$/,
      testIgnore: /(audit|desktop)\.spec\.ts$/,
      use: device(name),
    })),
    { name: "mobile:desktop", testMatch: /desktop\.spec\.ts$/, use: devices["Desktop Chrome"] },
    { name: "audit-setup", testMatch: /audit\.setup\.ts/, teardown: "audit-report" },
    { name: "audit-report", testMatch: /audit\.teardown\.ts/ },
    ...DEVICES.map((name) => ({
      name: `audit:${name}`,
      testMatch: /audit\.spec\.ts/,
      dependencies: ["audit-setup"],
      timeout: 120_000,
      use: device(name),
    })),
  ],
});
