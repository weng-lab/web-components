import { expect, test } from "@playwright/test";
import { gotoStory, mobileStories, plotSurface, storyLabel } from "./stories";
import { Touch, scrollSettled } from "./touch";

/** What every mobile story should do on every device, whatever the component. */
for (const story of mobileStories) {
  test.describe(storyLabel(story), () => {
    test("renders without uncaught errors", async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await gotoStory(page, story);
      expect(errors).toEqual([]);
    });

    test("fits the screen's width", async ({ page }) => {
      await gotoStory(page, story);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, "how far the page scrolls sideways").toBeLessThanOrEqual(0);
    });

    // A plot as wide as the screen leaves nowhere else to put a finger, so one that keeps a swipe for
    // itself stops the page from being scrolled past it.
    test("can be scrolled past with a swipe over it", async ({ page }) => {
      await gotoStory(page, story);
      const surface = await plotSurface(page);
      const from = { x: surface.x + surface.width / 2, y: surface.y + surface.height * 0.75 };
      const to = { x: from.x, y: Math.max(from.y - 200, 8) };
      const touch = await Touch.on(page);
      await touch.swipe(from, to);
      await scrollSettled(page);
      const scrolled = await page.evaluate(() => visualViewport!.pageTop);
      expect(scrolled, `how far a ${from.y - to.y}px swipe scrolled the page`).toBeGreaterThan((from.y - to.y) / 2);
    });
  });
}
