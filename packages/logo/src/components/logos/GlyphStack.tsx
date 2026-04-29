import React from 'react';

import { Glyph } from '../glyphs';
import { GlyphStackProps } from './types';

/**
 *
 */
export const GlyphStack: React.FC<GlyphStackProps> = ({
  height,
  width,
  indices,
  alphabet,
  lv,
  transform,
  alpha,
  inverted,
  onSymbolMouseOver,
  onSymbolMouseOut,
  onSymbolClick,
}) => {
  /* move up from bottom */
  let cy = height; // start from bottom with smallest letter
  let xscale = width / 100.0; // scale to glyphs' 100x100 viewport

  /* if no alpha passed, default to opaque */
  alpha = alpha || 1;

  /* stack glyphs in order */
  let glyphs = indices.map((index: number) => {
    if (!alphabet[index] || !alphabet[index].component) {
      return null;
    }
    if (lv[index] === 0.0) {
      return null;
    }

    cy -= lv[index] * 100.0;
    const ccy = inverted ? cy + lv[index] * 100.0 : cy;

    let _xscale = (xscale * 0.8) / alphabet[index].component.length;

    return alphabet[index].component.map((G: any, i: number) => (
      <g
        transform={
          'translate(' +
          ((i * width * 0.8) / alphabet[index].component.length + width * 0.1) +
          ',' +
          ccy +
          ')'
        }
        key={index + '_' + i}
        onMouseOver={() => {
          onSymbolMouseOver &&
            onSymbolMouseOver({
              component: [alphabet[index].component[i]],
              regex: [alphabet[index].regex[i]],
              color: alphabet[index].color && [alphabet[index].color!![i]],
            });
        }}
        onMouseOut={
          onSymbolMouseOut &&
          (() =>
            onSymbolMouseOut({
              component: [alphabet[index].component[i]],
              regex: [alphabet[index].regex[i]],
              color: alphabet[index].color && [alphabet[index].color!![i]],
            }))
        }
        onClick={
          onSymbolClick &&
          (() =>
            onSymbolClick({
              component: [alphabet[index].component[i]],
              regex: [alphabet[index].regex[i]],
              color: alphabet[index].color && [alphabet[index].color!![i]],
            }))
        }
      >
        <Glyph xscale={_xscale} yscale={lv[index]} inverted={inverted || false}>
          <G
            fill={
              (alphabet[index].color && alphabet[index].color!![i]) || '#000000'
            }
            fillOpacity={alpha}
            {...alphabet[index]}
          />
        </Glyph>
      </g>
    ));
  });

  /* wrap glyphs in g */
  return <g transform={transform}>{glyphs}</g>;
};
