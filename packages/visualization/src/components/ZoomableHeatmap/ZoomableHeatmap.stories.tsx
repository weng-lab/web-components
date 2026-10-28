import { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useRef, useState } from "react";
import { Button, Stack } from "@mui/material";
import { expect, fn } from "storybook/test";
import { ZoomableHeatmap } from "./ZoomableHeatmap";
import type { ZoomableHeatmapCell, ZoomableHeatmapProps } from "./types";
import type { DownloadPlotHandle } from "../../utility";

/** mulberry32: the same data on every load. */
const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const CLASSES = ["CE", "Cer", "DG", "LPC", "PC", "PE", "PI", "PS", "SM", "TG"];
const SITES = 6;

/**
 * A lipidomics-like matrix, a column per sample: molecules in classes that rise or fall together by
 * the site a sample came from, z-scored per molecule, with the odd outlier.
 */
function lipidomics(samples: number, molecules: number) {
  const random = seeded(7);
  const gaussian = () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
  const classOf = (molecule: number) => Math.floor((molecule * CLASSES.length) / molecules);
  const rowNames = Array.from({ length: molecules }, (_, m) => {
    const chain = (n: number) => `${14 + ((m * n) % 9) * 2}:${(m * (n + 1)) % 6}`;
    return `${CLASSES[classOf(m)]} ${chain(3)}_${chain(5)}${m % 4 === 0 ? `;O${m % 3}` : ""}`;
  });
  const columnNames = Array.from({ length: samples }, (_, s) => `MOHD-${String.fromCharCode(65 + Math.floor((s * SITES) / samples))}${String(10000 + s * 7).slice(1)}`);
  const effect = CLASSES.map(() => Array.from({ length: SITES }, () => gaussian() * 1.2));
  const values = new Float32Array(samples * molecules);
  for (let s = 0; s < samples; s++) {
    const site = Math.floor((s * SITES) / samples);
    const shift = gaussian() * 0.3;
    for (let m = 0; m < molecules; m++) {
      const outlier = random() < 0.0005 ? gaussian() * 8 : 0;
      values[s * molecules + m] = effect[classOf(m)][site] + shift + gaussian() + outlier;
    }
  }
  for (let m = 0; m < molecules; m++) {
    let sum = 0, squares = 0;
    for (let s = 0; s < samples; s++) sum += values[s * molecules + m];
    const mean = sum / samples;
    for (let s = 0; s < samples; s++) squares += (values[s * molecules + m] - mean) ** 2;
    const sd = Math.sqrt(squares / samples) || 1;
    for (let s = 0; s < samples; s++) values[s * molecules + m] = (values[s * molecules + m] - mean) / sd;
  }
  return { values, rowNames, columnNames };
}

type DemoProps = Omit<ZoomableHeatmapProps, "values" | "rowNames" | "columnNames" | "selectedColumns"> & {
  samples: number;
  molecules: number;
  /** The samples selected to begin with. */
  initialSelection?: number[];
};

/**
 * The heatmap over generated data, with clicking a cell selecting its sample as MOHD's tables do.
 * The data goes in here rather than through args, which Storybook would serialize for its controls.
 */
const Demo = ({ samples, molecules, initialSelection = [], onCellClick, ...props }: DemoProps) => {
  const data = useMemo(() => lipidomics(samples, molecules), [samples, molecules]);
  const [selected, setSelected] = useState<number[]>(initialSelection);
  return (
    <ZoomableHeatmap
      {...data}
      {...props}
      selectedColumns={selected}
      onCellClick={(cell: ZoomableHeatmapCell) => {
        onCellClick?.(cell);
        setSelected((current) =>
          current.includes(cell.column) ? current.filter((column) => column !== cell.column) : [...current, cell.column]
        );
      }}
      tooltipBody={({ row, column, value }) => (
        <div>
          <div><strong>{data.columnNames[column]}</strong></div>
          <div>Molecule: {data.rowNames[row]}</div>
          <div>z-score: {value.toFixed(2)}</div>
        </div>
      )}
    />
  );
};

const meta = {
  title: "visualization/ZoomableHeatmap",
  component: Demo,
  parameters: {
    controls: { expanded: true },
  },
  args: {
    samples: 1800,
    molecules: 728,
    colors: ["#2166ac", "#f7f7f7", "#b2182b"],
    colorDomain: [-3, 3],
    xLabel: "Dataset",
    yLabel: "Molecule",
    scrollToSelection: true,
    legend: {
      kind: "diverging",
      format: (value: number) => value.toFixed(1),
      formatValue: (value: number) => value.toFixed(2),
      notes: ["Each molecule's values are z-scored across samples."],
    },
    onCellClick: fn(),
  },
  decorators: [
    // Mobile stories size to the device instead - see .storybook/preview.tsx
    (Story, { tags }) => tags.includes("mobile") ? <Story /> : (
      <div style={{ width: 960, height: 560 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** At MOHD's lipidomics size once it reaches 1,800 samples: about 1.3 million cells. */
export const Default: Story = {};

/** Today's 1,161 samples. */
export const CurrentLipidomics: Story = {
  args: { samples: 1161 },
};

/** Few enough cells to fit at full size: nothing to zoom. */
export const Small: Story = {
  args: { samples: 16, molecules: 12, colors: ["#20619e", "#fff36e", "#c92b16"] },
};

/** Samples selected side by side: zoomed out, their labels group under one "N selected". */
export const AdjacentSelection: Story = {
  args: { initialSelection: [400, 401, 402, 403, 404, 405, 900, 1500] },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("6 selected")).toBeInTheDocument();
    await expect(canvas.getByText("MOHD-D6300")).toBeInTheDocument();
  },
};

export const NoLegendOrTitles: Story = {
  args: { showLegend: false, xLabel: undefined, yLabel: undefined },
};

export const Mobile: Story = {
  tags: ["mobile", "!autodocs"],
  globals: { viewport: { value: "iphone14", isRotated: false } },
  decorators: [(Story) => <div style={{ height: 460 }}><Story /></div>],
};

/** Downloads are of the view as it is: zoom in, then download. */
export const Downloads: Story = {
  render: (args) => {
    const ref = useRef<DownloadPlotHandle>(null);
    return (
      <Stack height="100%">
        <Stack direction="row" gap={1}>
          <Button onClick={() => ref.current?.downloadSVG()}>Download SVG</Button>
          <Button onClick={() => ref.current?.downloadPNG()}>Download PNG</Button>
        </Stack>
        <div style={{ flexGrow: 1, minHeight: 0 }}>
          <Demo {...args} ref={ref} />
        </div>
      </Stack>
    );
  },
};
