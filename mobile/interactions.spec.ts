import { expect, test, type Page } from "@playwright/test";
import { BOX_ZOOMS, actions, center, gotoStory, plotSurface, recordActions, storyById, storyLabel, surfaceShot } from "./stories";
import { Touch, scrollSettled } from "./touch";

/**
 * How the plots answer touch, beyond what stories.spec.ts asks of every mobile story:
 * - A tap on a mark previews it - its tooltip - and a second tap on the same mark clicks it.
 * - On plots that zoom, two fingers pinch-zoom and pan the plot, never the page.
 */

const tooltip = (page: Page) => page.locator(".visx-tooltip");

/** Taps filled shapes nearest the plot's center, then a grid (canvas plots), until a tooltip shows; returns the spot. */
async function tapMark(page: Page) {
  const surface = await plotSurface(page);
  const shapes = await page.evaluate((s) => {
    const area = s.width * s.height;
    return [...document.querySelectorAll("[data-audit-surface] :is(rect, circle, ellipse, path, polygon)")]
      .filter((el) => !el.closest("[class*=axis], [class*=legend]") && !["none", "transparent"].includes(getComputedStyle(el).fill))
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width * r.height >= 9 && r.width * r.height < area / 4)
      .map((r) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 }))
      .filter(({ x, y }) => x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height);
  }, surface);
  const steps = [0.2, 0.35, 0.5, 0.65, 0.8];
  const grid = steps.flatMap((fx) => steps.map((fy) => ({ x: surface.x + surface.width * fx, y: surface.y + surface.height * fy })));
  const { x: cx, y: cy } = center(surface);
  const nearestFirst = (spots: { x: number; y: number }[]) =>
    spots.sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy));
  for (const spot of [...nearestFirst(shapes).slice(0, 15), ...nearestFirst(grid)]) {
    await page.touchscreen.tap(spot.x, spot.y);
    const shown = await tooltip(page).first().waitFor({ timeout: 200 }).then(() => true, () => false);
    if (shown) return spot;
  }
  throw new Error("No tap on the plot showed a tooltip");
}

const TOOLTIPS = [
  "visualization-barplot--mobile",
  "visualization-dotplot--mobile",
  "visualization-heatmap--mobile",
  "visualization-heatmap--mobile-scrollable",
  "visualization-histogram--mobile",
  "visualization-phylotree--mobile",
  "visualization-proportionsbar--mobile",
  "visualization-scatterplot--mobile",
  "visualization-sequencealignmentplot--mobile",
  "visualization-treemap--mobile",
  "visualization-violinplot--mobile",
];

for (const id of TOOLTIPS) {
  const story = storyById(id);
  test(`${storyLabel(story)} › a tap shows a tooltip on the screen, and a tap elsewhere hides it`, async ({ page }) => {
    await gotoStory(page, story);
    await tapMark(page);
    const box = (await tooltip(page).first().boundingBox())!;
    const screen = page.viewportSize()!;
    expect(box.x, "the tooltip's left edge").toBeGreaterThanOrEqual(0);
    expect(box.x + box.width, "the tooltip's right edge").toBeLessThanOrEqual(screen.width);

    // The page above the plot: never part of it.
    await page.touchscreen.tap(screen.width / 2, 60);
    await expect(tooltip(page)).toHaveCount(0);
  });
}

test("Heatmap › on a grid too big for the screen, two fingers scroll the grid, not the page", async ({ page }) => {
  await gotoStory(page, storyById("visualization-heatmap--mobile-scrollable"));
  // The grid: the biggest thing in the story with more to show than fits.
  const grid = await page.evaluate(() => {
    const scrollers = [...document.querySelectorAll("[data-mobile-story] *")].filter(
      (el) => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1
    );
    const area = (el: Element) => el.clientWidth * el.clientHeight;
    const el = scrollers.sort((a, b) => area(b) - area(a))[0];
    el.setAttribute("data-test-grid", "");
    // What of it is on the screen, where the fingers can go.
    const r = el.getBoundingClientRect();
    const top = Math.max(r.top, 0);
    const bottom = Math.min(r.bottom, visualViewport!.height);
    return { x: r.left, y: top, width: r.width, height: bottom - top };
  });
  const gridScroll = () =>
    page.evaluate(() => {
      const el = document.querySelector("[data-test-grid]")!;
      return [el.scrollLeft, el.scrollTop];
    });
  const { x, y } = center(grid);
  const before = await gridScroll();
  await (await Touch.on(page)).swipe(
    { x: x + grid.width / 8, y: y + grid.height / 4 },
    { x: x - grid.width / 8, y: y - grid.height / 4 },
    { fingers: 2 }
  );
  await scrollSettled(page);
  expect(await page.evaluate(() => visualViewport!.pageTop), "how far the page scrolled").toBe(0);
  expect(await gridScroll(), "where the grid is scrolled to").not.toEqual(before);
});

