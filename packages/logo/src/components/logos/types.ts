import { LetterProps } from "../glyphs/types";

export type XAxisProps = {
  transform?: string;
  glyphWidth: number;
  n: number;
  startPos?: number;
};

export type YAxisProps = {
  transform?: string;
  width: number;
  height: number;
  bits: number;
  zeroPoint?: number;
};

export type GlyphStackProps = {
  height: number;
  width: number;
  indices: number[];
  alphabet: Alphabets[];
  lv: number[];
  transform?: string;
  alpha?: number;
  inverted?: boolean;
  onSymbolMouseOver?: (symbol: Alphabets) => void;
  onSymbolMouseOut?: (symbol: Alphabets) => void;
  onSymbolClick?: (symbol: Alphabets) => void;
};

export type Alphabets = {
  component: React.FC<LetterProps>[];
  regex: string[];
  color?: string[];
};

export type RawLogoProps = {
  alphabet: Alphabets[];
  glyphWidth: number;
  values: number[][];
  stackHeight: number;
  onSymbolMouseOver?: (symbol: Alphabets) => void;
  onSymbolMouseOut?: (symbol: Alphabets) => void;
  onSymbolClick?: (symbol: Alphabets) => void;
};

export type ProteinLogoProps = CompleteLogoProps;

export type RNALogoProps = CompleteLogoProps;

export type DNALogoProps = CompleteLogoProps;

export type CompleteLogoProps = {
  ppm?: number[][];
  pfm?: number[][];
  values?: number[][];
  fasta?: string;
  mode?: string;
  height?: number;
  width?: number;
  glyphWidth?: number;
  scale?: number;
  startPos?: number;
  showGridLines?: boolean;
  backgroundFrequencies?: number[];
  constantPseudocount?: number;
  smallSampleCorrectionOff?: boolean;
  yAxisMax?: number;
  onSymbolMouseOver?: (symbol: Alphabets) => void;
  onSymbolMouseOut?: (symbol: Alphabets) => void;
  onSymbolClick?: (symbol: Alphabets) => void;
  noFastaNames?: boolean;
  countUnaligned?: boolean;
  svgRef?: React.RefObject<SVGSVGElement | null>;
};

export type LogoWithNegativesProps = {
  values: number[][];
  height?: number;
  width?: number;
  alphabet: {
    component: React.FC<LetterProps>[];
    regex: string[];
    color?: string[];
  }[];
  scale?: number;
  startPos?: number;
  negativealpha: number;
  inverted?: boolean;
  showGridLines?: boolean;
  onSymbolMouseOver?: (symbol: Alphabets) => void;
  onSymbolMouseOut?: (symbol: Alphabets) => void;
  onSymbolClick?: (symbol: Alphabets) => void;
  svgRef?: React.RefObject<SVGSVGElement | null>;
};

export type LogoProps = {
  ppm?: number[][];
  pfm?: number[][];
  values?: number[][];
  fasta?: string;
  mode?: string;
  height?: number;
  width?: number;
  alphabet: {
    component: React.FC<LetterProps>[];
    regex: string[];
    color?: string[];
  }[];
  glyphWidth?: number;
  scale?: number;
  startPos?: number;
  showGridLines?: boolean;
  backgroundFrequencies?: number[];
  constantPseudocount?: number;
  smallSampleCorrectionOff?: boolean;
  yAxisMax?: number;
  onSymbolMouseOver?: (symbol: Alphabets) => void;
  onSymbolMouseOut?: (symbol: Alphabets) => void;
  onSymbolClick?: (symbol: Alphabets) => void;
  noFastaNames?: boolean;
  countUnaligned?: boolean;
  svgRef?: React.RefObject<SVGSVGElement | null>;
};

export type YGridlinesProps = {
  minrange: number;
  maxrange: number;
  xstart: number;
  width: number;
  height: number;
  xaxis_y: number;
  numberofgridlines: number;
  stroke?: string;
};

export type YAxisFrequencyProps = {
  ticks: number;
  transform?: string;
  height: number;
  width: number;
};

export type YAxisWithNegativesProps = {
  max: number;
  min: number;
  transform?: string;
  height: number;
  width: number;
};
