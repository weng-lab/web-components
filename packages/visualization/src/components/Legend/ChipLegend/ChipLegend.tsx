import { Chip, Stack, Tooltip, Typography } from "@mui/material";
import { useEffect, type ReactNode } from "react";
import { HorizontalScroller } from "../../../controls/HorizontalScroller";
import { useTapToActivate, type TapToActivate } from "../../../hooks";
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
  /**
   * Fired by a click on a chip. On touch, with `onHover`, by a second tap on it: the first highlights its group, as
   * hovering does.
   */
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
  tap: TapToActivate<string>;
};

const LegendChip = ({
  group: { value, label, color, count, shape, tooltip },
  hidden,
  ringed,
  onToggle,
  onHover,
  tap,
}: LegendChipProps) => {
  const chip = (
    <Chip
      size="small"
      // How HorizontalScroller finds the chip to scroll to.
      data-scroller-key={value}
      // With nothing to highlight, there's nothing for a first tap to show, so it switches the group at once.
      onClick={() => (!onHover || tap.activates(value)) && onToggle(value)}
      onMouseEnter={() => {
        tap.hover(value);
        onHover?.(value);
      }}
      onMouseLeave={() => {
        tap.hover(null);
        onHover?.(null);
      }}
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

/**
 * Clickable legend - ScatterPlot has no categorical legend of its own, so groups are toggled here
 * and the caller decides what a toggle does to its points.
 */
const ChipLegend = ({ groups, hidden, onToggle, highlighted, onHover, label, scrollable = false }: ChipLegendProps) => {
  // On touch, a tap on a chip highlights its group, as hovering it does, and a second tap switches it.
  const tap = useTapToActivate<string>();
  // A group already highlighted, from its points on the plot, has had its preview: a tap on its chip switches it.
  useEffect(() => {
    tap.hover(highlighted ?? null);
  }, [tap, highlighted]);

  const chips = groups.map((group) => (
    <LegendChip
      key={group.value}
      group={group}
      hidden={hidden.has(group.value)}
      ringed={group.value === highlighted}
      onToggle={onToggle}
      onHover={onHover}
      tap={tap}
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
      {scrollable ? (
        <HorizontalScroller label="legend" reveal={highlighted}>
          {chips}
        </HorizontalScroller>
      ) : (
        chips
      )}
    </Stack>
  );
};

export default ChipLegend;
