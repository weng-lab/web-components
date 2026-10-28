import fs from "node:fs";
import path from "node:path";
import { test, type Page } from "@playwright/test";
import { AUDIT_DIR, center, domSettled, gotoStory, mobileStories, plotSurface, storyLabel, surfaceShot } from "./stories";
import { Touch, scrollSettled, type Point } from "./touch";

/**
 * Not a pass/fail suite: for every mobile story on every device, this measures the layout, then taps,
 * swipes, pinches and long-presses the plot on a fresh load each, recording what the page did and
 * screenshotting it. audit.teardown.ts turns the results into mobile/audit-report/index.html.
 */

const slug = (name: string) => name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

for (const story of mobileStories) {
  test(storyLabel(story), async ({ page }, testInfo) => {
    const dir = path.join(AUDIT_DIR, slug(testInfo.project.name), story.id);
    fs.mkdirSync(dir, { recursive: true });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text().slice(0, 300));
    });

    await gotoStory(page, story);
    await page.screenshot({ scale: "css", path: path.join(dir, "initial.png") });
    const layout = await page.evaluate(measureLayout);

    const probes: Record<string, unknown> = {};
    for (const [name, probe] of Object.entries(PROBES)) {
      // The first on the load just measured, which nothing has touched.
      if (Object.keys(probes).length) await gotoStory(page, story);
      probes[name] = await probe(page, (shot) => path.join(dir, `${shot}.png`));
    }

    const findings = { story, device: testInfo.project.name, viewport: page.viewportSize(), errors, layout, probes };
    fs.writeFileSync(path.join(dir, "findings.json"), JSON.stringify(findings, null, 2));
  });
}

type Shot = (name: string) => string;

const PROBES: Record<string, (page: Page, shot: Shot) => Promise<unknown>> = {
  /** Tap a mark: does anything (a tooltip) appear, and does it go away when tapping elsewhere? */
  async tap(page, shot) {
    await plotSurface(page);
    const target = await page.evaluate(findTapTarget);
    await watch(page);
    await page.touchscreen.tap(target.x, target.y);
    await domSettled(page);
    const tapped = await page.evaluate(readWatch);
    await screenshotWithMarker(page, [target], shot("tap"));

    // Tap the page above the plot: never part of it, and on screen when the page is at the top.
    await page.touchscreen.tap(200, 60);
    await domSettled(page);
    const stillShown = await page.evaluate(() =>
      (window as any).__audit.appeared.filter(
        (el: Element) => el.isConnected && el.checkVisibility({ opacityProperty: true, visibilityProperty: true })
      ).length
    );
    await page.screenshot({ scale: "css", path: shot("tap-away") });
    return { target, ...tapped, stillShownAfterTapAway: stillShown };
  },

  /** A one-finger swipe up from the middle of the plot: the page should scroll. */
  async swipeUp(page, shot) {
    const surface = await plotSurface(page);
    const from = { x: surface.x + surface.width / 2, y: Math.min(surface.y + surface.height * 0.75, surface.y + surface.height - 8) };
    const to = { x: from.x, y: Math.max(from.y - 250, 8) };
    const result = await gesture(page, shot, "swipe-up", [from, to], (touch) => touch.swipe(from, to));
    return { ...result, distance: Math.round(from.y - to.y) };
  },

  /** A one-finger swipe left across the plot: scrolls something inside it, pans it, or nothing. */
  async swipeLeft(page, shot) {
    const surface = await plotSurface(page);
    const y = surface.y + surface.height / 2;
    const from = { x: surface.x + surface.width * 0.8, y };
    const to = { x: surface.x + surface.width * 0.2, y };
    return gesture(page, shot, "swipe-left", [from, to], (touch) => touch.swipe(from, to));
  },

  /** Two fingers spreading over the plot: zooms the plot, zooms the page, or nothing. */
  async pinch(page, shot) {
    const at = center(await plotSurface(page));
    return gesture(page, shot, "pinch", [at], (touch) => touch.pinch(at, 40, 180));
  },

  /** A finger held on a mark: a tooltip, a selection, the context menu? */
  async longPress(page, shot) {
    await plotSurface(page);
    const target = await page.evaluate(findTapTarget);
    return gesture(page, shot, "long-press", [target], (touch) => touch.longPress(target));
  },
};

