import type { Meta, StoryObj } from "@storybook/react-vite";
import { A, C, G, T } from "../glyphs";
import {
  RawLogo,
  Logo,
  LogoWithNegatives,
  DNALogo,
  RNALogo,
  ProteinLogo,
} from "../../index";

const CTCF_PPM = [
  [0.09, 0.31, 0.08, 0.5],
  [0.18, 0.15, 0.45, 0.2],
  [0.3, 0.05, 0.49, 0.14],
  [0.06, 0.87, 0.02, 0.03],
  [0.0, 0.98, 0.0, 0.02],
  [0.81, 0.01, 0.07, 0.09],
  [0.04, 0.57, 0.36, 0.01],
  [0.11, 0.47, 0.05, 0.35],
  [0.93, 0.01, 0.03, 0.01],
  [0.0, 0.0, 0.99, 0.01],
  [0.36, 0.0, 0.64, 0.0],
  [0.05, 0.01, 0.55, 0.37],
  [0.03, 0.0, 0.97, 0.0],
  [0.06, 0.0, 0.85, 0.07],
  [0.11, 0.8, 0.0, 0.07],
  [0.4, 0.01, 0.55, 0.01],
  [0.09, 0.53, 0.33, 0.04],
  [0.12, 0.35, 0.08, 0.43],
  [0.44, 0.19, 0.29, 0.06],
];
const ALPHABET = [
  { component: [A, C], regex: ["A", "C"], color: ["red", "blue"] },
  { component: [C], regex: ["C"], color: ["blue"] },
  { component: [G], regex: ["G"], color: ["orange"] },
  { component: [T], regex: ["T"], color: ["#228b22"] },
  { component: [A], regex: ["A"], color: ["#aaaaaa"] },
  { component: [C], regex: ["C"], color: ["#aaaaaa"] },
  { component: [G], regex: ["G"], color: ["#aaaaaa"] },
  { component: [T], regex: ["T"], color: ["#aaaaaa"] },
];

const fasta_ALPHABET = [
  { component: [G], regex: ["G"], color: ["red"] },
  { component: [G], regex: ["G"], color: ["blue"] },
  { component: [A], regex: ["A"], color: ["orange"] },
  { component: [T], regex: ["T"], color: ["#228b22"] },
  { component: [C], regex: ["C"], color: ["#aaaaaa"] },
];
const PPM = [
  [1, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 0, 0],
  [1, 0, 0, 0, 0, 0, 0, 0],
  [0.5, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 0, 0, 0, 0, 0, 0],
  [1, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0.25, 0.25, 0.25, 0.25],
  [0, 0, 0, 0, 0.25, 0.25, 0.25, 0.25],
  [0, 0, 0, 0, 0.25, 0.25, 0.25, 0.25],
];
const NEG_PPM = [
  [1, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 0, 0],
  [1, 0, 0, 0, 0, 0, 0, 0],
  [-0.5, 0, 0, 0, 0, 0, 0, 0],
  [0, -1, 0, 0, 0, 0, 0, 0],
  [1, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, -0.25, 0.25, 0.25, 0.25],
  [0, 0, 0, 0, 0.25, 0.25, 0.25, 0.25],
  [0, 0, 0, 0, 0.25, 0.25, 0.25, 0.25],
];

