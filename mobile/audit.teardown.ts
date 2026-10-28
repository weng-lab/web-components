import fs from "node:fs";
import path from "node:path";
import { test as teardown } from "@playwright/test";
import { AUDIT_DIR } from "./stories";

/**
 * Turns the audit's findings.json files into mobile/audit-report/index.html: a table of what stands
 * out per story and device, then every story's screenshots and findings. The same flags are written
 * to summary.txt.
 */

type Level = "bad" | "warn" | "info";
type Flag = { level: Level; text: string };

// The audit's findings, as audit.spec.ts writes them - only what the flags read is typed.
type Gesture = {
  pageScrolled: { x: number; y: number };
  pageZoom: number;
  innerScrolled: boolean;
  plotChanged: boolean;
  mutations: number;
  events: string[];
  appeared: string[];
  selection: string;
};
type Findings = {
  story: { id: string; title: string; name: string };
  device: string;
  errors: string[];
  layout: {
    pageOverflowX: number;
    offscreen: { el: string }[];
    text: { under10px: number; cutOff: { count: number }; overlaps: { count: number } };
    targets: { controlsUnder24: number; marksUnder24: number };
  };
  probes: {
    tap: Gesture & { stillShownAfterTapAway: number };
    swipeUp: Gesture & { distance: number };
    swipeLeft: Gesture;
    pinch: Gesture;
    longPress: Gesture;
  };
};

const SHOTS = ["initial", "tap", "tap-away", "swipe-up", "swipe-left", "pinch", "long-press"];

function flags({ errors, layout, probes }: Findings): Flag[] {
  const out: Flag[] = [];
  const add = (level: Level, text: string) => out.push({ level, text });
  const { text, targets } = layout;
  const { tap, swipeUp, swipeLeft, pinch, longPress } = probes;

  if (layout.pageOverflowX > 0) {
    const widest = layout.offscreen[0]?.el;
    add("bad", `page scrolls sideways by ${layout.pageOverflowX}px${widest ? `, from ${widest}` : ""}`);
  }
  if (text.cutOff.count) add("bad", `${text.cutOff.count} label(s) cut off`);
  if (text.overlaps.count) add("warn", `${text.overlaps.count} overlapping label pair(s)`);
  if (text.under10px) add("warn", `${text.under10px} text(s) under 10px`);
  if (targets.controlsUnder24) add("bad", `${targets.controlsUnder24} control(s) under 24px`);
  if (targets.marksUnder24) add("info", `${targets.marksUnder24} tappable mark(s) under 24px`);

  if (swipeUp.pageScrolled.y < swipeUp.distance / 2) {
    add("bad", `a ${swipeUp.distance}px swipe up scrolls the page ${Math.round(swipeUp.pageScrolled.y)}px`);
  }
  if (swipeUp.plotChanged) add("info", "swipe up changes the plot");

  if (tap.appeared.length) add("info", `tap shows "${tap.appeared[0].slice(0, 40)}"`);
  else if (!tap.plotChanged && tap.mutations === 0) add("warn", "tap does nothing visible");
  else if (tap.plotChanged) add("info", "tap changes the plot");
  if (tap.stillShownAfterTapAway) add("bad", "what the tap showed stays after tapping elsewhere");

  if (swipeLeft.pageScrolled.x) add("bad", "swipe left scrolls the page sideways");
  if (swipeLeft.innerScrolled) add("info", "swipe left scrolls inside the plot");
  else if (swipeLeft.plotChanged) add("info", "swipe left changes the plot");

  if (pinch.pageZoom > 1.05) add("info", `pinch zooms the page ×${pinch.pageZoom.toFixed(1)}`);
  if (pinch.plotChanged) add("info", "pinch changes the plot");
  if (pinch.pageZoom <= 1.05 && !pinch.plotChanged) add("warn", "pinch does nothing");

  if (longPress.events.includes("contextmenu")) add("info", "long press opens the context menu");
  if (longPress.selection) add("warn", `long press selects "${longPress.selection.slice(0, 30)}"`);
  if (longPress.appeared.length) add("info", `long press shows "${longPress.appeared[0].slice(0, 40)}"`);

  if (errors.length) add("bad", `${errors.length} console error(s)`);
  return out;
}

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const chips = (list: Flag[]) => list.map(({ level, text }) => `<span class="flag ${level}">${escape(text)}</span>`).join("");

