import { expect, test } from "@playwright/test";
import { gotoStory, mobileStories, ownRowsScrollTop, storyLabel, swipeOver } from "./stories";

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
    // itself stops the page from being scrolled past it. A plot that scrolls its own rows keeps a swipe
    // for them until they run out, as a table does, and the page has it from there.
    test("can be scrolled past with a swipe over it", async ({ page }) => {
      await gotoStory(page, story);
      await ownRowsScrollTop(page, true);
      const { from, to } = await swipeOver(page);
      const scrolled = await page.evaluate(() => visualViewport!.pageTop);
      expect(scrolled, `how far a ${from.y - to.y}px swipe scrolled the page`).toBeGreaterThan((from.y - to.y) / 2);
    });
  });
}
