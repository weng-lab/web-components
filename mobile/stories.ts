import fs from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";
import { loadCsf } from "storybook/internal/csf-tools";

const ROOT = path.resolve(__dirname, "..");

/** Where the audit writes its screenshots, findings and report. */
export const AUDIT_DIR = path.join(ROOT, "mobile", "audit-report");

export type MobileStory = { id: string; title: string; name: string };

/**
 * Every story tagged "mobile", read straight from the story files: Playwright declares its tests
 * before Storybook is up, so they can't come from Storybook's own index.
 */
export const mobileStories: MobileStory[] = fs
  .globSync("packages/*/src/**/*.stories.tsx", { cwd: ROOT })
  .flatMap((file) => {
    const code = fs.readFileSync(path.join(ROOT, file), "utf8");
    const csf = loadCsf(code, { fileName: file, makeTitle: (title) => title }).parse();
    return csf.indexInputs
      .filter(({ tags }) => tags?.includes("mobile"))
      .map(({ __id, title, name }) => ({ id: __id!, title: title!, name: name! }));
  })
  .sort((a, b) => a.id.localeCompare(b.id));

export const storyById = (id: string) => {
  const story = mobileStories.find((s) => s.id === id);
  if (!story) throw new Error(`No mobile story ${id}`);
  return story;
};

/** The story's title and name, as the tests are named. */
export const storyLabel = (story: MobileStory) => `${story.title} › ${story.name}`;

/** The mobile stories of plots with box zoom. */
export const BOX_ZOOMS = ["visualization-zoomableheatmap--mobile", "visualization-scatterplot--mobile"];

/** Opens a story on its own, as the Storybook canvas shows it, and waits for it to settle. */
export async function gotoStory(page: Page, story: MobileStory) {
  await page.goto(`/iframe.html?id=${story.id}&viewMode=story`);
  // Short timeouts, so a story that never shows (one with no height, say) fails now, not at the test's timeout.
  await page.waitForFunction(
    () => ["sb-show-main", "sb-show-errordisplay"].some((name) => document.body.classList.contains(name)),
    undefined,
    { timeout: 15_000 }
  );
  await page.locator("[data-mobile-story]").waitFor({ timeout: 10_000 });
  await domSettled(page);
}

/**
 * Waits until the DOM has gone 300ms without changing (3s at most): entry animations, debounced
 * size measurements and tooltips all mutate it until they're done.
 */
export function domSettled(page: Page) {
  return page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const done = () => {
          observer.disconnect();
          clearTimeout(quiet);
          clearTimeout(cap);
          resolve();
        };
        let quiet = setTimeout(done, 300);
        const cap = setTimeout(done, 3000);
        const observer = new MutationObserver(() => {
          clearTimeout(quiet);
          quiet = setTimeout(done, 300);
        });
        observer.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
      })
  );
}

/** Starts recording the story's actions: the calls to its fn() args, by arg name. */
export async function recordActions(page: Page) {
  await page.evaluate(() => {
    const w = window as any;
    w.__actions = [];
    w.__STORYBOOK_ADDONS_CHANNEL__.on("storybook/actions/action-event", (event: { data?: { name?: string } }) =>
      w.__actions.push(event.data?.name)
    );
  });
}

export const actions = (page: Page): Promise<string[]> => page.evaluate(() => (window as any).__actions);

export type Box = { x: number; y: number; width: number; height: number };

/**
 * The plot's drawing surface: the story's largest svg or canvas, clipped to the screen, unless that
 * covers under a quarter of the story (a legend's swatches, say), when it's the whole story. It's
 * marked data-audit-surface so it can be screenshotted on its own.
 */
export async function plotSurface(page: Page): Promise<Box> {
  return page.evaluate(() => {
    const root = document.querySelector("[data-mobile-story]")!;
    /** What of an element shows: inside the screen, and inside anything that clips it, like a scroller. */
    const onScreen = (el: Element) => {
      let { left, top, right, bottom } = el.getBoundingClientRect();
      for (let a = el.parentElement; a; a = a.parentElement) {
        if (getComputedStyle(a).overflow === "visible") continue;
        const clip = a.getBoundingClientRect();
        left = Math.max(left, clip.left);
        top = Math.max(top, clip.top);
        right = Math.min(right, clip.right);
        bottom = Math.min(bottom, clip.bottom);
      }
      left = Math.max(left, 0);
      top = Math.max(top, 0);
      right = Math.min(right, visualViewport!.width);
      bottom = Math.min(bottom, visualViewport!.height);
      return { x: left, y: top, width: right - left, height: bottom - top };
    };
    const whole = onScreen(root);
    let surface: Element = root;
    let best = (whole.width * whole.height) / 4;
    for (const el of root.querySelectorAll("svg, canvas")) {
      if (el.parentElement?.closest("svg")) continue;
      const { width, height } = onScreen(el);
      if (width > 0 && height > 0 && width * height > best) {
        best = width * height;
        surface = el;
      }
    }
    document.querySelector("[data-audit-surface]")?.removeAttribute("data-audit-surface");
    surface.setAttribute("data-audit-surface", "");
    return onScreen(surface);
  });
}

export const center = (box: Box) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });

/** A screenshot of the surface plotSurface marked, to tell whether a gesture moved it. */
export const surfaceShot = (page: Page) => page.locator("[data-audit-surface]").screenshot({ scale: "css", timeout: 10_000 });
