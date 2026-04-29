import { GlyphProps } from "./types";

/**
 * Container component which scales a square glyph to the required dimensions.
 *
 * @prop yscale the factor by which to scale the glyph's height.
 * @prop xscale the factor by which to scale the glyph's width.
 * @prop inverted if set, reflects the glyph vertically.
 * @prop children the SVG contents to transform.
 */
function Glyph({ xscale, yscale, inverted, children }: GlyphProps) {
  const _yscale = yscale * (inverted ? -1 : 1);
  return <g transform={"scale(" + xscale + "," + _yscale + ")"}>{children}</g>;
}
export default Glyph;
