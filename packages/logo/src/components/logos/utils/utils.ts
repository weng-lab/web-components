import {
  A,
  B,
  C,
  D,
  E,
  F,
  G,
  H,
  I,
  J,
  K,
  L,
  M,
  N,
  O,
  P,
  Q,
  R,
  S,
  T,
  U,
  V,
  W,
  X,
  Y,
  Z,
  a,
  b,
  d,
  e,
  f,
  g,
  h,
  i,
  j,
  k,
  l,
  m,
  n,
  p,
  q,
  r,
  t,
  u,
  y,
  N1,
  N2,
  N3,
  N4,
  N5,
  N6,
  N7,
  N8,
  N9,
} from "../../glyphs";
import type { Alphabets } from "../types";

export const INFORMATION_CONTENT = "INFORMATION_CONTENT";
export const FREQUENCY = "FREQUENCY";

/**
 * A alphabet making use of all available symbols and a variety of colors.
 */
export const CompleteAlphabet: Alphabets[] = [
  { component: [A], regex: ["A"], color: ["red"] },
  { component: [B], regex: ["B"], color: ["maroon"] },
  { component: [C], regex: ["C"], color: ["blue"] },
  { component: [D], regex: ["D"], color: ["green"] },
  { component: [E], regex: ["E"], color: ["olive"] },
  { component: [F], regex: ["F"], color: ["navy"] },
  { component: [G], regex: ["G"], color: ["orange"] },
  { component: [H], regex: ["H"], color: ["teal"] },
  { component: [I], regex: ["I"], color: ["cadetblue"] },
  { component: [J], regex: ["J"], color: ["lavender"] },
  { component: [K], regex: ["K"], color: ["chocolate"] },
  { component: [L], regex: ["L"], color: ["coral"] },
  { component: [M], regex: ["M"], color: ["darkolivegreen"] },
  { component: [N], regex: ["N"], color: ["darkorange"] },
  { component: [O], regex: ["O"], color: ["gold"] },
  { component: [P], regex: ["P"], color: ["darkorchid"] },
  { component: [Q], regex: ["Q"], color: ["darkslateblue"] },
  { component: [R], regex: ["R"], color: ["firebrick"] },
  { component: [S], regex: ["S"], color: ["darkslategrey"] },
  { component: [T], regex: ["T"], color: ["#228b22"] },
  { component: [U], regex: ["U"], color: ["seagreen"] },
  { component: [V], regex: ["V"], color: ["indigo"] },
  { component: [W], regex: ["W"], color: ["mediumseagreen"] },
  { component: [X], regex: ["X"], color: ["black"] },
  { component: [Y], regex: ["Y"], color: ["palevioletred"] },
  { component: [Z], regex: ["Z"], color: ["peru"] },
  { component: [a], regex: ["a"], color: ["red"] },
  { component: [b], regex: ["b"], color: ["maroon"] },
  { component: [C], regex: ["c"], color: ["purple"] },
  { component: [d], regex: ["d"], color: ["green"] },
  { component: [e], regex: ["e"], color: ["olive"] },
  { component: [f], regex: ["f"], color: ["navy"] },
  { component: [g], regex: ["g"], color: ["orange"] },
  { component: [h], regex: ["h"], color: ["teal"] },
  { component: [i], regex: ["i"], color: ["cadetblue"] },
  { component: [j], regex: ["j"], color: ["lavender"] },
  { component: [k], regex: ["k"], color: ["chocolate"] },
  { component: [l], regex: ["l"], color: ["coral"] },
  { component: [m], regex: ["m"], color: ["darkolivegreen"] },
  { component: [n], regex: ["n"], color: ["darkorange"] },
  { component: [O], regex: ["o"], color: ["gold"] },
  { component: [p], regex: ["p"], color: ["darkorchid"] },
  { component: [q], regex: ["q"], color: ["darkslateblue"] },
  { component: [r], regex: ["r"], color: ["firebrick"] },
  { component: [S], regex: ["s"], color: ["darkslategrey"] },
  { component: [t], regex: ["t"], color: ["#228b22"] },
  { component: [u], regex: ["u"], color: ["seagreen"] },
  { component: [V], regex: ["v"], color: ["indigo"] },
  { component: [W], regex: ["w"], color: ["mediumseagreen"] },
  { component: [X], regex: ["x"], color: ["black"] },
  { component: [y], regex: ["y"], color: ["palevioletred"] },
  { component: [Z], regex: ["z"], color: ["peru"] },
  { component: [O], regex: ["0"], color: ["indianred"] },
  { component: [N1], regex: ["1"], color: ["red"] },
  { component: [N2], regex: ["2"], color: ["green"] },
  { component: [N3], regex: ["3"], color: ["purple"] },
  { component: [N4], regex: ["4"], color: ["navy"] },
  { component: [N5], regex: ["5"], color: ["teal"] },
  { component: [N6], regex: ["6"], color: ["gold"] },
  { component: [N7], regex: ["7"], color: ["olive"] },
  { component: [N8], regex: ["8"], color: ["slate"] },
  { component: [N9], regex: ["9"], color: ["firebrick"] },
];

