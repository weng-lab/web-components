import { expect, test } from "@playwright/test";
import { BOX_ZOOMS, actions, center, gotoStory, plotSurface, recordActions, storyById, surfaceShot } from "./stories";

/**
 * The mouse still works as it did: touch handling must not cost the desktop anything. Run against
 * the mobile stories, at desktop size.
 */

const ZOOMS = ["visualization-phylotree--mobile", "visualization-scatterplot--mobile"];

for (const id of ZOOMS) {
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

test("visualization/Legend/ChipLegend › a click on a chip switches its group at once", async ({ page }) => {
  await gotoStory(page, storyById("visualization-legend-chiplegend--mobile"));
  await page.getByRole("button", { name: /^Liver\b/ }).click();
  await expect(page.getByText(/^Hovered:/)).toHaveText("Hovered: liver · Hidden: liver");
});

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
});

for (const id of BOX_ZOOMS) {
  const story = storyById(id);
  test(`${story.title} › a drag with Shift held, or in box mode, zooms into the box it draws`, async ({ page }) => {
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
}

test("visualization/ScatterPlot › Synced Plots › plots of different sizes zoom and pan to the same part of the data", async ({ page }) => {
  await page.goto("/iframe.html?id=visualization-scatterplot--synced-plots&viewMode=story");
  await page.locator("svg rect[fill=transparent]").first().waitFor();
  // Each plot's plot area, the rect it takes the pointer on, and where its crosshair crosses, left to right. Not the
  // minimaps', which are drawn the same way but small.
  const plots = () =>
    page.evaluate(() =>
      [...document.querySelectorAll("canvas + svg")]
        .flatMap((svg) => {
          const area = [...svg.querySelectorAll("rect[fill=transparent]")]
            .map((rect) => rect.getBoundingClientRect())
            .sort((a, b) => b.width * b.height - a.width * a.height)[0];
          if (!area || area.width < 200) return [];
          const lines = [...svg.querySelectorAll("line[stroke-dasharray='2,2']")].map((line) => line.getBoundingClientRect());
          const vertical = lines.find((line) => line.width < line.height);
          const horizontal = lines.find((line) => line.width > line.height);
          return [{
            center: { x: area.x + area.width / 2, y: area.y + area.height / 2 },
            size: area.width,
            crosshair: vertical && horizontal ? { x: vertical.x + vertical.width / 2, y: horizontal.y + horizontal.height / 2 } : null,
          }];
        })
        .sort((a, b) => a.center.x - b.center.x)
    );
  // Hovering the middle of one plot, the other's crosshair crosses in the middle of its own.
  const expectCentered = async (hovered: number) => {
    const before = await plots();
    await page.mouse.move(before[hovered].center.x, before[hovered].center.y);
    const other = (await plots())[1 - hovered];
    expect(other.crosshair, "the other plot's crosshair").not.toBeNull();
    expect(Math.abs(other.crosshair!.x - other.center.x), "how far off its middle across").toBeLessThan(1.5);
    expect(Math.abs(other.crosshair!.y - other.center.y), "how far off its middle down").toBeLessThan(1.5);
  };

  const [a, b] = await plots();
  expect(a.size, "the plots' widths").not.toBeCloseTo(b.size, 0);
  const zoomIn = page.getByRole("button", { name: "Zoom in" });
  await zoomIn.first().click();
  await zoomIn.first().click();
  await page.mouse.move(a.center.x, a.center.y);
  await page.mouse.down();
  await page.mouse.move(a.center.x + 60, a.center.y - 40, { steps: 6 });
  await page.mouse.up();
  await expectCentered(0);

  await page.getByRole("button", { name: "Zoom out" }).last().click();
  await expectCentered(1);

  // Resized while zoomed, as a split pane's divider would, the smaller plot grows past the other and keeps the view.
  await page.evaluate(() => {
    const row = document.querySelector("canvas + svg")!.closest("[style*='flex: 3']")!.parentElement!;
    (row.children[1] as HTMLElement).style.flex = "5";
  });
  await expect.poll(async () => (await plots())[1].size > (await plots())[0].size).toBe(true);
  await expectCentered(0);
});
