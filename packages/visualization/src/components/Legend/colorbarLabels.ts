/**
 * A colorbar's end labels: what they say, and how wide they are, so a bar can be laid out beside
 * them in SVG, where text takes no room of its own.
 */

import type { Theme } from "@mui/material/styles";
import { useState, useSyncExternalStore } from "react";
import { clampedEnds, type ColorRange } from "./colorbarAxis";

/**
 * How a colorbar writes its end labels. The family is named outright, not through a CSS variable,
 * which neither the canvas that measures the labels nor a downloaded SVG can resolve.
 */
export type ColorbarLabelStyle = {
  fontFamily: string;
  fontSize: number;
  fontWeight?: number;
  /** In pixels. */
  letterSpacing?: number;
  fill: string;
};

/** The library's axis text, so by default a colorbar matches the plot beside it. */
export const DEFAULT_LABEL_STYLE: ColorbarLabelStyle = { fontFamily: "sans-serif", fontSize: 11, fill: "#4d4f52" };

/** A typography length in pixels: rem against the root size, em against the font's own. */
const toPx = (length: string | number | undefined, rem: number, em: number) => {
  if (typeof length === "number") return length;
  const value = parseFloat(length ?? "0");
  if (length?.endsWith("rem")) return value * rem;
  if (length?.endsWith("em")) return value * em;
  return value;
};

/**
 * A theme's caption as a colorbar's label style, so the labels read as the text around them and
 * follow the theme into dark mode. Pass `fontFamily` by name where the theme's is a CSS variable
 * (next/font's, say), which neither the canvas measuring the labels nor a downloaded SVG can resolve.
 */
export const themeLabelStyle = ({ typography, palette }: Theme, fontFamily?: string): ColorbarLabelStyle => {
  const { caption, htmlFontSize } = typography;
  const fontSize = toPx(caption.fontSize, htmlFontSize, 16);
  return {
    fontFamily: fontFamily ?? caption.fontFamily ?? typography.fontFamily ?? "sans-serif",
    fontSize,
    fontWeight: Number(caption.fontWeight ?? 400),
    letterSpacing: toPx(caption.letterSpacing, htmlFontSize, fontSize),
    fill: palette.text.primary,
  };
};

/** One end's label: its text, whether shown values lie past that end, and its width in pixels. */
export type EndLabel = { text: string; clamped: boolean; width: number };

/** A rough width, for the server and hydration, where there's no canvas to measure with. */
const estimate = (text: string, { fontSize, letterSpacing = 0 }: ColorbarLabelStyle) =>
  text.length * (fontSize * 0.6 + letterSpacing);

let canvas: HTMLCanvasElement | null = null;

const measure = (text: string, style: ColorbarLabelStyle) => {
  canvas ??= document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return estimate(text, style);
  context.font = `${style.fontWeight ?? 400} ${style.fontSize}px ${style.fontFamily}`;
  // Canvas leaves letter spacing out; SVG adds it after every character.
  return context.measureText(text).width + (style.letterSpacing ?? 0) * text.length;
};

const subscribeToFonts = (onChange: () => void) => {
  document.fonts.addEventListener("loadingdone", onChange);
  return () => document.fonts.removeEventListener("loadingdone", onChange);
};

/**
 * "server" until hydrated, so the first client render matches the server's HTML; then whether the
 * document's fonts have loaded, so labels measured in a fallback font are measured again once they have.
 */
const useFontStatus = () =>
  useSyncExternalStore(
    subscribeToFonts,
    () => document.fonts.status,
    () => "server"
  );

/** A width that, while `hold`, grows but never shrinks - see SteadyText. */
const useHeldWidth = (width: number, hold: boolean) => {
  const [held, setHeld] = useState(0);
  // Recorded during render, since an effect would commit again on every step of a drag.
  if (!hold && held !== 0) setHeld(0);
  if (hold && width > held) setHeld(width);
  return hold ? Math.max(width, held) : width;
};

/**
 * The end labels of a colorbar spanning `range`: its ends as `format` writes them, with "≤" or "≥"
 * where values on screen lie past one, and how wide each is in `style`. While `hold` (the range
 * editor is open), the widths hold their widest, so the bar doesn't shift as the range is dragged.
 */
export const useEndLabels = (
  range: ColorRange,
  values: ArrayLike<number>,
  format: (value: number) => string,
  style: ColorbarLabelStyle,
  hold: boolean
): { low: EndLabel; high: EndLabel } => {
  const status = useFontStatus();
  const clamped = clampedEnds(values, range);
  const low = `${clamped.low ? "≤ " : ""}${format(range[0])}`;
  const high = `${clamped.high ? "≥ " : ""}${format(range[1])}`;
  const widthOf = (text: string) => Math.ceil(status === "server" ? estimate(text, style) : measure(text, style));
  const lowWidth = useHeldWidth(widthOf(low), hold);
  const highWidth = useHeldWidth(widthOf(high), hold);
  return {
    low: { text: low, clamped: clamped.low, width: lowWidth },
    high: { text: high, clamped: clamped.high, width: highWidth },
  };
};
