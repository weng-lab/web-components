import { Chip, Stack, Typography } from "@mui/material";
import { LicenseInfo } from "@mui/x-license";
import type { GridInitialState } from "@mui/x-data-grid-premium";
import { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Table } from "../..";
import { useTablePlotSync } from "./useTablePlotSync";
import type { TableFilters } from "./useTableFilters";

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

/** The status column as a singleSelect, filtered with "not" where site, a text column, takes "doesNotEqual". */
const chipColumns = [
  ...columns.filter(({ field }) => field !== "status"),
  { field: "status", headerName: "Status", type: "singleSelect" as const, valueOptions: STATUSES },
];

/** Stands in for a plot's chip legend: a chip per value, switched off where the table filters it out. */
const Chips = ({ filters, column, values }: { filters: TableFilters; column: string; values: string[] }) => {
  const hidden = filters.excluded(column, values);
  return (
    <Stack direction="row" gap={1}>
      {values.map((value) => (
        <Chip
          key={value}
          label={value}
          size="small"
          variant={hidden.has(value) ? "outlined" : "filled"}
          aria-pressed={!hidden.has(value)}
          onClick={() => filters.toggle(column, value, values)}
          sx={{ textDecoration: hidden.has(value) ? "line-through" : "none" }}
        />
      ))}
    </Stack>
  );
};

const FilteredTable = () => {
  const { filters, tableProps } = useTablePlotSync({ rows, getRowId: (row) => row.sample_id });
  return (
    <Stack direction="row" gap={3} height={500}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Table {...tableProps} rows={rows} columns={chipColumns} label="Samples" />
      </div>
      <Stack gap={1} minWidth={220}>
        <Chips filters={filters} column="site" values={SITES} />
        <Chips filters={filters} column="status" values={STATUSES} />
        <Typography variant="subtitle2" data-testid="listed-count">
          {rows.filter((row) => filters.isListed(row.sample_id)).length} of {rows.length} rows listed
        </Typography>
        {rows.map((row) => (
          <Typography
            key={row.sample_id}
            variant="body2"
            color={filters.isListed(row.sample_id) ? "text.primary" : "text.disabled"}
          >
            {row.sample_id} · {row.site} · {row.status}
          </Typography>
        ))}
      </Stack>
    </Stack>
  );
};

/**
 * Chips read and write the table's filters: a chip clicked filters its value out of its column, a
 * filter made in the table switches its chips off, and the plot dims every row the table filters out,
 * whether by a chip's column, any other, or the search.
 */
export const ChipFilters: Story = {
  render: () => <FilteredTable />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const listed = () => canvas.getByTestId("listed-count");
    await waitFor(() => expect(listed()).toHaveTextContent("12 of 12 rows listed"));

    await userEvent.click(canvas.getByRole("button", { name: "CCH" }));
    await waitFor(() => expect(listed()).toHaveTextContent("8 of 12 rows listed"));
    await expect(canvas.getByRole("button", { name: "CCH" })).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(canvas.getByRole("button", { name: "case" }));
    await waitFor(() => expect(listed()).toHaveTextContent("4 of 12 rows listed"));

    await userEvent.click(canvas.getByRole("button", { name: "CCH" }));
    await userEvent.click(canvas.getByRole("button", { name: "case" }));
    await waitFor(() => expect(listed()).toHaveTextContent("12 of 12 rows listed"));
  },
};
