import React from "react";

import { sortedIndices, loadGlyphComponents } from "./utils/utils";
//import { parseFASTA, parseSequences } from '../../common/fasta';
import { GlyphStack } from "./glyphstack";
import { Alphabets, RawLogoProps } from "./types";
import { sortedIndicesNegative } from "./utils/utils";
import { LetterProps } from "../glyphs/types";

export const _position =
  (width: number, height: number, alpha?: number, inverted?: boolean) =>
  (
    lv: number[],
    key: number,
    alphabet: Alphabets[],
    events: {
      onSymbolMouseOver?: (symbol: Alphabets) => void;
      onSymbolMouseOut?: (symbol: Alphabets) => void;
      onSymbolClick?: (symbol: Alphabets) => void;
    },
    transform?: string,
    negative?: boolean
  ) => {
    const indices: number[] = negative
      ? sortedIndicesNegative(lv)
      : sortedIndices(lv); // tallest on top
    const { onSymbolMouseOver, onSymbolMouseOut, onSymbolClick } = events;

    return (
      <GlyphStack
        indices={indices}
        alphabet={alphabet}
        alpha={alpha}
        onSymbolMouseOver={(s: Alphabets) =>
          onSymbolMouseOver && onSymbolMouseOver(s)
        }
        onSymbolClick={(s: Alphabets) => onSymbolClick && onSymbolClick(s)}
        onSymbolMouseOut={(s: Alphabets) =>
          onSymbolMouseOut && onSymbolMouseOut(s)
        }
        lv={lv}
        transform={transform}
        width={width}
        height={height}
        key={key}
        inverted={inverted}
      />
    );
  };

/**
 * Renders a logo without axes.
 *
 * @prop values matrix containing symbol values.
 * @prop glyphWidth the width of a single glyph, relative to the containing SVG.
 * @prop stackHeight the height of each position, relative to the containing SVG; corresponds to a matrix value of 1.
 * @prop alphabet symbol list mapping columns to colored glyphs.
 * @prop onSymbolMouseOver raised when a symbol is moused over; receives information about the moused over symbol.
 * @prop onSymbolMousedOut raised when a symbol is moused out; receives information about the moused out symbol.
 * @prop onSymbolClicked raised when a symbol is clicked; receives information about the clicked symbol.
 */
export const RawLogo: React.FC<RawLogoProps> = ({
  values,
  glyphWidth,
  stackHeight,
  alphabet,
  onSymbolMouseOver,
  onSymbolMouseOut,
  onSymbolClick,
}) => {
  const gposition = _position(glyphWidth, stackHeight);

  for (const index in alphabet) {
    let d: {
      component: React.FC<LetterProps>[];
      regex: string[];
      color?: string[] | undefined;
    } = alphabet[index];
    if (!d.component) {
      alphabet = loadGlyphComponents(alphabet);
      break;
    }
  }
  const r: any = values.map((lv: number[], i: number) =>
    gposition(
      lv,
      i,
      alphabet,
      { onSymbolMouseOver, onSymbolMouseOut, onSymbolClick },
      "translate(" + glyphWidth * i + ",0)"
    )
  );
  return r;
};
