import React from "react";
import { LetterProps } from "./types";

export const a: React.FC<LetterProps> = (props) => (
  <g>
    <path
      d="M 10 20 C 5 -5 95 -10 100 35 L 100 100 L 80 100 L 80 90 C 90 105 10 105 0 80 C 0 45 40 40 60 45 L 80 50 C 95 30 40 5 10 35"
      {...(props as React.SVGProps<SVGPathElement>)}
    />
    <path fill="#ffffff" d="M 77 70 C 70 90 30 90 22 80 C 10 50 80 60 77 70" />
  </g>
);

export const b: React.FC<LetterProps> = (props) => (
  <g>
    <path
      d="M 20 0 L 0 0 L 0 100 L 20 100 L 20 80 C 10 110 90 110 100 70 L 100 60 C 90 10 10 10 20 40 L 20 40 L 20 0"
      {...(props as React.SVGProps<SVGPathElement>)}
    />
    <path d="M 79 60 C 80 95 20 95 20 65 C 20 30 80 30 79 65" fill="#ffffff" />
  </g>
);

export const d: React.FC<LetterProps> = (props) => (
  <g>
    <path
      d="M 80 0 L 100 0 L 100 100 L 80 100 L 80 80 C 90 110 10 110 0 70 L 0 60 C 10 10 90 10 80 40 L 80 40 L 80 0"
      {...(props as React.SVGProps<SVGPathElement>)}
    />
    <path d="M 79 60 C 80 95 20 95 20 65 C 20 30 80 30 79 65" fill="#ffffff" />
  </g>
);

export const e: React.FC<LetterProps> = (props) => (
  <g>
    <path
      d="M 25 50 L 100 50 C 85 -17 15 -17 0 50 C 0 75 25 100 50 100 L 95 100 L 95 80 L 50 80 Q 25 70 25 50"
      {...(props as React.SVGProps<SVGPathElement>)}
    />
    <path d="M 33 37 L 68 37 C 58 10 42 10 33 37" fill="#ffffff" />
  </g>
);

export const f: React.FC<LetterProps> = (props) => (
  <path
    d="M 95 32 C 80 -17 20 -5 20 37 L 7 37 L 7 50 L 20 50 L 20 100 L 45 100 L 45 50 L 57 50 L 57 37 L 45 37 C 45 10 70 10 75 32 L 95 32"
    {...(props as React.SVGProps<SVGPathElement>)}
  />
);

export const g: React.FC<LetterProps> = (props) => (
  <g>
    <path
      d="M 100 15 L 100 0 L 80 0 L 80 15 C 85 -8 15 -8 0 25 C 2 75 80 75 80 50 L 75 65 C 65 85 45 85 10 75 L 10 90 C 25 110 85 110 100 75 L 100 25"
      {...(props as React.SVGProps<SVGPathElement>)}
    />
    <path d="M 67 30 C 70 10 25 10 27 30 C 25 50 70 50 67 30" fill="#ffffff" />
  </g>
);

export const h: React.FC<LetterProps> = (props) => (
  <path
    d="M 0 0 L 0 100 L 20 100 L 20 80 C 20 40 80 40 80 80 L 80 100 L 100 100 L 100 50 C 80 20 20 20 20 45 L 20 0 L 0 0"
    {...(props as React.SVGProps<SVGPathElement>)}
  />
);

export const i: React.FC<LetterProps> = (props) => (
  <g>
    <rect
      {...(props as React.SVGProps<SVGRectElement>)}
      x={40}
      y={20}
      width={20}
      height={80}
    />
    <rect
      {...(props as React.SVGProps<SVGRectElement>)}
      x={40}
      y={0}
      width={20}
      height={15}
    />
  </g>
);

export const j: React.FC<LetterProps> = (props) => (
  <g>
    <path
      d="M 0 60 C 0 115 100 115 100 60 L 100 20 L 80 20 L 80 60 C 80 90 20 90 25 60"
      {...(props as React.SVGProps<SVGPathElement>)}
    />
    <path d="M 0 60 L 100 20" {...(props as React.SVGProps<SVGPathElement>)} />
  </g>
);

