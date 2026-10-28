import type { CDPSession, Page } from "@playwright/test";

export type Point = { x: number; y: number };

const frame = () => new Promise((resolve) => setTimeout(resolve, 16));

/** Evenly spaced points from one to the other over 12 frames, both ends included. */
const line = (from: Point, to: Point, steps = 12): Point[] =>
  Array.from({ length: steps + 1 }, (_, i) => ({
    x: from.x + ((to.x - from.x) * i) / steps,
    y: from.y + ((to.y - from.y) * i) / steps,
  }));

/**
 * Gestures through CDP Input.dispatchTouchEvent, so the page gets what a phone gives it: trusted
 * touch and pointer events, a tap's follow-up mouse events, and native scrolling and pinch-zoom with
 * touch-action honored, none of which script-dispatched events get. Chromium only; covers what
 * page.touchscreen.tap can't.
 */
export class Touch {
  private constructor(private cdp: CDPSession) {}

  static async on(page: Page) {
    return new Touch(await page.context().newCDPSession(page));
  }

  /** One finger (or two side by side) dragged from one point to another. */
  async swipe(from: Point, to: Point, { fingers = 1 }: { fingers?: 1 | 2 } = {}) {
    const offsets = fingers === 1 ? [0] : [-30, 30];
    await this.gesture(offsets.map((dx) => line({ x: from.x + dx, y: from.y }, { x: to.x + dx, y: to.y })));
  }

  /** Two fingers either side of `at`, moving from `fromDistance` apart to `toDistance` apart. */
  async pinch(at: Point, fromDistance: number, toDistance: number) {
    const finger = (side: -1 | 1) =>
      line({ x: at.x + (side * fromDistance) / 2, y: at.y }, { x: at.x + (side * toDistance) / 2, y: at.y });
    await this.gesture([finger(-1), finger(1)]);
  }

  /** One finger put down and dragged, and left down until lift(): to check what shows mid-drag. */
  async drag(from: Point, to: Point) {
    await this.press([line(from, to)]);
  }

  async lift() {
    await this.send("touchEnd", []);
  }

  /** A finger held still on `at`. */
  async longPress(at: Point) {
    await this.send("touchStart", [at]);
    await new Promise((resolve) => setTimeout(resolve, 800));
    await this.lift();
  }

  private async gesture(paths: Point[][]) {
    await this.press(paths);
    await frame();
    await this.lift();
  }

  /** Puts every finger down and moves it along its path, one frame per step; all paths are the same length. */
  private async press(paths: Point[][]) {
    const at = (step: number) => paths.map((path) => path[step]);
    await this.send("touchStart", at(0));
    for (let step = 1; step < paths[0].length; step++) {
      await frame();
      await this.send("touchMove", at(step));
    }
  }

  private send(type: "touchStart" | "touchMove" | "touchEnd", points: Point[]) {
    return this.cdp.send("Input.dispatchTouchEvent", {
      type,
      touchPoints: points.map(({ x, y }, id) => ({ x, y, id })),
    });
  }
}

/** Waits for the page to stop moving, as a swipe's fling carries on after the finger lifts: 10 still frames. */
export function scrollSettled(page: Page) {
  return page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const position = () =>
          `${scrollX},${scrollY},${visualViewport?.scale},${visualViewport?.pageLeft},${visualViewport?.pageTop}`;
        let last = position();
        let still = 0;
        let frames = 0;
        const check = () => {
          const now = position();
          still = now === last ? still + 1 : 0;
          last = now;
          if (still >= 10 || ++frames > 300) resolve();
          else requestAnimationFrame(check);
        };
        requestAnimationFrame(check);
      })
  );
}