/** Runs a gesture and records how the page and the plot moved, what appeared, and a screenshot. */
async function gesture(page: Page, shot: Shot, name: string, points: Point[], run: (touch: Touch) => Promise<void>) {
  const touch = await Touch.on(page);
  const before = await surfaceShot(page);
  const position = () =>
    page.evaluate(() => ({
      pageX: visualViewport!.pageLeft,
      pageY: visualViewport!.pageTop,
      zoom: visualViewport?.scale ?? 1,
      innerScroll: [...document.querySelectorAll("[data-mobile-story] *")]
        .filter((el) => el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight)
        .map((el) => [el.scrollLeft, el.scrollTop]),
    }));
  const start = await position();
  await watch(page);
  await run(touch);
  await scrollSettled(page);
  await domSettled(page);
  const end = await position();
  const watched = await page.evaluate(readWatch);
  await screenshotWithMarker(page, points, shot(name));
  const after = await surfaceShot(page);

  const innerScrolled = start.innerScroll.some(
    ([left, top], i) => end.innerScroll[i] && (end.innerScroll[i][0] !== left || end.innerScroll[i][1] !== top)
  );
  return {
    pageScrolled: { x: end.pageX - start.pageX, y: end.pageY - start.pageY },
    pageZoom: end.zoom,
    innerScrolled,
    plotChanged: !before.equals(after),
    ...watched,
  };
}

async function screenshotWithMarker(page: Page, points: Point[], file: string) {
  await page.evaluate((points) => {
    for (const { x, y } of points) {
      const ring = document.createElement("div");
      ring.dataset.auditMarker = "";
      ring.style.cssText = `position:fixed;left:${x - 12}px;top:${y - 12}px;width:20px;height:20px;border:2px solid #e11d48;border-radius:50%;pointer-events:none;z-index:2147483647`;
      document.body.append(ring);
    }
  }, points);
  await page.screenshot({ scale: "css", path: file });
  await page.evaluate(() => document.querySelectorAll("[data-audit-marker]").forEach((el) => el.remove()));
}

/** Starts counting DOM changes and notes which floating, text-bearing elements are showing. */
async function watch(page: Page) {
  await page.evaluate(() => {
    const audit = ((window as any).__audit ??= {});
    audit.observer?.disconnect();
    audit.mutations = 0;
    audit.events = new Set<string>();
    audit.observer = new MutationObserver((records) => (audit.mutations += records.length));
    audit.observer.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
    audit.floating = () =>
      [...document.querySelectorAll("body *")].filter((el) => {
        const style = getComputedStyle(el);
        if (style.position !== "absolute" && style.position !== "fixed") return false;
        const r = el.getBoundingClientRect();
        return r.width >= 4 && r.height >= 4 && (el.textContent ?? "").trim() !== "" &&
          el.checkVisibility({ opacityProperty: true, visibilityProperty: true });
      });
    audit.before = new Set(audit.floating());
    if (!audit.listening) {
      audit.listening = true;
      for (const type of ["click", "contextmenu", "dblclick"]) {
        document.addEventListener(type, () => audit.events.add(type), true);
      }
    }
  });
}

function readWatch() {
  const audit = (window as any).__audit;
  const appeared: Element[] = audit.floating().filter((el: Element) => !audit.before.has(el));
  // The outermost of each, so a tooltip isn't counted once per element inside it.
  audit.appeared = appeared.filter((el) => !appeared.some((other) => other !== el && other.contains(el)));
  return {
    mutations: audit.mutations as number,
    events: [...audit.events] as string[],
    appeared: audit.appeared.map((el: Element) => (el as HTMLElement).innerText.replace(/\s+/g, " ").trim().slice(0, 100)),
    selection: getSelection()?.toString().slice(0, 100) ?? "",
  };
}

/**
 * A mark on the plot to tap: the element nearest the surface's center that shows a pointer cursor,
 * or else a filled shape, or else the center itself (canvas plots). Runs in the page.
 */