test("Heatmap › on a grid that fits, a pinch is left to zoom the page", async ({ page }) => {
  await gotoStory(page, storyById("visualization-heatmap--mobile"));
  await (await Touch.on(page)).pinch(center(await plotSurface(page)), 60, 200);
  await scrollSettled(page);
  expect(await page.evaluate(() => visualViewport!.scale), "the page's zoom").toBeGreaterThan(1);
});

const TAP_TO_CLICK: [id: string, clicks: RegExp][] = [
  ["visualization-barplot--mobile", /^onBarClicked$/],
  ["visualization-heatmap--mobile-scrollable", /^onClick$/],
  ["visualization-histogram--mobile", /^onBarClicked$/],
  ["visualization-phylotree--mobile", /^onBranchClick$/],
  ["visualization-scatterplot--mobile", /^onPointClicked$/],
  ["visualization-treemap--mobile", /^onNodeClicked$/],
  ["visualization-violinplot--mobile", /^on(Violin|Point)Clicked$/],
];

for (const [id, clicks] of TAP_TO_CLICK) {
  const story = storyById(id);
  test(`${storyLabel(story)} › a tap shows the tooltip, and a second tap on the same mark clicks it`, async ({ page }) => {
    await gotoStory(page, story);
    await recordActions(page);
    const spot = await tapMark(page);
    expect(await actions(page), "actions after the first tap").toEqual([]);

    await page.touchscreen.tap(spot.x, spot.y);
    await expect.poll(() => actions(page), { timeout: 2000 }).toContainEqual(expect.stringMatching(clicks));
  });
}

const ZOOMS = [
  "visualization-phylotree--mobile",
  "visualization-scatterplot--mobile",
  "visualization-sequencealignmentplot--mobile",
  "visualization-zoomableheatmap--mobile",
];

for (const id of ZOOMS) {
  const story = storyById(id);
  test.describe(storyLabel(story), () => {
    test("two fingers pinch-zoom the plot, not the page", async ({ page }) => {
      await gotoStory(page, story);
      await plotSurface(page);
      // Screenshotting the plot scrolls it into view, so it comes before measuring where it is.
      const before = await surfaceShot(page);
      const surface = await plotSurface(page);
      await (await Touch.on(page)).pinch(center(surface), 60, 200);
      await scrollSettled(page);
      expect(await page.evaluate(() => visualViewport!.scale), "the page's zoom").toBe(1);
      expect((await surfaceShot(page)).equals(before), "the plot looks the same").toBe(false);
    });

    test("two fingers pan the plot, not the page", async ({ page }) => {
      await gotoStory(page, story);
      const touch = await Touch.on(page);
      // Zoomed in first, as a plot can't pan far, or at all, zoomed out.
      await touch.pinch(center(await plotSurface(page)), 60, 200);
      await page.waitForTimeout(300);
      const before = await surfaceShot(page);
      const { x, y } = center(await plotSurface(page));
      const pageTop = () => page.evaluate(() => visualViewport!.pageTop);
      const scrolledFrom = await pageTop();
      await touch.swipe({ x: x + 60, y: y + 40 }, { x: x - 60, y: y - 40 }, { fingers: 2 });
      await scrollSettled(page);
      expect(await pageTop(), "where the page is scrolled to").toBe(scrolledFrom);
      expect((await surfaceShot(page)).equals(before), "the plot looks the same").toBe(false);
    });
  });
}

for (const id of ["visualization-legend-colorbarlegend--mobile", "visualization-zoomableheatmap--mobile"]) {
  test(`${storyLabel(storyById(id))} › the range editor opens on the screen`, async ({ page }) => {
    await gotoStory(page, storyById(id));
    await page.getByRole("button", { name: "Adjust the color range" }).tap();
    const panel = page.getByRole("presentation").locator(".MuiPopover-paper");
    await expect(panel).toBeVisible();
    const box = (await panel.boundingBox())!;
    const screen = page.viewportSize()!;
    expect(box.x, "the panel's left edge").toBeGreaterThanOrEqual(0);
    expect(box.x + box.width, "the panel's right edge").toBeLessThanOrEqual(screen.width);
    // Nothing in it wider than the panel.
    const overflow = await panel.evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(overflow, "how far its contents run past it").toBeLessThanOrEqual(0);
  });
}

