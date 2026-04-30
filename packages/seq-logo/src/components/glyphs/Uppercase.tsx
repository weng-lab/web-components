import React from "react";
import { LetterProps } from "./types";

export const A: React.FC<LetterProps> = (props) => (
  <g>
    <path
      {...(props as React.SVGProps<SVGPathElement>)}
      d="M 0 100 L 33 0 L 66 0 L 100 100 L 75 100 L 66 75 L 33 75 L 25 100 L 0 100"
    />
    <path fill="#ffffff" d="M 41 55 L 50 25 L 58 55 L 41 55" />
  </g>
);

const B_path = `M 0 0 L 80 0 C 105 0 105 50 80 50
         C 105 50 105 100 80 100 L 00 100
         L 0 0`;

export const B: React.FC<LetterProps> = (props) => (
  <g>
    <path {...(props as React.SVGProps<SVGPathElement>)} d={B_path} />
    <path
      d="M 20 15 L 70 15 C 80 15 80 35 70 35 L 20 35 L 20 15"
      fill="#ffffff"
    />
    <path
      d="M 20 65 L 70 65 C 80 65 80 85 70 85 L 20 85 L 20 65"
      fill="#ffffff"
    />
  </g>
);

const C_path = `M 100 28 C 100 -13 0 -13 0 50
         C 0 113 100 113 100 72 L 75 72
         C 75 90 30 90 30 50 C 30 10 75 10 75 28
         L 100 28`;

export const C: React.FC<LetterProps> = (props) => (
  <path {...(props as React.SVGProps<SVGPathElement>)} d={C_path} />
);

const D_path = `M 0 0 L 60 0 C 110 0 110 100 60 100
               L 0 100 L 0 0`;
const D_innerpath = `M 20 15 L 40 15 C 85 15 85 85 40 85
                    L 20 85 L 20 15`;

export const D: React.FC<LetterProps> = (props) => (
  <g>
    <path {...(props as React.SVGProps<SVGPathElement>)} d={D_path} />
    <path fill="#ffffff" d={D_innerpath} />
  </g>
);

const E_path = `M 0 0 L 100 0 L 100 20 L 20 20 L 20 40
               L 90 40 L 90 60 L 20 60 L 20 80 L 100 80
               L 100 100 L 0 100 L 0 0`;

export const E: React.FC<LetterProps> = (props) => (
  <path {...(props as React.SVGProps<SVGPathElement>)} d={E_path} />
);

const F_path = `M 0 0 L 100 0 L 100 20 L 20 20 L 20 40
               L 80 40 L 80 60 L 20 60 L 20 100 L 0 100
               L 0 0`;

export const F: React.FC<LetterProps> = (props) => (
  <path {...(props as React.SVGProps<SVGPathElement>)} d={F_path} />
);

const G_path = `M 100 28 C 100 -13 0 -13 0 50 C 0 113 100 113 100 72
         L 100 48 L 55 48 L 55 72 L 75 72 C 75 90 30 90 30 50
         C 30 10 75 5 75 28 L 100 28`;

export const G: React.FC<LetterProps> = (props) => (
  <path {...(props as React.SVGProps<SVGPathElement>)} d={G_path} />
);

const H_path = `M 0 0 L 20 0 L 20 40 L 80 40 L 80 0
               L 100 0 L 100 100 L 80 100 L 80 60
               L 20 60 L 20 100 L 0 100 L 0 0`;

export const H: React.FC<LetterProps> = (props) => (
  <path {...(props as React.SVGProps<SVGPathElement>)} d={H_path} />
);

const I_path = `M 40 0 L 60 0 L 60 100 L 40 100 L 40 0`;

export const I: React.FC<LetterProps> = (props) => (
  <path {...(props as React.SVGProps<SVGPathElement>)} d={I_path} />
);

const J_path = `M 0 60 C 0 111 100 111 100 60
         L 100 0 L 75 0 L 75 60
         C 80 90 20 90 25 60`;

export const J: React.FC<LetterProps> = (props) => (
  <path {...(props as React.SVGProps<SVGPathElement>)} d={J_path} />
);

const K_path = `M 0 0 L 20 0 L 20 40 L 75 0 L 100 0
               L 50 50 L 100 100 L 75 100 L 30 65
               L 20 75 L 20 100 L 0 100 L 0 0`;

export const K: React.FC<LetterProps> = (props) => (
  <path {...(props as React.SVGProps<SVGPathElement>)} d={K_path} />
);

const L_path = `M 0 0 L 0 100 L 100 100 L 100 80
               L 20 80 L 20 0 L 0 0`;

export const L: React.FC<LetterProps> = (props) => (
  <path {...(props as React.SVGProps<SVGPathElement>)} d={L_path} />
);

const M_path = `M 0 0 L 20 0 L 50 35 L 80 0 L 100 0 L 100 100
               L 80 100 L 80 30 L 50 65 L 20 30 L 20 100
               L 0 100 L 0 0`;

