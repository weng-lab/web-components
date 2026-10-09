import TuneIcon from "@mui/icons-material/Tune";
import { Badge, Button, IconButton, Popover, Stack, Tooltip, Typography } from "@mui/material";
import { useState, type MouseEvent } from "react";
import { formatRange, sameRange, type ColorRange, type RangePreset } from "../colorbarAxis";
import ColorRangeEditor, { type ColorRangeEditorProps } from "./ColorRangeEditor";
import SteadyText from "./SteadyText";

/** What moving a colorbar's range needs beyond what the colorbar already has. */
export type ColorRangeControl = {
  defaultRange: ColorRange;
  /** The lowest and highest value there is, shown or not: how far the editor's bar reaches. The ends of the colorbar's values by default. */
  extent?: ColorRange;
  /** Ranges offered in one click. By default ±2, ±3, ±5, ±10 for a diverging scale, the middle 90–98% otherwise. */
  presets?: RangePreset[];
  /** Fired on every step of a drag, and for a preset or a reset. */
  onChange: (range: ColorRange) => void;
  /** Fired as the editor closes, so a range kept somewhere costly to write, like the URL, is written once. */
  onClose?: () => void;
};

export type ColorRangeButtonProps = ColorRangeEditorProps & {
  /**
   * What the scale is and where it starts, one paragraph each: a log transform, why the default range
   * is what it is. Shown above the editor.
   */
  notes?: readonly string[];
  /** Written on the button before the range, so "Colors" reads "Colors ±3.0". The icon alone where omitted. */
  label?: string;
  /** Fired as the editor opens. */
  onOpen?: () => void;
  /** Fired as the editor closes, so a range kept somewhere costly to write, like the URL, is written once. */
  onClose?: () => void;
};

/**
 * Opens the color range editor, kept off the legend where handles would crowd the bar and catch the
 * cursor mid-sweep. A dot on the icon, or the button's color, says the range has been moved.
 */
const ColorRangeButton = ({ label, notes = [], onOpen, onClose, ...editor }: ColorRangeButtonProps) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const adjusted = !sameRange(editor.range, editor.defaultRange);
  const side = label ? "right" : "left";
  const open = (event: MouseEvent<HTMLElement>) => {
    setAnchor(event.currentTarget);
    onOpen?.();
  };
  const close = () => {
    setAnchor(null);
    onClose?.();
  };

  return (
    <>
      {label ? (
        <Button
          size="small"
          variant="outlined"
          color={adjusted ? "primary" : "inherit"}
          startIcon={<TuneIcon fontSize="small" />}
          onClick={open}
          aria-haspopup="dialog"
          sx={{
            flexShrink: 0,
            whiteSpace: "nowrap",
            bgcolor: "background.paper",
            borderColor: adjusted ? undefined : "divider",
          }}
        >
          {/* One span, so the space after the label survives the button's flexbox. */}
          <span>
            {label} {/* Held while the editor is open, so the button, and the panel anchored to it, hold still. */}
            <SteadyText text={formatRange(editor.kind, editor.range, editor.format)} hold={anchor !== null} />
          </span>
        </Button>
      ) : (
        <Tooltip title="Adjust the color range" disableInteractive>
          <IconButton
            size="small"
            onClick={open}
            aria-label="Adjust the color range"
            aria-haspopup="dialog"
            sx={{ flexShrink: 0 }}
          >
            <Badge variant="dot" color="primary" invisible={!adjusted}>
              <TuneIcon fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>
      )}
      <Popover
        open={anchor !== null}
        anchorEl={anchor}
        onClose={close}
        // Leaves the page its scrollbar, which the lock swaps for a blank strip; the panel follows its
        // button when the page scrolls instead.
        disableScrollLock
        anchorOrigin={{ vertical: "bottom", horizontal: side }}
        transformOrigin={{ vertical: "top", horizontal: side }}
        slotProps={{ paper: { sx: { p: 2, mt: 0.5 } } }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={notes.length ? 0.5 : 1}>
          <Typography variant="subtitle2">Color range</Typography>
          <Button size="small" disabled={!adjusted} onClick={() => editor.onChange(editor.defaultRange)}>
            Reset
          </Button>
        </Stack>
        {/* As wide as the editor, so a long note wraps rather than widening the panel. */}
        {notes.length > 0 && (
          <Stack gap={0.5} mb={1.5} width={0} minWidth="100%">
            {notes.map((note) => (
              <Typography key={note} variant="caption" color="text.secondary" component="p">
                {note}
              </Typography>
            ))}
          </Stack>
        )}
        <ColorRangeEditor {...editor} />
      </Popover>
    </>
  );
};

export default ColorRangeButton;
