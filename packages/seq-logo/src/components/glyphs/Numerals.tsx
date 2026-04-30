import { LetterProps } from "./types";
export function N1(props: LetterProps) {
  return (
    <path
      {...(props as React.SVGProps<SVGPathElement>)}
      d="M 0 80 L 0 100 L 100 100 L 100 80 L 68 80 L 68 0 L 32 0 L 0 15 L 0 40 L 32 25 L 32 80 L 0 80"
    />
  );
}

export const N2: React.FC<LetterProps> = (props) => (
  <path
    {...(props as React.SVGProps<SVGPathElement>)}
    d="M 0 25 C 20 -8 80 -8 100 25 C 100 90 30 50 20 85 L 100 85 L 100 100 L 0 100 L 0 70 C 10 40 75 70 75 25 C 70 10 30 10 25 28 L 0 25"
  />
);

export const N3: React.FC<LetterProps> = (props) => (
  <path
    {...(props as React.SVGProps<SVGPathElement>)}
    d="M 0 35 L 0 25 C 20 -8 80 -8 100 25 C 100 30 100 50 75 50 C 100 50 100 70 100 75 C 80 108 20 108 0 75 L 0 65 L 25 65 L 25 75 C 30 88 70 88 75 75 C 75 68 75 65 47 58 L 47 42 C 75 32 75 35 75 25 C 70 12 30 12 25 25 L 25 35"
  />
);

export const N4: React.FC<LetterProps> = (props) => (
  <path
    {...(props as React.SVGProps<SVGPathElement>)}
    d="M 50 0 L 0 50 L 0 70 L 50 70 L 50 100 L 75 100 L 75 70 L 100 70 L 100 50 L 75 50 L 75 0 L 50 15 L 50 50 L 30 50 L 75 0 L 50 0"
  />
);

export const N5: React.FC<LetterProps> = (props) => (
  <path
    {...(props as React.SVGProps<SVGPathElement>)}
    d="M 95 20 L 100 0 L 10 0 L 0 60 L 25 60 C 30 45 90 50 75 77 C 66 87 30 90 26 72 L 0 80 C 20 110 80 110 100 70 C 100 25 10 25 25 40 L 30 20 L 95 20"
  />
);

export const N6: React.FC<LetterProps> = (props) => (
  <path
    {...(props as React.SVGProps<SVGPathElement>)}
    d="M 50 0 C -40 70 10 100 50 100 C 90 100 100 80 100 55 C 80 30 30 30 35 50 L 30 60 C 80 50 80 85 50 80 C 10 80 48 10 90 0 L 50 0"
  />
);

export const N7: React.FC<LetterProps> = (props) => (
  <path
    {...(props as React.SVGProps<SVGPathElement>)}
    d="M 0 0 L 100 0 L 50 100 L 20 100 L 60 20 L 0 20 L 0 0"
  />
);

export const N8: React.FC<LetterProps> = (props) => (
  <g>
    <path
      {...(props as React.SVGProps<SVGPathElement>)}
      d="M 0 35 L 0 25 C 20 -8 80 -8 100 25 C 100 30 100 50 75 50 C 100 50 100 70 100 75 C 80 108 20 108 0 75 L 0 65 L 25 65 L 25 75 C 30 88 70 88 75 75 C 75 68 75 65 47 58 L 47 42 C 75 32 75 35 75 25 C 70 12 30 12 25 25 L 25 35"
    />
    <path
      {...(props as React.SVGProps<SVGPathElement>)}
      d="M 100 35 L 100 25 C 80 -8 20 -8 0 25 C 0 30 0 50 25 50 C 0 50 0 70 0 75 C 20 108 80 108 100 75 L 100 65 L 75 65 L 75 75 C 70 88 30 88 25 75 C 25 68 25 65 53 58 L 53 42 C 25 32 25 35 25 25 C 30 12 70 12 75 25 L 75 35"
    />
  </g>
);

export const N9: React.FC<LetterProps> = (props) => (
  <path
    {...(props as React.SVGProps<SVGPathElement>)}
    d="M 50 100 C 140 30 90 0 50 0 C 10 0 0 20 0 45 C 20 70 70 70 65 50 L 70 40 C 20 50 20 15 50 20 C 90 20 52 90 10 100 L 50 100"
  />
);