export const M: React.FC<LetterProps> = (props) => (
  <path {...(props as React.SVGProps<SVGPathElement>)} d={M_path} />
);

const N_path = `M 0 100 L 0 0 L 20 0 L 80 75 L 80 0
         L 100 0 L 100 100 L 80 100 L 20 25 L 20 100 L 0 100`;

export const N: React.FC<LetterProps> = (props) => (
  <path {...(props as React.SVGProps<SVGPathElement>)} d={N_path} />
);

export const O: React.FC<LetterProps> = (props) => (
  <g>
    <circle
      cx="50"
      cy="50"
      r="50"
      {...(props as React.SVGProps<SVGCircleElement>)}
    />
    <circle cx="50" cy="50" r="32" fill="#ffffff" />
  </g>
);

const P_path = `M 0 0 L 80 0 C 105 0 105 50 80 50
               L 20 50 L 20 100 L 0 100 L 0 0`;

export const P: React.FC<LetterProps> = (props) => (
  <g>
    <path {...(props as React.SVGProps<SVGPathElement>)} d={P_path} />
    <path
      fill="#ffffff"
      d="M 20 15 L 70 15 C 80 15 80 35 70 35 L 20 35 L 20 15"
    />
  </g>
);

const Q_path = `M 85 100 L 55 70 L 70 55 L 100 85 L 85 100`;

export const Q: React.FC<LetterProps> = (props) => (
  <g>
    <circle
      cx="50"
      cy="50"
      r="50"
      {...(props as React.SVGProps<SVGCircleElement>)}
    />
    <circle cx="50" cy="50" r="32" fill="#ffffff" />
    <path d={Q_path} {...(props as React.SVGProps<SVGPathElement>)} />
  </g>
);

const R_path = `M 0 0 L 80 0 C 105 0 105 50 80 50
                C 100 50 100 70 100 70 L 100 100 L 80 100
                L 80 80 C 80 80 80 60 50 60 L 20 60
                L 20 100 L 0 100 L 0 0`;

export const R: React.FC<LetterProps> = (props) => (
  <g>
    <path {...(props as React.SVGProps<SVGPathElement>)} d={R_path} />
    <path
      fill="#ffffff"
      d="M 20 15 L 70 15 C 80 15 80 35 70 35 L 20 35 L 20 15"
    />
  </g>
);

const S_path = `M92 26 A43 20 0 1 0 43 46 A42 23 0 1 1 9 68`;

export const S: React.FC<LetterProps> = ({ fill, fillOpacity }) => (
  <path
    fill="#ffffff"
    stroke={fill}
    strokeOpacity={fillOpacity}
    strokeWidth="18"
    d={S_path}
  />
);

const T_path = `M 0 0 L 0 20 L 35 20 L 35 100
         L 65 100 L 65 20 L 100 20
         L 100 0 L 0 0`;

export const T: React.FC<LetterProps> = (props) => (
  <path {...(props as React.SVGProps<SVGPathElement>)} d={T_path} />
);

const U_path = `M 0 0 L 0 60 C 0 111 100 111 100 60
         L 100 0 L 75 0 L 75 60
         C 80 90 20 90 25 60 L 25 0 L 0 0`;

export const U: React.FC<LetterProps> = (props) => (
  <path {...(props as React.SVGProps<SVGPathElement>)} d={U_path} />
);

const V_path = `M 0 0 L 20 0 L 50 80 L 80 0
               L 100 0 L 60 100 L 40 100 L 0 0`;

export const V: React.FC<LetterProps> = (props) => (
  <path {...(props as React.SVGProps<SVGPathElement>)} d={V_path} />
);

const W_path = `M 0 0 L 20 0 L 30 70 L 50 30 L 70 70 L 80 0
               L 100 0 L 90 100 L 70 100 L 50 65 L 30 100
               L 10 100 L 0 0`;

export const W: React.FC<LetterProps> = (props) => (
  <path {...(props as React.SVGProps<SVGPathElement>)} d={W_path} />
);

const X_path = `M 0 0 L 20 0 L 50 40 L 80 0 L 100 0 L 70 50
               L 100 100 L 80 100 L 50 60 L 20 100 L 0 100
               L 30 50 L 0 0`;

export const X: React.FC<LetterProps> = (props) => (
  <path {...(props as React.SVGProps<SVGPathElement>)} d={X_path} />
);

const Y_path = `M 0 0 L 20 0 L 50 45 L 80 0 L 100 0
               L 60 60 L 60 100 L 40 100 L 40 60 L 0 0`;

export const Y: React.FC<LetterProps> = (props) => (
  <path {...(props as React.SVGProps<SVGPathElement>)} d={Y_path} />
);

const Z_path = `M 0 0 L 100 0 L 100 20 L 35 80 L 100 80
               L 100 100 L 0 100 L 0 80 L 65 20 L 0 20
               L 0 0`;

export const Z: React.FC<LetterProps> = (props) => (
  <path {...(props as React.SVGProps<SVGPathElement>)} d={Z_path} />
);