test("Colorbar › a finger dragged along the bar sweeps it, and lifting ends the sweep", async ({ page }) => {
  await gotoStory(page, storyById("visualization-legend-colorbar--mobile"));
  const bar = (await page.locator("[data-mobile-story] svg").first().boundingBox())!;
  const y = bar.y + bar.height / 2;
  const touch = await Touch.on(page);
  await touch.drag({ x: bar.x + bar.width * 0.3, y }, { x: bar.x + bar.width * 0.6, y });
  await expect(page.getByRole("tooltip"), "the sweep's count, mid-drag").toBeVisible();
  expect(await page.evaluate(() => visualViewport!.pageLeft), "how far the page scrolled sideways").toBe(0);
  await touch.lift();
  await expect(page.getByRole("tooltip")).toBeHidden();
});

test("ScatterPlot › in select mode, a finger drags out a selection instead of scrolling the page", async ({ page }) => {
  await gotoStory(page, storyById("visualization-scatterplot--mobile"));
  await page.getByRole("button", { name: "Lasso select" }).tap();
  await recordActions(page);
  const { x, y } = center(await plotSurface(page));
  await (await Touch.on(page)).swipe({ x: x - 50, y: y + 50 }, { x: x + 50, y: y - 50 });
  await scrollSettled(page);
  expect(await page.evaluate(() => visualViewport!.pageTop), "how far the page scrolled").toBe(0);
  await expect.poll(() => actions(page), { timeout: 2000 }).toContain("onSelectionChange");
});

test("ZoomableHeatmap › taps zoom in until a cell can be aimed at, then a tap shows it and a second clicks it", async ({ page }) => {
  await gotoStory(page, storyById("visualization-zoomableheatmap--mobile"));
  await recordActions(page);
  const canvas = page.locator("[data-mobile-story] canvas");
  // Its middle is below the fold in landscape.
  await canvas.scrollIntoViewIfNeeded();
  await scrollSettled(page);
  const grid = (await canvas.boundingBox())!;
  const { x, y } = center(grid);
  let taps = 0;
  while (!(await tooltip(page).first().isVisible()) && taps < 8) {
    await page.touchscreen.tap(x, y);
    await page.waitForTimeout(400);
    taps++;
  }
  expect(taps, "taps before a cell showed its tooltip").toBeGreaterThan(1);
  expect(await actions(page), "actions while zooming in and on the first tap").toEqual([]);

  await page.touchscreen.tap(x, y);
  await expect.poll(() => actions(page), { timeout: 2000 }).toContain("onCellClick");
  expect(await canvas.boundingBox(), "where the grid is, after zooming").toEqual(grid);
});

for (const id of BOX_ZOOMS) {
  const story = storyById(id);
  test(`${story.title} › in box mode one finger draws a box to zoom into, rather than scrolling the page`, async ({ page }) => {
    await gotoStory(page, story);
    const canvas = page.locator("[data-mobile-story] canvas");
    await canvas.scrollIntoViewIfNeeded();
    await scrollSettled(page);
    await page.getByRole("button", { name: "Box zoom" }).tap();
    const grid = (await canvas.boundingBox())!;
    const top = await page.evaluate(() => visualViewport!.pageTop);
    await (await Touch.on(page)).swipe(
      { x: grid.x + grid.width * 0.3, y: grid.y + grid.height * 0.3 },
      { x: grid.x + grid.width * 0.6, y: grid.y + grid.height * 0.6 }
    );
    await scrollSettled(page);
    expect(await page.evaluate(() => visualViewport!.pageTop), "how far the page scrolled").toBe(top);
    await expect(page.getByRole("button", { name: "Reset zoom" })).toBeEnabled();
  });
}

const TWO_FINGER_HINTS: [id: string, hint: string][] = [
  ["visualization-heatmap--mobile-scrollable", "Use two fingers to move the grid"],
  ...ZOOMS.map((id): [string, string] => [id, "Use two fingers to zoom and pan"]),
];

for (const [id, hint] of TWO_FINGER_HINTS) {
  test(`${storyLabel(storyById(id))} › one finger dragged over it shows how to move it, and still scrolls the page`, async ({ page }) => {
    await gotoStory(page, storyById(id));
    const opacity = () => page.getByText(hint).evaluate((el) => Number(getComputedStyle(el.parentElement!).opacity));
    expect(await opacity(), "the hint before a drag").toBe(0);
    const surface = await plotSurface(page);
    const { x, y } = center(surface);
    const touch = await Touch.on(page);
    await touch.drag({ x, y: y + 40 }, { x, y: y - 40 });
    await expect.poll(opacity, { timeout: 2000 }).toBe(1);
    await touch.lift();
    await scrollSettled(page);
    expect(await page.evaluate(() => visualViewport!.pageTop), "how far the page scrolled").toBeGreaterThan(20);
    await expect.poll(opacity, { timeout: 3000 }).toBe(0);
  });
}
