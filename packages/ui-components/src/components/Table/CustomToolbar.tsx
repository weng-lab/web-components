import * as React from "react";
import { flushSync } from "react-dom";
import { styled } from "@mui/material/styles";
import {
  Toolbar,
  ToolbarButton,
  ColumnsPanelTrigger,
  FilterPanelTrigger,
  ExportCsv,
  ExportPrint,
  QuickFilter,
  QuickFilterControl,
  QuickFilterClear,
  QuickFilterTrigger,
  GridToolbarProps,
  ToolbarPropsOverrides,
  ExportExcel,
} from "@mui/x-data-grid-premium";
import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import Badge from "@mui/material/Badge";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import FilterListIcon from "@mui/icons-material/FilterList";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import CancelIcon from "@mui/icons-material/Cancel";
import SearchIcon from "@mui/icons-material/Search";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import "./types";
import { InfoOutline } from "@mui/icons-material";

type OwnerState = {
  expanded: boolean;
};

// Narrows the open search field to fit the row, on a phone, rather than pushing the other controls off it.
const StyledQuickFilter = styled(QuickFilter)({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  alignItems: "center",
  minWidth: 0,
});

const StyledToolbarButton = styled(ToolbarButton)<{ ownerState: OwnerState }>(({ theme, ownerState }) => ({
  gridArea: "1 / 1",
  width: "min-content",
  height: "min-content",
  zIndex: 1,
  opacity: ownerState.expanded ? 0 : 1,
  pointerEvents: ownerState.expanded ? "none" : "auto",
  transition: theme.transitions.create(["opacity"]),
}));

const StyledTextField = styled(TextField)<{
  ownerState: OwnerState;
}>(({ theme, ownerState }) => ({
  gridArea: "1 / 1",
  overflowX: "clip",
  width: ownerState.expanded ? 260 : "var(--trigger-width)",
  maxWidth: "100%",
  opacity: ownerState.expanded ? 1 : 0,
  transition: theme.transitions.create(["width", "opacity"]),
}));

type CustomToolbarProps = GridToolbarProps & ToolbarPropsOverrides;

/**
 * The narrowest the title is squeezed beside the controls before they wrap onto a row of their own under it. Leaves
 * room for the built-in controls beside it on a 360px-wide phone, so only an extra wraps them.
 */
const MIN_TITLE_WIDTH = "8rem";
/** Toolbars narrower than this, in px, give the search the controls' row while it's typed in. */
const SEARCH_TAKEOVER_WIDTH = 600;
/** The room between an extra and the built-in controls, in px, with a divider down its middle. */
const SEPARATOR = 13;

