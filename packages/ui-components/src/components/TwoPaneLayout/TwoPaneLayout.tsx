import { CloseFullscreenRounded, DragHandle, TableChartRounded } from "@mui/icons-material";
import {
  Stack,
  Box,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Button,
  useMediaQuery,
  useTheme,
  Divider,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import React, { useMemo, useRef, useState } from "react";
import DownloadModal from "./DownloadModal";
import FigurePanel from "./FigurePanel";
import type { Direction, ResponsiveDirection, TwoPaneLayoutProps } from "./types";

function useResolvedDirection(direction: ResponsiveDirection): Direction {
  const theme = useTheme();

  const matches = {
    xs: useMediaQuery(theme.breakpoints.up("xs")),
    sm: useMediaQuery(theme.breakpoints.up("sm")),
    md: useMediaQuery(theme.breakpoints.up("md")),
    lg: useMediaQuery(theme.breakpoints.up("lg")),
    xl: useMediaQuery(theme.breakpoints.up("xl")),
  };

  if (typeof direction === "string") return direction;

  for (const bp of ["xl", "lg", "md", "sm", "xs"] as const) {
    if (matches[bp] && direction[bp]) return direction[bp];
  }

  return "column";
}

const TwoPaneLayout = ({ TableComponent, plots, direction = "row" }: TwoPaneLayoutProps) => {
  const [tab, setTab] = useState<number>(0);
  const [tableOpen, setTableOpen] = useState(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [leftPct, setLeftPct] = useState(40);
  const containerRef = useRef<HTMLDivElement>(null);

  const resolvedDirection = useResolvedDirection(direction);
  const isColumn = resolvedDirection === "column";

  const tabValue = Math.min(tab, plots.length - 1);
  const activePlot = plots[tabValue];
  const hasDownload = !!(activePlot?.onDownloadSVG || activePlot?.onDownloadPNG);
  const paneHeight = isColumn ? "500px" : "max(60vh, 600px)";

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
      <IconButton onClick={handleToggleTable} sx={{ mx: -1 }}>
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

  const downloadButton = isColumn ? (
    <IconButton color="primary" aria-label="download" size="small" onClick={handleOpenDownload}>
      <DownloadIcon />
    </IconButton>
  ) : (
    <Button variant="text" startIcon={<DownloadIcon />} onClick={handleOpenDownload} sx={{ flexShrink: 0 }}>
      Download
    </Button>
  );

  const handleDividerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleDividerPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const newPct = ((e.clientX - rect.left) / rect.width) * 100;
    setLeftPct(Math.min(70, Math.max(15, newPct)));
  };

  const handleDividerPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <Box
      ref={containerRef}
      display="grid"
      gridTemplateColumns={
        !isColumn && tableOpen
          ? (theme) => `${leftPct}% ${theme.spacing(2)} minmax(0, 1fr)`
          : "minmax(0, 1fr)"
      }
      gridTemplateRows={isColumn && tableOpen ? "auto auto auto auto" : "auto 1fr"}
      rowGap={1}
      columnGap={!isColumn && tableOpen ? 0 : 2}
    >
      {/* Table header — row 1 at all breakpoints */}
      <Stack
        display={tableOpen ? "flex" : "none"}
        direction="row"
        alignItems="center"
        gap={1}
        gridRow={1}
        gridColumn={1}
      >
        {tableIconButton}
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Table View
        </Typography>
        {hideTableButton}
      </Stack>

      {/* Divider — only visible in row direction when table is open */}
      {tableOpen && !isColumn && (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          gridRow="1 / 3"
          gridColumn={2}
          sx={{ cursor: "col-resize" }}
          onPointerDown={handleDividerPointerDown}
          onPointerMove={handleDividerPointerMove}
          onPointerUp={handleDividerPointerUp}
        >
          <Divider
            orientation="vertical"
            flexItem
            sx={{
              "& .MuiDivider-wrapperVertical": {
                padding: 0,
                display: "flex",
              },
              mx: "auto",
            }}
          >
            <DragHandle sx={{ transform: "rotate(90deg)", color: "divider" }} />
          </Divider>
        </Box>
      )}

      {/* Tabs header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gridRow={isColumn && tableOpen ? 3 : 1}
        gridColumn={!isColumn && tableOpen ? 3 : 1}
      >
        {!tableOpen && tableIconButton}
        <Tabs
          value={tabValue}
          variant="scrollable"
          onChange={(_, value) => handleSetTab(value)}
          sx={{ flexGrow: 1, "& .MuiTabs-scrollButtons.Mui-disabled": { opacity: 0.3 } }}
        >
          {plotTabs.map((tab, i) => (
            <Tab
              label={isColumn ? "" : tab.tabTitle}
              key={i}
              icon={tab.icon}
              iconPosition="start"
              sx={{ minHeight: "48px" }}
            />
          ))}
        </Tabs>
        {hasDownload && downloadButton}
      </Stack>

      {/* Table content — row 2 */}
      <Box display={tableOpen ? "block" : "none"} gridRow={2} gridColumn={1} height={paneHeight}>
        {TableComponent}
      </Box>

      {/* Plot content */}
      <Box
        gridRow={isColumn && tableOpen ? 4 : 2}
        gridColumn={!isColumn && tableOpen ? 3 : 1}
        height={paneHeight}
        minWidth={0}
      >
        <FigurePanel value={tabValue} figures={figures} />
        {modalOpen && (
          <DownloadModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onDownloadSVG={activePlot?.onDownloadSVG}
            onDownloadPNG={activePlot?.onDownloadPNG}
            plotTitle={activePlot?.tabTitle}
          />
        )}
      </Box>
    </Box>
  );
};

export default TwoPaneLayout;
