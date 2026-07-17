import { DragHandle } from "@mui/icons-material";
import { Box, Divider, useTheme } from "@mui/material";
import type { ResizablePanesProps } from "./types";
import { useResizablePanes } from "./useResizablePanes";
import { perBreakpoint } from "./responsiveDirection";

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
  rowHeight = "max(60vh, 600px)",
  columnHeight = "500px",
  gap = 2,
  dividerContent,
}: ResizablePanesProps) => {
  const theme = useTheme();
  const { pct, containerRef, dividerHandlers } = useResizablePanes(initialPct, min, max);

  const showFirst = collapsed !== "first";
  const showSecond = collapsed !== "second";
  const isCollapsed = !showFirst || !showSecond;

  // `theme.spacing(gap)` is stable across server/client, so interpolating it into
  // the responsive strings does not reintroduce a flash.
  const spacing = theme.spacing(gap);

  // Pane height follows orientation via CSS at every breakpoint (row → tall,
  // column → short), even when collapsed to a single pane.
  const paneHeight = perBreakpoint(direction, (d) => (d === "row" ? rowHeight : columnHeight));

  // When a pane is collapsed the layout is a static single column, known at SSR
  // (it's a JS prop, not viewport-derived) — so it overrides the responsive grid
  // and is itself flash-free. Otherwise the grid, divider visibility, and pane
  // placement are all responsive `sx` objects that resolve at paint time.
  const gridTemplateColumns = isCollapsed
    ? "minmax(0, 1fr)"
    : perBreakpoint(direction, (d) => (d === "row" ? `${pct}% ${spacing} minmax(0, 1fr)` : "minmax(0, 1fr)"));
  const dividerDisplay = isCollapsed ? "none" : perBreakpoint(direction, (d) => (d === "row" ? "flex" : "none"));
  const firstGridColumn = isCollapsed ? "auto" : perBreakpoint(direction, (d) => (d === "row" ? 1 : "auto"));
  const secondGridColumn = isCollapsed ? "auto" : perBreakpoint(direction, (d) => (d === "row" ? 3 : "auto"));

  return (
    <Box ref={containerRef} display="grid" sx={{ gridTemplateColumns, rowGap: gap }}>
      {showFirst && <Box sx={{ minWidth: 0, height: paneHeight, gridColumn: firstGridColumn }}>{first}</Box>}

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

      {showSecond && <Box sx={{ minWidth: 0, height: paneHeight, gridColumn: secondGridColumn }}>{second}</Box>}
    </Box>
  );
};

export default ResizablePanes;
