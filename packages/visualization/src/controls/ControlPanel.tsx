import { IconButton, Stack, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { CSSProperties, ReactNode } from "react";

/** MUI's small icon, which every button uses. */
const ICON_SIZE = 20;
const BUTTON_PADDING = 6;
/** MUI's small IconButton's, as the color range button beside a colorbar has. */
const PLAIN_BUTTON_PADDING = 5;
const PANEL_BORDER = 1;

/** The panel's width, for a plot that holds a lane for it. */
export const CONTROL_PANEL_WIDTH = ICON_SIZE + BUTTON_PADDING * 2 + PANEL_BORDER * 2;
/** A plain button's width and height, for a plot that holds room for a row of them. */
export const PLAIN_CONTROL_SIZE = ICON_SIZE + PLAIN_BUTTON_PADDING * 2;

export type ControlButton = {
  /** Its accessible name. */
  label: string;
  /** Shown on hover. The label where left out. */
  tooltip?: string;
  /** A small MUI icon. */
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  /** For a toggle, whether it's on, which tints it. */
  pressed?: boolean;
};

export type ControlPanelProps = {
  /** Top to bottom, or left to right. Falsy entries are skipped, so a button can be included conditionally. */
  buttons: (ControlButton | false | null | undefined)[];
  /** A column by default. */
  direction?: "column" | "row";
  /**
   * Round buttons with no panel behind them, like the color range button: for a toolbar beside the
   * plot. The panel, frosted so what's behind shows through, is for over it.
   */
  plain?: boolean;
  /** Which side tooltips open on: toward the plot. */
  tooltipPlacement?: "left" | "right" | "top" | "bottom";
  /** A pressed toggle's tint. The theme's primary color by default. */
  highlight?: string;
  style?: CSSProperties;
};

/** A plot's column or row of icon buttons - zoom, reset, modes - over or beside it. */
export const ControlPanel = ({
  buttons,
  direction = "column",
  plain = false,
  tooltipPlacement = "right",
  highlight,
  style,
}: ControlPanelProps) => {
  const theme = useTheme();
  const color = highlight ?? theme.palette.primary.main;
  return (
    <Stack
      direction={direction}
      style={style}
      sx={{
        width: direction === "column" && !plain ? CONTROL_PANEL_WIDTH : "fit-content",
        ...(!plain && {
          boxSizing: "border-box",
          background: "rgba(255, 255, 255, 0.6)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          border: `${PANEL_BORDER}px solid rgba(255, 255, 255, 0.3)`,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
        }),
      }}
    >
      {buttons.map((button) => {
        if (!button) return null;
        const { label, tooltip, icon, onClick, disabled, pressed } = button;
        return (
          <Tooltip key={label} title={tooltip ?? label} placement={tooltipPlacement}>
            {/* A disabled button fires no events, so the tooltip listens on a wrapper. Flex, so the
                wrapper adds no line height around the button. */}
            <span style={{ display: "flex" }}>
              <IconButton
                aria-label={label}
                aria-pressed={pressed}
                onClick={onClick}
                disabled={disabled}
                sx={{
                  ...(!plain && { borderRadius: 0 }),
                  padding: `${plain ? PLAIN_BUTTON_PADDING : BUTTON_PADDING}px`,
                  color: pressed ? color : plain ? theme.palette.action.active : theme.palette.text.primary,
                  backgroundColor: pressed ? `color-mix(in srgb, ${color} 15%, transparent)` : "transparent",
                  "&:hover": {
                    backgroundColor: pressed ? `color-mix(in srgb, ${color} 25%, transparent)` : theme.palette.action.hover,
                  },
                }}
              >
                {icon}
              </IconButton>
            </span>
          </Tooltip>
        );
      })}
    </Stack>
  );
};
