import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Box, Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { PointShape } from "../../ScatterPlot/types";
import ShapeGlyph from "./ShapeGlyph";
import Swatch from "../Swatch";

/** One chip: a group of points the plot draws in one color. */
export type LegendGroup = {
  /** The group's identity, which `hidden`, `highlighted` and the callbacks key on. */
  value: string;
  /** What the chip shows. */
  label: string;
  color: string;
  count: number;
  /** The group's point shape, where the plot is shaped by the same field. Otherwise a plain dot. */
  shape?: PointShape;
  /** Shown on hover, for a group whose label doesn't say everything - one folding several categories together, say. */
  tooltip?: ReactNode;
};

export type ChipLegendProps = {
  /** The chips, in the order shown. */
  groups: LegendGroup[];
  /** Group values switched off; the caller decides what that does to the points (see Point's `dimmed`). */
  hidden: ReadonlySet<string>;
  onToggle: (value: string) => void;
  /** Group to ring, whichever side it came from: the plot's cursor or a chip's own hover. */
  highlighted?: string | null;
  /** Fired as the cursor enters and leaves a chip, so the plot can highlight that group. */
  onHover?: (value: string | null) => void;
  /** The field these chips stand for, worth showing where a plot has more than one row of chips. */
  label?: string;
  /**
   * Keeps the chips to one row that scrolls sideways, for a field with more groups than fit. A group
   * highlighted from the plot scrolls its chip into view.
   */
  scrollable?: boolean;
};

type LegendChipProps = {
  group: LegendGroup;
  hidden: boolean;
  ringed: boolean;
  onToggle: (value: string) => void;
  onHover?: (value: string | null) => void;
};

const LegendChip = ({
  group: { value, label, color, count, shape, tooltip },
  hidden,
  ringed,
  onToggle,
  onHover,
}: LegendChipProps) => {
  const chip = (
    <Chip
      size="small"
      // How ChipScroller finds the chip to scroll to.
      data-legend-value={value}
      onClick={() => onToggle(value)}
      onMouseEnter={() => onHover?.(value)}
      onMouseLeave={() => onHover?.(null)}
      variant={hidden ? "outlined" : "filled"}
      label={
        <Stack direction="row" alignItems="center" gap={0.75}>
          {shape ? (
            <ShapeGlyph shape={shape} color={color} hollow={hidden} size={13} />
          ) : (
            <Swatch color={color} hollow={hidden} />
          )}
          <Typography variant="caption" sx={{ textDecoration: hidden ? "line-through" : "none" }}>
            {label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {count}
          </Typography>
        </Stack>
      }
      sx={{
        bgcolor: hidden ? "transparent" : ringed ? "action.selected" : "action.hover",
        cursor: "pointer",
        // Outline rather than border, so the ring can't reflow the row.
        outline: ringed ? `2px solid ${color}` : "none",
        outlineOffset: 1,
        flexShrink: 0,
      }}
    />
  );

  // MUI composes the chip's hover handlers with the tooltip's, so the highlight still fires.
  return tooltip ? (
    <Tooltip arrow title={tooltip}>
      {chip}
    </Tooltip>
  ) : (
    chip
  );
};

/** How far a scroll button moves the row: most of its width, so a chip stays in view for context. */
const PAGE = 0.8;
/** Room left beside a chip scrolled into view, past its ring. */
const EDGE = 8;

/**
 * One row of chips that scrolls sideways, with buttons at either end while it overflows, as MUI's
 * scrollable Tabs. The highlighted chip is scrolled into view unless the cursor is on the row, where
 * the highlight comes from the chip under it, and scrolling would pull the chips from under the cursor.
 */
const ChipScroller = ({ highlighted, children }: { highlighted?: string | null; children: ReactNode }) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const pointerInside = useRef(false);
  // Whether there's more of the row past each end.
  const [more, setMore] = useState({ start: false, end: false });

  useEffect(() => {
    const scroller = scrollerRef.current!;
    const update = () => {
      const start = scroller.scrollLeft > 1;
      const end = scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1;
      setMore((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    observer.observe(rowRef.current!);
    scroller.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      scroller.removeEventListener("scroll", update);
    };
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || highlighted == null || pointerInside.current) return;
    const chip = scroller.querySelector(`[data-legend-value="${CSS.escape(highlighted)}"]`);
    if (!chip) return;
    const view = scroller.getBoundingClientRect();
    const { left, right } = chip.getBoundingClientRect();
    const offset = left < view.left ? left - view.left - EDGE : right > view.right ? right - view.right + EDGE : 0;
    // A smooth scroll takes longer the further it goes, so a long jump is made at once rather than
    // trailing behind a cursor moving on across the plot.
    if (offset !== 0) {
      scroller.scrollBy({ left: offset, behavior: Math.abs(offset) > scroller.clientWidth ? "auto" : "smooth" });
    }
  }, [highlighted]);

  const scrollButton = (direction: -1 | 1) => (
    <IconButton
      size="small"
      disabled={direction === -1 ? !more.start : !more.end}
      onClick={() =>
        scrollerRef.current?.scrollBy({ left: direction * scrollerRef.current.clientWidth * PAGE, behavior: "smooth" })
      }
      aria-label={direction === -1 ? "Scroll the legend left" : "Scroll the legend right"}
      // A chip's height, so the buttons appearing doesn't change the row's.
      sx={{ p: 0, width: 24, height: 24, flexShrink: 0 }}
    >
      {direction === -1 ? <ChevronLeftIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
    </IconButton>
  );
  const overflowing = more.start || more.end;

  return (
    <>
      {overflowing && scrollButton(-1)}
      <Box
        ref={scrollerRef}
        onMouseEnter={() => (pointerInside.current = true)}
        onMouseLeave={() => (pointerInside.current = false)}
        sx={{
          flex: "1 1 auto",
          minWidth: 0,
          overflowX: "auto",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          // Room for a ringed chip's outline, which the scroller would otherwise clip, without adding
          // to the row's height.
          p: "3px",
          my: "-3px",
        }}
      >
        <Stack ref={rowRef} direction="row" alignItems="center" gap={0.5} width="max-content">
          {children}
        </Stack>
      </Box>
      {overflowing && scrollButton(1)}
    </>
  );
};

/**
 * Clickable legend - ScatterPlot has no categorical legend of its own, so groups are toggled here
 * and the caller decides what a toggle does to its points.
 */
const ChipLegend = ({ groups, hidden, onToggle, highlighted, onHover, label, scrollable = false }: ChipLegendProps) => {
  const chips = groups.map((group) => (
    <LegendChip
      key={group.value}
      group={group}
      hidden={hidden.has(group.value)}
      ringed={group.value === highlighted}
      onToggle={onToggle}
      onHover={onHover}
    />
  ));

  return (
    // flexShrink: 0 keeps the plot from squeezing the chips' rows.
    <Stack
      direction="row"
      flexWrap={scrollable ? "nowrap" : "wrap"}
      alignItems="center"
      gap={0.5}
      flexShrink={0}
      minWidth={0}
    >
      {label && (
        <Typography variant="caption" color="text.secondary" mr={0.25} flexShrink={0}>
          {label}
        </Typography>
      )}
      {scrollable ? <ChipScroller highlighted={highlighted}>{chips}</ChipScroller> : chips}
    </Stack>
  );
};

export default ChipLegend;