teardown("build the audit report", () => {
  const all: (Findings & { dir: string })[] = fs
    .globSync("*/*/findings.json", { cwd: AUDIT_DIR })
    .map((file) => ({ ...JSON.parse(fs.readFileSync(path.join(AUDIT_DIR, file), "utf8")), dir: path.dirname(file) }));
  if (!all.length) return;

  const devices = [...new Set(all.map((f) => f.device))];
  const stories = [...new Map(all.map((f) => [f.story.id, f.story])).values()].sort((a, b) => a.id.localeCompare(b.id));
  const find = (storyId: string, device: string) => all.find((f) => f.story.id === storyId && f.device === device);

  const summary = stories
    .map((story) => {
      const lines = devices.map((device) => {
        const f = find(story.id, device);
        return `  ${device}: ${f ? flags(f).map((flag) => `[${flag.level}] ${flag.text}`).join("; ") : "not run"}`;
      });
      return `${story.title} › ${story.name}\n${lines.join("\n")}`;
    })
    .join("\n\n");
  fs.writeFileSync(path.join(AUDIT_DIR, "summary.txt"), summary + "\n");

  const table = `<table><tr><th>Story</th>${devices.map((d) => `<th>${escape(d.replace(/^audit:/, ""))}</th>`).join("")}</tr>${stories
    .map(
      (story) =>
        `<tr><th><a href="#${story.id}">${escape(story.title.replace(/^visualization\//, ""))} › ${escape(story.name)}</a></th>${devices
          .map((device) => {
            const f = find(story.id, device);
            return `<td>${f ? chips(flags(f).filter((flag) => flag.level !== "info")) : "not run"}</td>`;
          })
          .join("")}</tr>`
    )
    .join("")}</table>`;

  const sections = stories
    .map((story) => {
      const rows = devices
        .map((device) => {
          const f = find(story.id, device);
          if (!f) return "";
          const shots = SHOTS.map(
            (shot) => `<figure><a href="${f.dir}/${shot}.png"><img src="${f.dir}/${shot}.png" loading="lazy"></a><figcaption>${shot}</figcaption></figure>`
          ).join("");
          return `<div class="device"><h3>${escape(device.replace(/^audit:/, ""))}</h3><div>${chips(flags(f))}</div><div class="shots">${shots}</div>
            <details><summary>Findings</summary><pre>${escape(JSON.stringify({ errors: f.errors, layout: f.layout, probes: f.probes }, null, 2))}</pre></details></div>`;
        })
        .join("");
      return `<section id="${story.id}"><h2>${escape(story.title)} › ${escape(story.name)}</h2>${rows}</section>`;
    })
    .join("");

  fs.writeFileSync(
    path.join(AUDIT_DIR, "index.html"),
    `<!doctype html><html><head><meta charset="utf-8"><title>Mobile audit</title><style>
      body { font: 14px/1.4 system-ui, sans-serif; margin: 24px; color: #1f2328; background: #fff; }
      table { border-collapse: collapse; margin-bottom: 32px; }
      th, td { border: 1px solid #d0d7de; padding: 6px 8px; text-align: left; vertical-align: top; }
      td { min-width: 160px; }
      .flag { display: inline-block; margin: 2px 4px 2px 0; padding: 1px 6px; border-radius: 4px; font-size: 12px; }
      .bad { background: #ffebe9; color: #82071e; } .warn { background: #fff8c5; color: #4d2d00; } .info { background: #ddf4ff; color: #0a3069; }
      section { border-top: 2px solid #d0d7de; margin-top: 24px; }
      .shots { display: flex; gap: 8px; overflow-x: auto; margin: 8px 0; }
      figure { margin: 0; } figcaption { font-size: 12px; color: #59636e; text-align: center; }
      img { height: 360px; border: 1px solid #d0d7de; display: block; }
      pre { font-size: 11px; max-height: 400px; overflow: auto; background: #f6f8fa; padding: 8px; }
    </style></head><body><h1>Mobile audit</h1><p>${new Date().toLocaleString("en-US")} · Info flags are left out of the table.</p>${table}${sections}</body></html>`
  );
  console.log(`\n${summary}\n\nReport: ${path.join(AUDIT_DIR, "index.html")}`);
});
