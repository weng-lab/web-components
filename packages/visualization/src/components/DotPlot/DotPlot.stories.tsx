import { Meta, StoryObj } from "@storybook/react-vite";
import DotPlot from "./dotplot";
import { DotPlotData } from "./types";

const meta = {
  title: "visualization/DotPlot",
  component: DotPlot,
  tags: ["autodocs"],
  parameters: {
    controls: { expanded: true },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 900, height: 400 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DotPlot>;

export default meta;
type Story = StoryObj<typeof meta>;

const genes = ["ACTB", "CD4", "CD8A", "FOXP3", "GATA3", "IL2RA", "MKI67", "PDCD1", "TNF", "TRAC"];
const datasets = ["Disease A", "Disease B", "control", "Dataset X", "Dataset Y"];

const sampleData: DotPlotData[] = genes.flatMap((gene) =>
  datasets.map((dataset) => ({
    x: gene,
    y: dataset,
    radius: Math.random(),
    color: Math.random() * 5,
  }))
);

const degData: DotPlotData[] = genes.flatMap((gene) =>
  datasets.map((dataset) => ({
    x: gene,
    y: dataset,
    radius: Math.random(),
    color: (Math.random() - 0.5) * 4,
  }))
);

const highlightedData: DotPlotData[] = sampleData.map((d) => ({
  ...d,
  highlighted: d.x === "FOXP3",
}));

export const Default: Story = {
  args: {
    data: sampleData,
    xTickFontStyle: "italic",
    radiusTitle: "Percent Expressed",
    colorTitle: "Mean Expression",
  },
};

export const SingleDataset: Story = {
  args: {
    data: genes.map((gene) => ({
      x: gene,
      y: "Disease A",
      radius: Math.random(),
      color: Math.random() * 5,
    })),
    xTickFontStyle: "italic",
  },
  decorators: [
    (Story) => (
      <div style={{ width: 900, height: 250 }}>
        <Story />
      </div>
    ),
  ],
};

export const DEGMode: Story = {
  args: {
    data: degData,
    deg: true,
    xTickFontStyle: "italic",
    radiusTitle: "-log₁₀(P adj)",
    colorTitle: "log₂(Fold Change)",
    showTooltipData: true,
  },
};

export const WithHighlights: Story = {
  args: {
    data: highlightedData,
    xTickFontStyle: "italic",
  },
};

export const CellTypeAxis: Story = {
  args: {
    data: ["T cell", "B cell", "NK cell", "Monocyte", "Dendritic cell"].flatMap((celltype) =>
      ["GENE1", "GENE2"].map((gene) => ({
        x: celltype,
        y: gene,
        radius: Math.random(),
        color: Math.random() * 3,
      }))
    ),
    xTickFontStyle: "normal",
  },
};

export const LabelsRight: Story = {
  args: {
    data: sampleData,
    xTickFontStyle: "italic",
    yLabelsRight: true,
    yAxisLabel: "APOE",
  },
  decorators: [
    (Story) => (
      <div style={{ width: 900, height: 400 }}>
        <Story />
      </div>
    ),
  ],
};

// Manually sized plot. Container is 1100x700 with a dashed border - the plot
// should render at the fixed 500x350 size below, ignoring the container size.
export const ManualSize: Story = {
  args: {
    data: sampleData,
    xTickFontStyle: "italic",
    width: 500,
    height: 350,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 1100, height: 700, border: "2px dashed #999" }}>
        <Story />
      </div>
    ),
  ],
};
