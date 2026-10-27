import { expect, test } from "@playwright/test";
import { actions, center, gotoStory, plotSurface, recordActions, storyById, surfaceShot } from "./stories";

/**
 * The mouse still works as it did: touch handling must not cost the desktop anything. Run against
 * the mobile stories, at desktop size.
 */

// ScatterPlot starts in select mode on desktop, so it's put in pan mode to drag.
const ZOOMS: [id: string, panMode: boolean][] = [
  ["visualization-phylotree--mobile", false],
  ["visualization-scatterplot--mobile", true],
];

for (const [id, panMode] of ZOOMS) {
  const story = storyById(id);
  test.describe(story.title, () => {
    test("the wheel zooms the plot, not the page", async ({ page }) => {
      await gotoStory(page, story);
      const { x, y } = center(await plotSurface(page));
      const before = await surfaceShot(page);
      await page.mouse.move(x, y);
      await page.mouse.wheel(0, -300);
      await page.waitForTimeout(300);
      expect(await page.evaluate(() => scrollY), "how far the page scrolled").toBe(0);
      expect((await surfaceShot(page)).equals(before), "the plot looks the same").toBe(false);
    });

    test("a mouse drag pans the plot", async ({ page }) => {
      await gotoStory(page, story);
      if (panMode) await page.getByRole("button", { name: "pan" }).click();
      const { x, y } = center(await plotSurface(page));
      const before = await surfaceShot(page);
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x - 80, y - 40, { steps: 8 });
      await page.mouse.up();
      expect((await surfaceShot(page)).equals(before), "the plot looks the same").toBe(false);
    });
  });
}

const CLICKS: [id: string, selector: string, action: string][] = [
  ["visualization-barplot--mobile", "rect.visx-bar", "onBarClicked"],
  ["visualization-treemap--mobile", "[data-audit-surface] rect", "onNodeClicked"],
];

for (const [id, selector, action] of CLICKS) {
  const story = storyById(id);
  test(`${story.title} › a click acts at once`, async ({ page }) => {
    await gotoStory(page, story);
    await plotSurface(page);
    await recordActions(page);
    await page.locator(selector).first().click();
    await expect.poll(() => actions(page), { timeout: 2000 }).toContain(action);
  });
}

test.describe("visualization/ZoomableHeatmap", () => {
  const story = storyById("visualization-zoomableheatmap--mobile");

  test("the wheel zooms the plot, not the page, and a drag then pans it", async ({ page }) => {
    await gotoStory(page, story);
    const canvas = page.locator("[data-mobile-story] canvas");
    const grid = (await canvas.boundingBox())!;
    const { x, y } = center(grid);
    const fit = await canvas.screenshot();
    await page.mouse.move(x, y);
    await page.mouse.wheel(0, -600);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => scrollY), "how far the page scrolled").toBe(0);
    const zoomed = await canvas.screenshot();
    expect(zoomed.equals(fit), "the plot looks the same after the wheel").toBe(false);

    await page.mouse.down();
    await page.mouse.move(x - 80, y - 40, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(100);
    expect((await canvas.screenshot()).equals(zoomed), "the plot looks the same after the drag").toBe(false);
    expect(await canvas.boundingBox(), "where the grid is, after zooming").toEqual(grid);
  });

  test("a click zooms in while cells are too small, and acts at once when they aren't", async ({ page }) => {
    await gotoStory(page, story);
    await recordActions(page);
    const { x, y } = center((await page.locator("[data-mobile-story] canvas").boundingBox())!);
    let clicks = 0;
    while (!(await page.locator(".visx-tooltip").first().isVisible()) && clicks < 6) {
      await page.mouse.click(x, y);
      await page.waitForTimeout(350);
      await page.mouse.move(x + 1, y);
      clicks++;
    }
    expect(clicks, "clicks before a cell showed its tooltip").toBeGreaterThan(0);
    expect(await actions(page), "actions while zooming in").toEqual([]);
    await page.mouse.click(x, y);
    await expect.poll(() => actions(page), { timeout: 2000 }).toContain("onCellClick");
  });

  test("a drag with Shift held, or in box mode, zooms into the box it draws", async ({ page }) => {
    await gotoStory(page, story);
    const grid = (await page.locator("[data-mobile-story] canvas").boundingBox())!;
    const at = (fx: number, fy: number) => ({ x: grid.x + grid.width * fx, y: grid.y + grid.height * fy });
    const drawBox = async () => {
      await page.mouse.move(at(0.3, 0.3).x, at(0.3, 0.3).y);
      await page.mouse.down();
      await page.mouse.move(at(0.6, 0.6).x, at(0.6, 0.6).y, { steps: 8 });
      await page.mouse.up();
    };
    const reset = page.getByRole("button", { name: "Reset zoom" });

    await page.keyboard.down("Shift");
    await drawBox();
    await page.keyboard.up("Shift");
    await expect(reset).toBeEnabled();

    await reset.click();
    await expect(reset).toBeDisabled();
    await page.getByRole("button", { name: "Box zoom" }).click();
    await drawBox();
    await expect(reset).toBeEnabled();
  });
});
