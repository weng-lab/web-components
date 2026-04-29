import React from "react";

export type GlyphProps = {
  inverted?: boolean;
  yscale: number;
  xscale: number;
  children?: React.ReactNode;
};

export type LetterProps =
  | React.SVGProps<SVGPathElement>
  | React.SVGProps<SVGRectElement>
  | React.SVGProps<SVGCircleElement>;
