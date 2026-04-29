import React from 'react';

import {
  loadGlyphComponents,
  possum,
  negsum,
  maxLabelLength,
} from './utils/utils';

import { XAxis } from './xaxis';
import { YAxisWithNegatives } from './yaxisneg';
import { YGridlines } from './ygridlines';
import { _position } from './rawlogo';
import { Alphabets, LogoWithNegativesProps } from './types';

/**
 * Renders a logo with positive and negative symbol heights.
 *
 * @prop values matrix containing the symbol heights.
 * @prop height the height of the logo relative to the containing SVG.
 * @prop width the width of the logo relative to the containing SVG.
 * @prop alphabet symbol list mapping columns to colored glyphs.
 * @prop startPos number of the first position in the logo; defaults to 1.
 * @prop negativealpha if set, gives negative symbols a lighter shade than positive symbols.
 * @prop showGridLines if set, shows vertical grid lines.
 * @prop inverted if set, renders negative letters upright rather than upside down.
 */
export const LogoWithNegatives: React.FC<LogoWithNegativesProps> = ({
  values,
  height,
  width,
  alphabet,
  scale,
  startPos,
  negativealpha,
  showGridLines,
  inverted,
  onSymbolMouseOver,
  onSymbolMouseOut,
  onSymbolClick,
}) => {
  /* need at least one entry to continue */
  if (values.length === 0 || values[0].length === 0) {
    return <div />;
  }

  /* load alphabet components if necessary */
  for (const index in alphabet) {
    let d: Alphabets = alphabet[index];
    if (!d.component) {
      alphabet = loadGlyphComponents(alphabet);
      break;
    }
  }

  /* misc options */
  startPos = startPos !== null && startPos !== undefined ? startPos : 1;
  negativealpha = negativealpha < 0 ? 0 : negativealpha;
  negativealpha = negativealpha > 255 ? 255 : negativealpha;

  /* compute scaling factors */
  let maxes = values.map(possum);
  let mins = values.map((x: number[]) => -negsum(x));
  let mvalue = Math.max(...maxes, ...mins);
  let maxHeight = 200.0;
  let glyphWidth = maxHeight / 6.0;

  /* compute viewBox */
  let viewBoxW = values.length * glyphWidth + 80;
  let viewBoxH = maxHeight + 18 * (maxLabelLength(startPos, values.length) + 1);
  let gposition = _position(glyphWidth, maxHeight / 2.05);
  let nposition = _position(
    glyphWidth,
    -maxHeight / 2.05,
    negativealpha / 255.0,
    inverted
  );
  if (scale) viewBoxW > viewBoxH ? (width = scale) : (height = scale);

  return (
    <svg
      width={width}
      height={height}
      viewBox={'0 0 ' + viewBoxW + ' ' + viewBoxH}
    >
      {showGridLines && (
        <YGridlines
          {...{
            minrange: startPos,
            maxrange: startPos + values.length,
            xstart: 70,
            width: viewBoxW,
            height: maxHeight,
            xaxis_y: 10,
            numberofgridlines: 10 * values.length, //10 grid lines per glyph
          }}
        />
      )}
      <XAxis
        transform={'translate(80,' + (maxHeight + 20) + ')'}
        n={values.length}
        glyphWidth={glyphWidth}
        startPos={startPos}
      />
      {
        <YAxisWithNegatives
          transform="translate(0,10)"
          width={65}
          height={maxHeight}
          min={-mvalue}
          max={mvalue}
        />
      }
      <line
        style={{
          fill: 'none',
          stroke: '#000000',
          strokeWidth: 2.0,
          strokeLinecap: 'butt',
          strokeLinejoin: 'miter',
          strokeOpacity: 1,
          strokeMiterlimit: 4,
          strokeDasharray: '0.53,1.59',
          strokeDashoffset: 0,
        }}
        transform={'translate(80,' + (11 + maxHeight / 2) + ')'}
        x1={0}
        x2={viewBoxW - 80}
      />
      <g transform="translate(80,10)">
        {values.map((lv: number[], i: number) =>
          gposition(
            lv.map(x => (x > 0.0 ? x / mvalue : 0.0)),
            i,
            alphabet,
            { onSymbolMouseOver, onSymbolMouseOut, onSymbolClick },
            'translate(' + glyphWidth * i + ',0)',
            false
          )
        )}
        {values.map((lv: number[], i: number) =>
          nposition(
            lv.map(x => (x < 0.0 ? x / mvalue : 0.0)),
            i,
            alphabet,
            { onSymbolMouseOver, onSymbolMouseOut, onSymbolClick },
            'translate(' + glyphWidth * i + ',' + maxHeight + ')',
            true
          )
        )}
      </g>
    </svg>
  );
};
