import { DragHandle } from "@mui/icons-material";
import { Box, Divider, useTheme } from "@mui/material";
import type { Direction, ResizablePanesProps } from "./types";
import { useResizablePanes } from "./useResizablePanes";
import { mediaWhere, perBreakpoint } from "./responsiveDirection";

/**
 * A resizable split-pane primitive. Renders two panes with a draggable divider
 * in row mode, and stacks them (hiding the divider) in column mode. The divider
 * supports pointer dragging and keyboard resizing (Arrow / Home / End).
 *
 * Orientation is driven entirely by CSS: a responsive `direction` compiles to
 * `@media` rules via MUI's `sx` cascade, so the correct layout is painted on the
 * first frame at every viewport — no post-mount measurement, no orientation
 * flash, and no server/client hydration mismatch. Only the drag position (`pct`)
 * is JS state, and it's already correct at first paint (it changes on drag only).
 *
 * Owns the outer grid, drag state, and collapse. For consumers that want the
 * split mechanics with their own layout, use the {@link useResizablePanes} hook
 * directly.
 */
export const ResizablePanes = ({
  first,
  second,
  direction = "row",
  initialPct = 50,
  min = 20,
  max = 80,
  collapsed,
  stackedCollapsed,
  rowHeight = "max(60vh, 600px)",
  columnHeight = "500px",
  gap = 2,
  dividerContent,
}: ResizablePanesProps) => {
  const theme = useTheme();
  const { pct, containerRef, dividerHandlers } = useResizablePanes(initialPct, min, max);

  // `theme.spacing(gap)` is stable across server/client, so interpolating it into
  // the responsive strings does not reintroduce a flash.
  const spacing = theme.spacing(gap);

  // Pane height follows orientation via CSS at every breakpoint (row → tall,
  // column → short), even when collapsed to a single pane.
  const paneHeight = perBreakpoint(direction, (d) => (d === "row" ? rowHeight : columnHeight));

  // Which pane is hidden at each breakpoint: `collapsed` side by side, and `stackedCollapsed` where it's
  // given once stacked. Like the orientation, it's all responsive `sx`, resolved at paint time. A collapse
  // side by side drops the divider and gives the other pane the whole width.
  const split = (d: Direction) => d === "row" && !collapsed;
  const tabbed = (d: Direction) => d === "column" && !!stackedCollapsed;
  // The divider is centered on `pct`, so the panes are equal at 50 and the divider stays under the pointer.
  const gridTemplateColumns = perBreakpoint(direction, (d) =>
    split(d) ? `calc(${pct}% - ${spacing} / 2) ${spacing} minmax(0, 1fr)` : "minmax(0, 1fr)"
  );
  const dividerDisplay = perBreakpoint(direction, (d) => (split(d) ? "flex" : "none"));
  // Shown one at a time, the stacked panes share a cell, the other only invisible there: it keeps its
  // size, so a table measures its rows and a plot its axes as though shown, and neither redraws on its
  // way back. Everything in it is hidden too, past anything that would show itself - a data grid's
  // column menu buttons, say. A pane collapsed otherwise is taken out of the layout.
  const stackedMedia = mediaWhere(direction, "column", theme.breakpoints);
  const paneSx = (pane: "first" | "second", column: 1 | 3) => ({
    minWidth: 0,
    height: paneHeight,
    gridColumn: perBreakpoint(direction, (d) => (split(d) ? column : tabbed(d) ? 1 : "auto")),
    gridRow: perBreakpoint(direction, (d) => (tabbed(d) ? 1 : "auto")),
    display: perBreakpoint(direction, (d) => (!tabbed(d) && collapsed === pane ? "none" : "block")),
    ...(stackedCollapsed === pane &&
      Object.fromEntries(
        stackedMedia.map((media) => [media, { visibility: "hidden", "& *": { visibility: "hidden !important" } }])
      )),
  });

  return (
    <Box ref={containerRef} display="grid" sx={{ gridTemplateColumns, rowGap: gap }}>
      {/*
        A collapsed pane stays mounted, hidden. Unmounting it would throw its state away - a table's
        filters, sort, grouping and scroll - and whatever reads from it (a plot drawn from the table's
        rows) would stop hearing from it until it came back.
      */}
      <Box sx={paneSx("first", 1)}>
        {first}
      </Box>

      {/* Always rendered; CSS-hidden in column (and collapsed) mode. `display:none`
          also drops it from the tab order and a11y tree, so no phantom separator
          is focusable or announced when stacked. */}
      <Box
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={min}
        aria-valuemax={max}
        tabIndex={0}
        {...dividerHandlers}
        sx={{
          display: dividerDisplay,
          alignItems: "center",
          justifyContent: "center",
          gridColumn: 2,
          cursor: "col-resize",
          height: paneHeight,
          outline: "none",
        }}
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
          {dividerContent ?? <DragHandle sx={{ transform: "rotate(90deg)", color: "divider" }} />}
        </Divider>
      </Box>

      <Box sx={paneSx("second", 3)}>
        {second}
      </Box>
    </Box>
  );
};

export default ResizablePanes;