export const k: React.FC<LetterProps> = (props) => (
  <path
    d="M 0 0 L 20 0 L 20 60 L 75 30 L 100 30 L 50 65 L 100 100 L 75 100 L 27 80 L 20 85 L 20 100 L 0 100 L 0 0"
    {...(props as React.SVGProps<SVGPathElement>)}
  />
);

export const l: React.FC<LetterProps> = (props) => (
  <rect
    x={40}
    y={0}
    width={20}
    height={100}
    {...(props as React.SVGProps<SVGRectElement>)}
  />
);

export const m: React.FC<LetterProps> = (props) => (
  <path
    d="M 0 0 L 0 100 L 20 100 L 20 60 C 20 20 40 20 40 50 L 40 100 L 60 100 L 60 50 C 60 20 80 20 80 50 L 80 100 L 100 100 L 100 50 C 100 -10 40 -10 50 50 C 50 -5 20 -5 20 20 L 20 0 L 0 0"
    {...(props as React.SVGProps<SVGPathElement>)}
  />
);

export const n: React.FC<LetterProps> = (props) => (
  <path
    d="M 0 0 L 0 100 L 20 100 L 20 60 C 20 0 80 0 80 50 L 80 100 L 100 100 L 100 25 C 80 -10 20 -10 20 20 L 20 0 L 0 0"
    {...(props as React.SVGProps<SVGPathElement>)}
  />
);

export const p: React.FC<LetterProps> = (props) => (
  <g>
    <path
      d="M 20 100 L 0 100 L 0 0 L 20 0 L 20 20 C 10 -10 90 -10 100 30 L 100 40 C 90 90 10 90 20 60 L 20 60 L 20 100"
      {...(props as React.SVGProps<SVGPathElement>)}
    />
    <path d="M 79 40 C 80 5 20 5 20 35 C 20 70 80 70 79 35" fill="#ffffff" />
  </g>
);

export const q: React.FC<LetterProps> = (props) => (
  <g>
    <path
      d="M 80 100 L 100 100 L 100 0 L 80 0 L 80 20 C 90 -10 10 -10 0 30 L 0 40 C 10 90 90 90 80 60 L 80 60 L 80 100"
      {...(props as React.SVGProps<SVGPathElement>)}
    />
    <path d="M 79 40 C 80 5 20 5 20 35 C 20 70 80 70 79 35" fill="#ffffff" />
  </g>
);

export const r: React.FC<LetterProps> = (props) => (
  <path
    d="M 0 0 L 0 100 L 20 100 L 20 60 C 20 0 80 0 80 50 L 100 50 L 100 25 C 80 -10 20 -10 20 20 L 20 0 L 0 0"
    {...(props as React.SVGProps<SVGPathElement>)}
  />
);

export const t: React.FC<LetterProps> = (props) => (
  <path
    d="M 95 68 C 80 117 20 105 20 63 L 20 47 L 7 47 L 7 27 L 20 27 L 20 0 L 45 0 L 45 27 L 57 27 L 57 47 L 45 47 L 45 63 C 45 90 70 90 75 68 L 95 68"
    {...(props as React.SVGProps<SVGPathElement>)}
  />
);

export const u: React.FC<LetterProps> = (props) => (
  <g>
    <path
      d="M 0 0 L 0 60 C 0 111 100 111 100 60 L 100 0 L 75 0 L 75 60 C 80 90 20 90 25 60 L 25 0 L 0 0"
      {...(props as React.SVGProps<SVGPathElement>)}
    />
    <rect
      {...(props as React.SVGProps<SVGRectElement>)}
      x={75}
      y={0}
      height={100}
      width={25}
    />
  </g>
);

export const y: React.FC<LetterProps> = (props) => (
  <path
    d="M 0 0 L 25 0 L 50 36 L 75 0 L 100 0 L 40 100 L 12 100 L 37 55 L 0 0"
    {...(props as React.SVGProps<SVGPathElement>)}
  />
);
