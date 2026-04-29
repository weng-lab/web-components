import { Logo } from './logo';
import React from 'react';
import { CompleteLogoProps } from './types';
import { CompleteAlphabet } from './utils/utils';

export const CompleteLogo: React.FC<CompleteLogoProps> = ({
  ppm,
  pfm,
  scale,
  startPos,
  mode,
  svgRef,
}) => (
  <Logo
    ppm={ppm}
    alphabet={CompleteAlphabet}
    scale={scale}
    mode={mode}
    startPos={startPos}
    pfm={pfm}
    svgRef={svgRef}
  />
);