function findTapTarget(): Point & { hit: string } {
  const surface = document.querySelector("[data-audit-surface]")!;
  const s = surface.getBoundingClientRect();
  const cx = s.left + s.width / 2;
  const cy = s.top + s.height / 2;
  const onScreen = (r: DOMRect) => r.width >= 2 && r.height >= 2 && r.left >= 0 && r.top >= 0 && r.right <= visualViewport!.width && r.bottom <= visualViewport!.height;
  const small = (r: DOMRect) => r.width * r.height < 0.25 * s.width * s.height;
  const nearest = (elements: Element[]) => {
    let best: DOMRect | null = null;
    for (const el of elements) {
      const r = el.getBoundingClientRect();
      if (!onScreen(r) || !small(r)) continue;
      const d = Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy);
      if (!best || d < Math.hypot(best.left + best.width / 2 - cx, best.top + best.height / 2 - cy)) best = r;
    }
    return best;
  };
  const inside = [...surface.querySelectorAll("*")].filter((el) => !el.closest("[class*=axis], [class*=legend]"));
  const r =
    nearest(inside.filter((el) => getComputedStyle(el).cursor === "pointer")) ??
    nearest(
      inside.filter((el) => el.matches("rect, circle, path, ellipse, polygon") && !["none", "transparent"].includes(getComputedStyle(el).fill))
    );
  const x = r ? r.left + r.width / 2 : cx;
  const y = r ? r.top + r.height / 2 : cy;
  const hit = document.elementFromPoint(x, y);
  return { x, y, hit: hit ? `${hit.tagName.toLowerCase()}${hit.getAttribute("class") ? "." + hit.getAttribute("class")!.trim().split(/\s+/)[0] : ""}` : "nothing" };
}

