import { useMemo, useState } from "react";
import { BarChart, ScatterPlot } from "@mui/icons-material";
import { Button, Stack, Typography } from "@mui/material";
import { LicenseInfo } from "@mui/x-license";
import type { GridFilterModel } from "@mui/x-data-grid-premium";
import { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Table, TwoPaneLayout, useTablePlotSync, withExcludedValues, type SyncedTableProps } from "../..";

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

/** The model with the site column filtered down to one site, the other columns' filters kept. */
const onlySite = (model: GridFilterModel, site: string) =>
  withExcludedValues(model, "site", new Set(SITES.filter((other) => other !== site)), SITES);

const siteRows = makeRows(12);

/**
 * A tab per site, and a table that follows them: switching tabs reports the new one through
 * `onTabChange`, which filters the table's site column down to that tab's site, keeping any other
 * filters. The layout opens on the first tab, unreported, so the table starts filtered to its site.
 */
export const TabFiltersTable: Story = {
  render: () => {
    const { sortedFilteredData, tableProps, filters } = useTablePlotSync({
      rows: siteRows,
      getRowId: (row) => row.sample_id,
      initialSort: [{ field: "sample_id", sort: "asc" }],
      initialFilters: onlySite({ items: [] }, SITES[0]),
    });
    return (
      <TwoPaneLayout
        TableComponent={<SyncedTable tableProps={tableProps} rows={siteRows} />}
        plots={SITES.map((site) => ({
          tabTitle: `Site: ${site}`,
          plotComponent: <RowList rows={sortedFilteredData} />,
        }))}
        onTabChange={(index) => filters.setModel((model) => onlySite(model, SITES[index]))}
        rowHeight="500px"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // A tab once visited stays mounted, hidden: the plot on screen is the one with a layout box.
    const shownPlot = () => canvas.getAllByTestId("plot-rows").find((rows) => rows.offsetParent !== null);
    await waitFor(() => expect(shownPlot()).toHaveTextContent("S01, S04, S07, S10"));

    await userEvent.click(canvas.getByRole("tab", { name: "Site: CKD" }));
    await waitFor(() => expect(shownPlot()).toHaveTextContent("S02, S05, S08, S11"));

    await userEvent.click(canvas.getByRole("tab", { name: "Site: CCH" }));
    await waitFor(() => expect(shownPlot()).toHaveTextContent("S01, S04, S07, S10"));
  },
};

/**
 * Stacked, as on a phone, the table is a tab before the plots' rather than a pane over them, and the
 * layout opens on the first plot. Full screen pins whichever tab is open over the page.
 */
export const StackedAsTabs: Story = {
  tags: ["mobile", "!autodocs"],
  globals: { viewport: { value: "iphone14", isRotated: false } },
  render: () => {
    const { sortedFilteredData, tableProps } = useTablePlotSync({
      rows: siteRows,
      getRowId: (row) => row.sample_id,
      initialSort: [{ field: "sample_id", sort: "asc" }],
    });
    return (
      <TwoPaneLayout
        direction="column"
        TableComponent={<SyncedTable tableProps={tableProps} rows={siteRows} />}
        plots={[
          { tabTitle: "Bar Plot", icon: <BarChart />, plotComponent: <RowList rows={sortedFilteredData} /> },
          { tabTitle: "UMAP", icon: <ScatterPlot />, plotComponent: <RowList rows={sortedFilteredData} /> },
        ]}
        columnHeight="460px"
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The tab not open is only invisible, so it's told apart by its visibility rather than its layout box.
    const shown = (el: HTMLElement | undefined) => !!el && el.checkVisibility({ visibilityProperty: true });
    const plot = () => canvas.getAllByTestId("plot-rows").find(shown);

    // Opens on the first plot, the table's tab beside it.
    await waitFor(() => expect(plot()).toBeDefined());
    expect(canvas.getByRole("tab", { name: "Bar Plot" })).toHaveAttribute("aria-selected", "true");
    expect(shown(canvas.queryByRole("grid") ?? undefined)).toBe(false);

    await userEvent.click(canvas.getByRole("tab", { name: "Table" }));
    await waitFor(() => expect(shown(canvas.getByRole("grid"))).toBe(true));
    expect(plot()).toBeUndefined();

    await userEvent.click(canvas.getByRole("tab", { name: "Bar Plot" }));
    await waitFor(() => expect(plot()).toBeDefined());

    // Full screen pins the layout over the window, and leaves it where it was on the way out.
    const pinned = () => {
      let el: HTMLElement | null = canvas.getByRole("tablist");
      while (el && getComputedStyle(el).position !== "fixed") el = el.parentElement;
      return el;
    };
    await userEvent.click(canvas.getByRole("button", { name: "Full screen" }));
    await waitFor(() => expect(pinned()).not.toBeNull());
    await userEvent.click(canvas.getByRole("button", { name: "Exit full screen" }));
    await waitFor(() => expect(pinned()).toBeNull());
  },
};