export const maxLabelLength = (startpos: number, length: number) => {
  let max = ("" + startpos).length;
  for (let i = startpos + 1; i < startpos + length; ++i)
    if (("" + i).length > max) max = ("" + i).length;
  return max;
};

const regexMap = (() => {
  let r: Record<string, Alphabets> = {};
  CompleteAlphabet.forEach((glyph: Alphabets, idx: number) => {
    glyph.regex.forEach((rg) => {
      r[rg] = CompleteAlphabet[idx];
    });
  });
  return r;
})();

/**
 * Populates a alphabet with the appropriate components for rendering its symbols.
 * Each entry should have a regex field listing the symbols it renders; these may
 * be a single character or multiple. Supported symbols are A-Z, a-z, and 0-9.
 *
 * @param alphabet the symbol list to populate; array of objects with regex and color fields.
 */
export const loadGlyphComponents = (alphabet: Alphabets[]) =>
  alphabet.map((glyph: Alphabets) => {
    if (glyph.regex.length === 1) {
      return Object.assign({}, glyph, {
        component: regexMap[glyph.regex[0]].component,
      });
    }

    const color: string = "#000000";
    let r = Object.assign({}, glyph, { component: [], color: [] });

    for (let i = 0; i < r.regex.length; ++i) {
      r.component.push(regexMap[r.regex[i]].component[0]);
      r.color.push((glyph.color && glyph.color[i]) || color);
    }
    return r;
  });

export const logLikelihood =
  (backgroundFrequencies: number[]) => (r: number[], e?: number) => {
    let sum = 0.0,
      es = e || 0.0;
    r.map(
      (x: number, i: number) =>
        (sum +=
          x === 0 ? 0 : x * Math.log2(x / (backgroundFrequencies[i] || 0.01)))
    );
    return r.map((x: number) => {
      const v = x * (sum - es);
      return v <= 0.0 ? 0.0 : v;
    });
  };

export const sortedIndices = (x: number[]) => {
  let indices = x.map((_, i) => i);
  return indices.sort((a, b) => (x[a] < x[b] ? -1 : x[a] === x[b] ? 0 : 1));
};

export const sortedIndicesNegative = (x: number[]) => {
  let indices = x.map((_, i) => i);
  return indices.sort((a, b) => (x[a] < x[b] ? 1 : x[a] === x[b] ? 0 : -1));
};

export const xrange = (n: number) => {
  let range: number[] = [];
  for (let i = 0; i < Math.floor(n); i++) {
    range.push(i);
  }
  return range;
};

export const possum = (x: number[]) => {
  let s = 0.0;
  x.filter((x) => x > 0.0).forEach((x) => {
    s += x;
  });
  return s;
};

export const negsum = (x: number[]) => {
  let s = 0.0;
  x.filter((x) => x < 0.0).forEach((x) => {
    s += x;
  });
  return s;
};

const validHex = (color: string) => {
  /* validate color is a hex color */
  color = String(color).replace(/[^0-9a-f]/gi, "");
  if (color.length === 3)
    color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
  if (color.length === 8) color = color.substring(0, 6);
  if (color.length !== 6) throw new Error(color + " is not a valid hex color");

  /* return the first 6 hex digits */
  return color;
};

/**
 * Validates a hex color and parses it to an integer.
 *
 * @param color the color as a hex string (e.g. #fff or ABCDEF)
 */
export const parseHex = (color: string) => parseInt(validHex(color), 16);