/** Everything about the story's layout that can be measured without touching it. Runs in the page. */
function measureLayout() {
  const root = document.querySelector("[data-mobile-story]")!;
  // Not innerWidth: content wider than the screen widens the layout viewport to fit, as phones do.
  const screenWidth = document.documentElement.clientWidth;
  const all = [...root.querySelectorAll("*")];
  const style = (el: Element) => getComputedStyle(el);
  const visible = (el: Element) => el.checkVisibility({ opacityProperty: true, visibilityProperty: true });
  const describe = (el: Element) => {
    const tag = el.tagName.toLowerCase();
    const cls = (el.getAttribute("class") ?? "").trim().split(/\s+/).filter((c) => c && !/^css-/.test(c)).slice(0, 2);
    const label = el.getAttribute("aria-label") ?? el.getAttribute("title") ?? (el.textContent ?? "").trim().slice(0, 40);
    return `${tag}${cls.length ? "." + cls.join(".") : ""}${label ? ` "${label}"` : ""}`;
  };
  const rect = (el: Element) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left), y: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) };
  };
  /** Whether an ancestor within the story clips horizontally and itself fits the screen. */
  const clippedOnScreen = (el: Element) => {
    for (let a = el.parentElement; a && a !== root; a = a.parentElement) {
      const r = a.getBoundingClientRect();
      if (style(a).overflowX !== "visible" && r.right <= screenWidth + 1 && r.left >= -1) return true;
    }
    return false;
  };

  // Elements running past the screen's sides, outermost first, unless something on the screen clips them.
  const past = all.filter((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || (r.right <= screenWidth + 1 && r.left >= -1)) return false;
    return !clippedOnScreen(el);
  });
  const offscreen = past
    .filter((el) => !past.includes(el.parentElement!))
    .slice(0, 8)
    .map((el) => ({ el: describe(el), ...rect(el) }));

  // SVG text: rendered size, cut off by its svg's edge, and overlapping (unrotated text only).
  const texts = [...root.querySelectorAll("svg text")].filter(visible).map((el) => {
    const ctm = (el as SVGTextElement).getScreenCTM();
    const svg = el.closest("svg")!;
    return {
      el,
      text: (el.textContent ?? "").trim(),
      r: el.getBoundingClientRect(),
      px: parseFloat(style(el).fontSize) * (ctm ? Math.hypot(ctm.a, ctm.b) : 1),
      rotated: !!ctm && (Math.abs(ctm.b) > 0.01 || Math.abs(ctm.c) > 0.01),
      svg: style(svg).overflow === "visible" ? null : svg.getBoundingClientRect(),
    };
  }).filter((t) => t.text && t.r.width > 0);
  const cutOff = texts
    .filter(({ r, svg }) => svg && (r.left < svg.left - 2 || r.right > svg.right + 2 || r.top < svg.top - 2 || r.bottom > svg.bottom + 2))
    .map(({ text, r, svg }) => ({ text: text.slice(0, 30), by: Math.round(Math.max(svg!.left - r.left, r.right - svg!.right, svg!.top - r.top, r.bottom - svg!.bottom)) }));
  const flat = texts.filter((t) => !t.rotated);
  const overlaps: string[][] = [];
  for (let i = 0; i < flat.length; i++) {
    for (let j = i + 1; j < flat.length; j++) {
      const a = flat[i].r;
      const b = flat[j].r;
      const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (w > 0 && h > 0 && w * h > 0.3 * Math.min(a.width * a.height, b.width * b.height)) {
        overlaps.push([flat[i].text.slice(0, 20), flat[j].text.slice(0, 20)]);
      }
    }
  }

  // HTML text: the font size of every element with text of its own.
  const htmlText = all
    .filter((el) => !(el instanceof SVGElement) && visible(el) && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()))
    .map((el) => ({ text: (el.textContent ?? "").trim().slice(0, 30), px: parseFloat(style(el).fontSize) }));
  const allText = [...texts.map(({ text, px }) => ({ text: text.slice(0, 30), px })), ...htmlText];
  const smallest = [...allText].sort((a, b) => a.px - b.px).slice(0, 5).map(({ text, px }) => ({ text, px: Math.round(px * 10) / 10 }));

  // Tap targets: controls, and plot marks that show a pointer. Anything over a quarter of the story is a surface, not a target.
  const storyArea = root.getBoundingClientRect().width * root.getBoundingClientRect().height;
  const targets = all
    .filter((el) => {
      if (!visible(el)) return false;
      const control = el.matches("button, a[href], input, select, textarea, [role=button], [role=checkbox], [role=switch], [role=tab], [role=slider], [role=menuitem], [tabindex]:not([tabindex='-1'])");
      const pointer = style(el).cursor === "pointer" && (!el.parentElement || style(el.parentElement).cursor !== "pointer");
      const r = el.getBoundingClientRect();
      return (control || pointer) && r.width > 0 && r.width * r.height < storyArea / 4;
    })
    .map((el) => ({ el: describe(el), kind: el instanceof SVGElement ? "mark" : "control", ...rect(el) }));
  const tooSmall = (min: number) => targets.filter((t) => Math.min(t.width, t.height) < min);
  // WCAG AA's minimum: the site is desktop first, so controls needn't reach Apple's 44px.
  const smallControls = tooSmall(24).filter((t) => t.kind === "control").sort((a, b) => Math.min(a.width, a.height) - Math.min(b.width, b.height));
  const smallMarks = tooSmall(24).filter((t) => t.kind === "mark");

  // What could keep a swipe from scrolling the page, and what scrolls inside the story.
  const touchAction = all
    .filter((el) => style(el).touchAction !== "auto")
    .map((el) => ({ el: describe(el), touchAction: style(el).touchAction, ...rect(el) }))
    .slice(0, 8);
  const scrollers = all
    .filter((el) => {
      const s = style(el);
      return (/auto|scroll/.test(s.overflowX) && el.scrollWidth > el.clientWidth + 1) || (/auto|scroll/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 1);
    })
    .map((el) => ({ el: describe(el), client: [el.clientWidth, el.clientHeight], scroll: [el.scrollWidth, el.scrollHeight] }));

  return {
    story: rect(root),
    viewport: { width: screenWidth, height: visualViewport!.height, layoutWidth: innerWidth },
    pageOverflowX: document.documentElement.scrollWidth - screenWidth,
    offscreen,
    text: {
      count: allText.length,
      under10px: allText.filter((t) => t.px < 10).length,
      under12px: allText.filter((t) => t.px < 12).length,
      smallest,
      cutOff: { count: cutOff.length, examples: cutOff.slice(0, 6) },
      overlaps: { count: overlaps.length, examples: overlaps.slice(0, 6) },
    },
    targets: {
      controls: targets.filter((t) => t.kind === "control").length,
      controlsUnder24: smallControls.length,
      smallestControls: smallControls.slice(0, 6),
      marks: targets.filter((t) => t.kind === "mark").length,
      marksUnder24: smallMarks.length,
    },
    touchAction,
    scrollers,
  };
}
