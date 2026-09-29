import { useMemo, useState } from "react";
import { Button, Stack, Typography } from "@mui/material";
import { LicenseInfo } from "@mui/x-license";
import { Meta, StoryObj } from "@storybook/react-vite";
import { Table, TwoPaneLayout, useTablePlotSync, type SyncedTableProps } from "../..";

const meta = {
  title: "ui-components/TwoPaneLayout",
  parameters: {
    controls: { expanded: true },
  },
  decorators: [
    (Story) => {
      LicenseInfo.setLicenseKey(process.env.NEXT_PUBLIC_MUI_X_LICENSE_KEY as string);
      return <Story />;
    },
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type Sample = { sample_id: string; site: string; value: number };

const SITES = ["CCH", "CKD", "EXP"];

const makeRows = (count: number): Sample[] =>
  Array.from({ length: count }, (_, i) => ({
    sample_id: `S${String(i + 1).padStart(2, "0")}`,
    site: SITES[i % SITES.length],
    value: (i * 37) % 100,
  }));

const columns = [
  { field: "sample_id", headerName: "Sample" },
  { field: "site", headerName: "Site" },
  { field: "value", headerName: "Value", type: "number" as const },
];

/** Stands in for a plot: the rows it's handed, in order. */
const RowList = ({ rows }: { rows: Sample[] }) => (
  <Stack gap={0.5} p={1}>
    <Typography variant="subtitle2" data-testid="plot-count">
      The plot gets {rows.length} rows
    </Typography>
    <Typography variant="body2" data-testid="plot-rows">
      {rows.map((row) => row.sample_id).join(", ")}
    </Typography>
  </Stack>
);

/** A table component, as a page would have one: the hook's props, and its own columns. */
const SyncedTable = ({ tableProps, rows }: { tableProps: SyncedTableProps<Sample>; rows: Sample[] }) => (
  <Table {...tableProps} rows={rows} columns={columns} label="Samples" />
);

/**
 * A table beside the plot it feeds. Hiding the table ("Hide Table", top right of the table pane)
 * keeps it mounted: its filters, sort and selection are as they were when it's shown again, and the
 * plot keeps following it meanwhile - "Add rows" while it's hidden reaches the plot.
 */
export const HideTableKeepsState: Story = {
  render: () => {
    const [count, setCount] = useState(12);
    // Memoized: new rows every render would send the grid round its row sync, and back here, forever.
    const rows = useMemo(() => makeRows(count), [count]);
    const { sortedFilteredData, tableProps } = useTablePlotSync({
      rows,
      getRowId: (row) => row.sample_id,
      initialSort: [{ field: "sample_id", sort: "asc" }],
    });
    return (
      <Stack gap={1}>
        <Button variant="outlined" size="small" sx={{ alignSelf: "flex-start" }} onClick={() => setCount(count + 3)}>
          Add rows
        </Button>
        <TwoPaneLayout
          TableComponent={<SyncedTable tableProps={tableProps} rows={rows} />}
          plots={[{ tabTitle: "Plot", plotComponent: <RowList rows={sortedFilteredData} /> }]}
          rowHeight="500px"
        />
      </Stack>
    );
  },
};
