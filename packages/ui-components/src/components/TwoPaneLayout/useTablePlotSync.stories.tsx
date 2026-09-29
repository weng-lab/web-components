import { Stack, Typography } from "@mui/material";
import { LicenseInfo } from "@mui/x-license";
import type { GridInitialState } from "@mui/x-data-grid-premium";
import { Meta, StoryObj } from "@storybook/react-vite";
import { Table } from "../..";
import { useTablePlotSync } from "./useTablePlotSync";

const meta = {
  title: "ui-components/TwoPaneLayout/useTablePlotSync",
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

type Sample = { sample_id: string; site: string; status: string };

const SITES = ["CCH", "CKD", "EXP"];
const STATUSES = ["case", "control"];

const rows: Sample[] = Array.from({ length: 12 }, (_, i) => ({
  sample_id: `S${String(i + 1).padStart(2, "0")}`,
  site: SITES[i % SITES.length],
  status: STATUSES[i % STATUSES.length],
}));

const columns = [
  { field: "sample_id", headerName: "Sample" },
  { field: "site", headerName: "Site" },
  { field: "status", headerName: "Status" },
];

/** Stands in for a plot: the rows it's handed, in order, and which are selected. */
const SyncedRows = ({ rows, selected }: { rows: Sample[]; selected: Sample[] }) => (
  <Stack gap={0.5} minWidth={220}>
    <Typography variant="subtitle2" data-testid="synced-count">
      The plot gets {rows.length} rows
    </Typography>
    <Typography variant="body2" data-testid="synced-selected">
      Selected: {selected.map((row) => row.sample_id).join(", ") || "none"}
    </Typography>
    {rows.map((row, i) => (
      <Typography key={i} variant="body2" data-testid="synced-row">
        {row.sample_id === undefined ? "(not a sample)" : `${row.sample_id} · ${row.site} · ${row.status}`}
      </Typography>
    ))}
  </Stack>
);

const SyncedTable = ({ initialState }: { initialState?: GridInitialState }) => {
  const { selected, sortedFilteredData, tableProps } = useTablePlotSync({ rows, getRowId: (row) => row.sample_id });
  return (
    <Stack direction="row" gap={3} height={500}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Table {...tableProps} rows={rows} columns={columns} label="Samples" initialState={initialState} />
      </div>
      <SyncedRows rows={sortedFilteredData} selected={selected} />
    </Stack>
  );
};

/** The plot gets the table's rows in its order, following its sort and filters. */
export const SyncedRowOrder: Story = {
  render: () => <SyncedTable />,
};

/**
 * Grouped by site, the plot still gets only the samples - in the grouped order, including those in
 * collapsed groups - and none of the rows the grid adds to head each group. A group's checkbox
 * selects and deselects its samples, and reads checked once all of them are selected.
 */
export const GroupedRows: Story = {
  render: () => <SyncedTable initialState={{ rowGrouping: { model: ["site"] } }} />,
};