const meta = {
  title: "seq-logo/Logo",
  component: Logo,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RawLogos: StoryObj<Meta<typeof RawLogo>> = {
  args: {
    glyphWidth: 100,
    stackHeight: 300,
    alphabet: ALPHABET,
    values: PPM,
  },
  render: (args) => (
    <svg width={300} viewBox={`0 0 ${PPM.length * 200 + 30} 1000`}>
      <RawLogo
        {...args}
        onSymbolClick={(s) => {
          console.log(s);
        }}
        onSymbolMouseOver={(s) => {
          console.log(s);
        }}
      />
    </svg>
  ),
};

export const Logos: Story = {
  args: {
    width: 500,
    height: 500,
    alphabet: ALPHABET,
    ppm: PPM,
  },
  render: (args) => (
    <Logo
      {...args}
      onSymbolClick={(s) => {
        console.log(s);
      }}
      onSymbolMouseOver={(s) => {
        console.log(s);
      }}
    />
  ),
};

export const LogosNegative: StoryObj<Meta<typeof LogoWithNegatives>> = {
  args: {
    negativealpha: 100,
    width: 500,
    height: 500,
    alphabet: ALPHABET,
    values: NEG_PPM,
  },
  render: (args) => (
    <LogoWithNegatives
      {...args}
      onSymbolClick={(s) => {
        console.log(s);
      }}
      onSymbolMouseOver={(s) => {
        console.log(s);
      }}
    />
  ),
};

export const LogosByFreq: Story = {
  args: {
    width: 500,
    height: 500,
    alphabet: ALPHABET,
    ppm: PPM,
    mode: "FREQUENCY",
  },
  render: (args) => <Logo {...args} />,
};

export const LogosByInformationContent: Story = {
  args: {
    width: 500,
    height: 500,
    alphabet: ALPHABET,
    ppm: PPM,
    mode: "INFORMATION CONTENT",
  },
  render: (args) => <Logo {...args} />,
};

export const DnaLogo: StoryObj<Meta<typeof DNALogo>> = {
  args: {
    width: 500,
    glyphWidth: 5,
    height: 500,
    ppm: [
      [0.8, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0.5, 0, 0.5],
      [0, 0, 1, 0],
    ],
  },
  render: (args) => <DNALogo {...args} />,
};

export const CTCFLogo: StoryObj<Meta<typeof DNALogo>> = {
  args: {
    ppm: CTCF_PPM,
    width: 500
  },
  render: (args) => <DNALogo {...args} />,
};

export const RnaLogo: StoryObj<Meta<typeof RNALogo>> = {
  args: {
    width: 500,
    glyphWidth: 5,
    height: 500,
    ppm: [
      [0, 0, 1, 0],
      [0, 0.8, 0, 0],
      [0, 1, 0, 0],
      [0, 0.5, 0, 0.5],
      [0, 0, 1, 0],
    ],
  },
  render: (args) => <RNALogo {...args} />,
};

export const ProteinLogos: StoryObj<Meta<typeof ProteinLogo>> = {
  args: {
    width: 500,
    glyphWidth: 5,
    height: 500,
    ppm: [
      [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0.8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0.5, 0, 0.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },
  render: (args) => <ProteinLogo {...args} />,
};

export const LogosByFastaNoFastaName: Story = {
  args: {
    width: 1500,
    noFastaNames: true,
    height: 500,
    mode: "FREQUENCY",
    alphabet: fasta_ALPHABET,
    fasta: `> 19082_AF115399
    GGATCGACCCTgtaagtttt
    > 45328_AB000381
    GCGCGCTCAGTgtaagtatc
    > 45328_AB000381
    AATCTCCATTCgtaagtacc`,
  },
  render: (args) => <Logo {...args} />,
};

export const LogosByFasta: Story = {
  args: {
    width: 1500,
    scale: 500,
    height: 500,
    mode: "FREQUENCY",
    alphabet: fasta_ALPHABET,
    fasta: `> 19082_AF115399
    GGATCGACCCTgtaagtttt
   `,
  },
  render: (args) => <Logo {...args} />,
};

export const DNALogoFASTA: Story = {
  args: {
    width: 1500,
    height: 500,
    alphabet: ALPHABET,
    fasta: `> 19082_AF115399
GGATCGACCCT
> 45328_AB000381
GCGCGCTCAGT
> 45328_AB000381
AATCTCCATTC`,
  },
  render: (args) => <DNALogo {...args} />,
};

export const EmbedDNALogo: StoryObj<Meta<typeof DNALogo>> = {
  args: {
    width: 500,
    glyphWidth: 5,
    height: 500,
    ppm: [
      [0.8, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0.5, 0, 0.5],
      [0, 0, 1, 0],
    ],
  },
  render: (args) => <DNALogo {...args} />,
};

export const EmbedRNALogo: StoryObj<Meta<typeof RNALogo>> = {
  args: {
    width: 500,
    glyphWidth: 5,
    height: 500,
    ppm: [
      [0, 0, 1, 0],
      [0, 0.8, 0, 0],
      [0, 1, 0, 0],
      [0, 0.5, 0, 0.5],
      [0, 0, 1, 0],
    ],
  },
  render: (args) => <RNALogo {...args} />,
};

export const EmbedProteinLogo: StoryObj<Meta<typeof ProteinLogo>> = {
  args: {
    width: 500,
    glyphWidth: 5,
    height: 500,
    ppm: [
      [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0.8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0.5, 0, 0.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },
  render: (args) => <ProteinLogo {...args} />,
};

export const EmbedRawLogo: StoryObj<Meta<typeof RawLogo>> = {
  args: {
    glyphWidth: 100,
    stackHeight: 300,
    alphabet: ALPHABET,
    values: PPM,
  },
  render: (args) => (
    <svg width={300} viewBox={`0 0 ${PPM.length * 200 + 30} 1000`}>
      <RawLogo {...args} />
    </svg>
  ),
};

export const EmbedLogo: Story = {
  args: {
    width: 500,
    height: 500,
    alphabet: ALPHABET,
    ppm: PPM,
  },
  render: (args) => <Logo {...args} />,
};

export const EmbedLogoWithNegatives: StoryObj<Meta<typeof LogoWithNegatives>> =
  {
    args: {
      negativealpha: 100,
      width: 500,
      height: 500,
      alphabet: ALPHABET,
      values: NEG_PPM,
    },
    render: (args) => <LogoWithNegatives {...args} />,
  };
