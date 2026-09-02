import { CloseFullscreenRounded, TableChartRounded } from "@mui/icons-material";
import { Stack, Box, Typography, Tabs, Tab, IconButton, Tooltip, Button } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { useMemo, useState } from "react";
import DownloadModal from "./DownloadModal";
import FigurePanel from "./FigurePanel";
import { ResizablePanes } from "../ResizablePanes";
import { perBreakpoint } from "../ResizablePanes/responsiveDirection";
import type { TwoPaneLayoutProps } from "./types";

// Fixed pane-header height so the table header (40px icon buttons) and the tabs
// bar (MUI default 48px) line up, keeping the content below both panes aligned.
const HEADER_HEIGHT = "48px";

const TwoPaneLayout = ({
  TableComponent,
  plots,
  direction = "row",
  columnHeight = "500px",
  rowHeight = "max(60vh, 600px)",
  initialPct = 50,
  min = 20,
  max = 80,
}: TwoPaneLayoutProps) => {
  const [tab, setTab] = useState<number>(0);
  const [tableOpen, setTableOpen] = useState(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // Column-vs-row affordances (compact icon-only download, hidden tab labels) are
  // driven by CSS `@media` rules rather than a JS media query, so they paint
  // correctly on the first frame with no orientation flash. `column` → compact.
  const columnOnlyDisplay = perBreakpoint(direction, (d) => (d === "column" ? "inline-flex" : "none"));
  const rowOnlyDisplay = perBreakpoint(direction, (d) => (d === "column" ? "none" : "inline-flex"));
  const tabLabelDisplay = perBreakpoint(direction, (d) => (d === "column" ? "none" : "inline"));

  const tabValue = Math.min(tab, plots.length - 1);
  const activePlot = plots[tabValue];
  const hasDownload = !!(
    activePlot?.onDownloadSVG ||
    activePlot?.onDownloadPNG ||
    activePlot?.dataDownloadLinks?.length
  );

  const handleSetTab = (newTab: number) => {
    setTab(newTab);
  };

  const handleToggleTable = () => {
    setTableOpen(!tableOpen);
  };

  const handleOpenDownload = () => {
    if (hasDownload) {
      setModalOpen(true);
    }
  };

  const plotTabs = useMemo(() => plots.map((x) => ({ tabTitle: x.tabTitle, icon: x.icon })), [plots]);

  const figures = useMemo(
    () =>
      plots.map((x) => ({
        title: x.tabTitle,
        component: x.plotComponent,
      })),
    [plots]
  );

  const tableIconButton = (
    <Tooltip title={`${tableOpen ? "Hide" : "Show"} Table`}>
      <IconButton onClick={handleToggleTable} sx={{ marginLeft: -1, marginRight: tableOpen ? -1 : 0 }}>
        <TableChartRounded color="primary" fontSize="small" />
      </IconButton>
    </Tooltip>
  );

  const hideTableButton = (
    <Tooltip title="Hide Table">
      <IconButton onClick={handleToggleTable} sx={{ mx: -1 }}>
        <CloseFullscreenRounded color="primary" />
      </IconButton>
    </Tooltip>
  );

  // Both controls are always rendered; CSS shows the icon-only button at column
  // breakpoints and the text button at row breakpoints (no first-paint flash).
  const downloadButton = (
    <>
      <IconButton
        color="primary"
        aria-label="download"
        size="small"
        onClick={handleOpenDownload}
        sx={{ display: columnOnlyDisplay }}
      >
        <DownloadIcon />
      </IconButton>
      <Button
        variant="text"
        startIcon={<DownloadIcon />}
        onClick={handleOpenDownload}
        sx={{ flexShrink: 0, display: rowOnlyDisplay }}
      >
        Download
      </Button>
    </>
  );

  // Table pane — header (title + hide toggle) stacked over the table content.
  const tablePane = (
    <Stack height="100%" spacing={1}>
      <Stack direction="row" alignItems="center" gap={1} minHeight={HEADER_HEIGHT}>
        {tableIconButton}
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Table View
        </Typography>
        {hideTableButton}
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0 }}>{TableComponent}</Box>
    </Stack>
  );

  // Plot pane — tabs bar (+ download) stacked over the figure content.
  const plotPane = (
    <Stack height="100%" spacing={1}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" minHeight={HEADER_HEIGHT}>
        {!tableOpen && tableIconButton}
        <Tabs
          value={tabValue}
          variant="scrollable"
          onChange={(_, value) => handleSetTab(value)}
          sx={{ flexGrow: 1, "& .MuiTabs-scrollButtons.Mui-disabled": { opacity: 0.3 } }}
        >
          {plotTabs.map((tab, i) => (
            <Tab
              label={
                <Box component="span" sx={{ display: tabLabelDisplay }}>
                  {tab.tabTitle}
                </Box>
              }
              key={i}
              icon={tab.icon}
              iconPosition="start"
              sx={{ minHeight: "48px" }}
            />
          ))}
        </Tabs>
        {hasDownload && downloadButton}
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0, minWidth: 0 }}>
        <FigurePanel value={tabValue} figures={figures} />
        {modalOpen && (
          <DownloadModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onDownloadSVG={activePlot?.onDownloadSVG}
            onDownloadPNG={activePlot?.onDownloadPNG}
            dataDownloadLinks={activePlot?.dataDownloadLinks}
            plotTitle={activePlot?.tabTitle}
          />
        )}
      </Box>
    </Stack>
  );

  return (
    <ResizablePanes
      direction={direction}
      collapsed={tableOpen ? undefined : "first"}
      initialPct={initialPct}
      min={min}
      max={max}
      rowHeight={rowHeight}
      columnHeight={columnHeight}
      first={tablePane}
      second={plotPane}
    />
  );
};

export default TwoPaneLayout;
