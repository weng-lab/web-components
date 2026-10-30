import {
  CloseFullscreenRounded,
  FullscreenExitRounded,
  FullscreenRounded,
  TableChartRounded,
} from "@mui/icons-material";
import { Stack, Box, Typography, Tab, IconButton, Tooltip, Button, useTheme } from "@mui/material";
import type { TabOwnProps } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { useEffect, useMemo, useRef, useState } from "react";
import DownloadModal from "./DownloadModal";
import FigurePanel from "./FigurePanel";
import { ResizablePanes } from "../ResizablePanes";
import { ScrollableTabs } from "../ScrollableTabs";
import { perBreakpoint } from "../ResizablePanes/responsiveDirection";
import type { TwoPaneLayoutProps } from "./types";

// Fixed pane-header height so the table header (40px icon buttons) and the tabs
// bar (MUI default 48px) line up, keeping the content below both panes aligned.
const HEADER_HEIGHT = "48px";
/** The gap under a header. */
const HEADER_GAP = "8px";

const TwoPaneLayout = ({
  TableComponent,
  plots,
  direction = "row",
  columnHeight = "500px",
  rowHeight = "max(60vh, 600px)",
  stackedLayout = "tabs",
  initialPct = 50,
  min = 20,
  max = 80,
  showTabLabels = false,
  onTabChange,
}: TwoPaneLayoutProps) => {
  const theme = useTheme();
  const [tab, setTab] = useState<number>(0);
  const [tableOpen, setTableOpen] = useState(true);
  // Whether the table's tab is the one open, where the stacked panes show as tabs.
  const [tableTab, setTableTab] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  // The layout's height on the page as it went full screen.
  const [placeHeight, setPlaceHeight] = useState<number>();
  const placeRef = useRef<HTMLDivElement>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // Full screen always stacks the panes as tabs, whatever the width, so the table is a tab away rather
  // than out of reach.
  const layoutDirection = fullscreen ? "column" : direction;
  const tabbed = stackedLayout === "tabs" || fullscreen;

  // Column-vs-row affordances (compact icon-only download, hidden tab labels) are
  // driven by CSS `@media` rules rather than a JS media query, so they paint
  // correctly on the first frame with no orientation flash. `column` → compact.
  const columnOnlyDisplay = perBreakpoint(direction, (d) => (d === "column" ? "inline-flex" : "none"));
  const rowOnlyDisplay = perBreakpoint(direction, (d) => (d === "column" ? "none" : "inline-flex"));
  const tabLabelDisplay = showTabLabels
    ? "inline"
    : perBreakpoint(direction, (d) => (d === "column" ? "none" : "inline"));
  // A tab showing only its icon doesn't need the room MUI keeps for a label, so more of them fit before they scroll.
  const iconOnlyTabSx = showTabLabels
    ? {}
    : {
        minWidth: perBreakpoint(direction, (d) => (d === "column" ? 0 : 90)),
        "& > .MuiTab-icon": { mr: perBreakpoint(direction, (d) => (d === "column" ? 0 : 1)) },
      };
  // Stacked as tabs, or full screen, one tab bar over both panes stands in for each pane's own header.
  const tabBarDisplay = perBreakpoint(layoutDirection, (d) => (tabbed && d === "column" ? "flex" : "none"));
  const paneHeaderDisplay = perBreakpoint(layoutDirection, (d) => (tabbed && d === "column" ? "none" : "flex"));

  const tabValue = Math.min(tab, plots.length - 1);
  const activePlot = plots[tabValue];
  const hasDownload = !!(
    activePlot?.onDownloadSVG ||
    activePlot?.onDownloadPNG ||
    activePlot?.dataDownloadLinks?.length
  );

  // Full screen pins the layout over the page, which mustn't scroll beneath it. Escape leaves it.
  useEffect(() => {
    if (!fullscreen) return;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) setFullscreen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      root.style.overflow = overflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [fullscreen]);

  const handleSetTab = (newTab: number) => {
    setTab(newTab);
    onTabChange?.(newTab);
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

  // From the plot pane's own header, full screen opens on the plot it was pressed beside.
  const fullscreenButton = (fromPlot: boolean) => (
    <Tooltip title={fullscreen ? "Exit Full Screen" : "Full Screen"}>
      <IconButton
        color="primary"
        aria-label={fullscreen ? "Exit full screen" : "Full screen"}
        onClick={() => {
          if (!fullscreen) {
            setPlaceHeight(placeRef.current?.offsetHeight);
            if (fromPlot) setTableTab(false);
          }
          setFullscreen(!fullscreen);
        }}
        sx={{ flexShrink: 0 }}
      >
        {fullscreen ? <FullscreenExitRounded /> : <FullscreenRounded />}
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

  const plotTab = (title: string, icon: TabOwnProps["icon"], value: number | "table") => (
    <Tab
      label={
        <Box component="span" sx={{ display: tabLabelDisplay }}>
          {title}
        </Box>
      }
      key={value}
      value={value}
      // Named for its title, which is hidden where tabs show only their icons.
      aria-label={title}
      icon={icon}
      iconPosition="start"
      sx={{ minHeight: "48px", ...iconOnlyTabSx }}
    />
  );

  // The stacked panes' tab bar, the table's tab first - see stackedLayout.
  const tabBar = (
    <Stack
      direction="row"
      alignItems="center"
      minHeight={HEADER_HEIGHT}
      mb={HEADER_GAP}
      sx={{ display: tabBarDisplay }}
    >
      <ScrollableTabs
        value={tableTab ? "table" : tabValue}
        onChange={(_, value: number | "table") => {
          setTableTab(value === "table");
          if (value !== "table" && value !== tabValue) handleSetTab(value);
        }}
        sx={{ flexGrow: 1 }}
      >
        {plotTab("Table", <TableChartRounded />, "table")}
        {plotTabs.map((tab, i) => plotTab(tab.tabTitle, tab.icon, i))}
      </ScrollableTabs>
      {!tableTab && hasDownload && downloadButton}
      {fullscreenButton(false)}
    </Stack>
  );

  // Table pane — header (title + hide toggle) stacked over the table content.
  const tablePane = (
    <Stack height="100%" gap={1}>
      <Stack direction="row" alignItems="center" gap={1} minHeight={HEADER_HEIGHT} sx={{ display: paneHeaderDisplay }}>
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
    <Stack height="100%" gap={1}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        minHeight={HEADER_HEIGHT}
        sx={{ display: paneHeaderDisplay }}
      >
        {!tableOpen && tableIconButton}
        <ScrollableTabs value={tabValue} onChange={(_, value) => handleSetTab(value)} sx={{ flexGrow: 1 }}>
          {plotTabs.map((tab, i) => plotTab(tab.tabTitle, tab.icon, i))}
        </ScrollableTabs>
        {hasDownload && downloadButton}
        {fullscreenButton(true)}
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

  // Full screen, the layout is pinned over the window in place, rather than moved into a dialog, so
  // nothing in it remounts: a plot keeps its zoom and the table its scroll.
  const paneColumnHeight = fullscreen ? `calc(100dvh - ${theme.spacing(2)})` : columnHeight;

  return (
    // Holds the layout's place on the page while it's pinned, so the page doesn't reflow beneath it -
    // and lose its scroll - on the way in or out. It also takes whatever margin a parent Stack gives
    // the layout, which would otherwise push the pinned layout down the window.
    <Box ref={placeRef} sx={{ height: fullscreen ? placeHeight : undefined }}>
      <Box
        sx={
          fullscreen
            ? {
                position: "fixed",
                inset: 0,
                zIndex: theme.zIndex.drawer,
                bgcolor: "background.paper",
                p: 1,
                // A scroller, so a swipe that runs off the end of a plot's or the table's own rows stops
                // here rather than scrolling the page beneath.
                overflow: "auto",
                overscrollBehavior: "contain",
              }
            : undefined
        }
      >
        {tabbed && tabBar}
        <ResizablePanes
          direction={layoutDirection}
          collapsed={tableOpen ? undefined : "first"}
          stackedCollapsed={tabbed ? (tableTab ? "second" : "first") : undefined}
          initialPct={initialPct}
          min={min}
          max={max}
          rowHeight={rowHeight}
          columnHeight={tabbed ? `calc(${paneColumnHeight} - ${HEADER_HEIGHT} - ${HEADER_GAP})` : paneColumnHeight}
          first={tablePane}
          second={plotPane}
        />
      </Box>
    </Box>
  );
};

export default TwoPaneLayout;