export function CustomToolbar({
  label,
  labelTooltip,
  extra,
  style,
  iconColor: iconColorProp,
  ...toolbarProps
}: CustomToolbarProps) {
  const [exportMenuOpen, setExportMenuOpen] = React.useState(false);
  const exportMenuTriggerRef = React.useRef<HTMLButtonElement>(null);

  const iconColor = iconColorProp ?? "inherit";

  const { printOptions, csvOptions, excelOptions } = toolbarProps;

  return (
    // Grows to hold the controls once they wrap under the title: MUI X's own flex holds it at its min height.
    <Toolbar style={{ flex: "0 0 auto", flexWrap: "wrap", rowGap: 4, containerType: "inline-size", ...style }}>
      {typeof label !== "string" && label}
      {/* Takes the row's spare room, so the controls sit right, and wraps a subtitle under the label rather than
          beside it once they don't fit side by side. */}
      <Typography
        fontWeight="medium"
        sx={{
          flex: `999 1 ${MIN_TITLE_WIDTH}`,
          mx: 0.5,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          columnGap: 1,
        }}
      >
        {typeof label === "string" && label}
        {/* ReactNode can be more than just an element, string, or number but not accounting for that for simplicity */}
        {labelTooltip && (typeof labelTooltip === "string" || typeof labelTooltip === "number") ? (
          <Tooltip title={labelTooltip}>
            <InfoOutline fontSize="inherit" color="primary" />
          </Tooltip>
        ) : (
          labelTooltip
        )}
      </Typography>
      {/* Right-aligned on a row of their own once wrapped under the title, where an extra too wide to share a row
          with the built-in controls wraps onto one above them. */}
      <Box
        sx={{
          flex: "1 1 auto",
          minWidth: 0,
          alignSelf: "stretch",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "flex-end",
          rowGap: "4px",
          // Cuts off the extra's divider where it hangs past the row's end.
          clipPath: "inset(-100vh 0 -100vh -100vw)",
          // The open search, while it has focus, as the only control, across the row. Checks the field rather than the
          // whole search, which MUI hands focus back to its button when it closes.
          [`@container (max-width: ${SEARCH_TAKEOVER_WIDTH - 0.05}px)`]: {
            "&:has(.toolbar-search-open:focus-within)": {
              "& > .toolbar-extra, & > .toolbar-tools > :not(.toolbar-search)": { display: "none" },
              "& > .toolbar-tools": { flexBasis: "100%", ml: 0 },
              "& .toolbar-search": { flexGrow: 1 },
              "& .toolbar-search .MuiTextField-root": { width: "100%" },
            },
          },
        }}
      >
        {extra && (
          // Its divider hangs past its end, into the room the built-in controls leave before themselves, so it shows
          // between the two on one row but is cut off with the row's end once the extra wraps onto a row of its own.
          <Box
            className="toolbar-extra"
            sx={{ display: "flex", alignItems: "center", mr: `${-(SEPARATOR + 1) / 2}px` }}
          >
            {extra}
            <Divider orientation="vertical" variant="middle" flexItem sx={{ ml: `${(SEPARATOR - 1) / 2}px`, mr: 0 }} />
          </Box>
        )}
        <Box
          className="toolbar-tools"
          sx={{
            flex: "0 1 auto",
            minWidth: 0,
            alignSelf: "stretch",
            display: "flex",
            alignItems: "center",
            gap: 0.25,
            ml: extra ? `${SEPARATOR}px` : 0,
          }}
        >
          <Tooltip title="Columns">
            <ColumnsPanelTrigger render={<ToolbarButton />}>
              <ViewColumnIcon fontSize="small" htmlColor={iconColor} />
            </ColumnsPanelTrigger>
          </Tooltip>

          <Tooltip title="Filters">
            <FilterPanelTrigger
              render={(props, state) => (
                <ToolbarButton {...props} color="default">
                  <Badge badgeContent={state.filterCount} color="primary" variant="dot">
                    <FilterListIcon fontSize="small" htmlColor={iconColor} />
                  </Badge>
                </ToolbarButton>
              )}
            />
          </Tooltip>
          <Divider orientation="vertical" variant="middle" flexItem sx={{ mx: 0.5 }} />
          <Tooltip title="Export">
            <ToolbarButton
              ref={exportMenuTriggerRef}
              id="export-menu-trigger"
              aria-controls="export-menu"
              aria-haspopup="true"
              aria-expanded={exportMenuOpen ? "true" : undefined}
              onClick={() => setExportMenuOpen(true)}
            >
              <FileDownloadIcon fontSize="small" htmlColor={iconColor} />
            </ToolbarButton>
          </Tooltip>

          <Menu
            id="export-menu"
            anchorEl={exportMenuTriggerRef.current}
            open={exportMenuOpen}
            onClose={() => setExportMenuOpen(false)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{
              list: {
                "aria-labelledby": "export-menu-trigger",
              },
            }}
          >
            <ExportPrint options={printOptions} render={<MenuItem />} onClick={() => setExportMenuOpen(false)}>
              Print
            </ExportPrint>
            <ExportCsv
              options={{
                ...(typeof label === "string" ? { fileName: label } : {}),
                ...csvOptions,
              }}
              render={<MenuItem />}
              onClick={() => setExportMenuOpen(false)}
            >
              Download as CSV
            </ExportCsv>
            <ExportExcel
              options={{
                ...(typeof label === "string" ? { fileName: label } : {}),
                ...excelOptions,
              }}
              render={<MenuItem />}
              onClick={() => setExportMenuOpen(false)}
            >
              Download as Excel
            </ExportExcel>
          </Menu>

          <StyledQuickFilter className="toolbar-search">
            <QuickFilterTrigger
              render={(triggerProps, state) => (
                <Tooltip title="Search" enterDelay={0}>
                  <StyledToolbarButton
                    {...triggerProps}
                    onClick={(event) => {
                      // A phone raises its keyboard only for a focus made in the tap itself, which MUI X's own, a
                      // frame after the search opens, isn't. Opened at once, so the toolbar has moved focus off this
                      // button, as it does once the button is disabled, before the field takes it.
                      flushSync(() => triggerProps.onClick?.(event));
                      if (!state.expanded) {
                        document.getElementById(triggerProps["aria-controls"] ?? "")?.focus({ preventScroll: true });
                      }
                    }}
                    ownerState={{ expanded: state.expanded }}
                    color="default"
                    aria-disabled={state.expanded}
                  >
                    <SearchIcon fontSize="small" htmlColor={iconColor} />
                  </StyledToolbarButton>
                </Tooltip>
              )}
            />
            <QuickFilterControl
              render={({ ref, ...controlProps }, state) => (
                <StyledTextField
                  {...controlProps}
                  className={state.expanded ? "toolbar-search-open" : undefined}
                  ownerState={{ expanded: state.expanded }}
                  inputRef={ref}
                  aria-label="Search"
                  placeholder="Search..."
                  size="small"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                      endAdornment: state.value ? (
                        <InputAdornment position="end">
                          <QuickFilterClear
                            edge="end"
                            size="small"
                            aria-label="Clear search"
                            material={{ sx: { marginRight: -0.75 } }}
                          >
                            <CancelIcon fontSize="small" />
                          </QuickFilterClear>
                        </InputAdornment>
                      ) : null,
                      ...controlProps.slotProps?.input,
                    },
                    ...controlProps.slotProps,
                  }}
                />
              )}
            />
          </StyledQuickFilter>
        </Box>
      </Box>
    </Toolbar>
  );
}
