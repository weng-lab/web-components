import { Add, Remove, SettingsBackupRestore, Timeline } from "@mui/icons-material";
import { Tooltip, IconButton } from "@mui/material";
import { ProvidedZoom,  } from "@visx/zoom/lib/types";

export type ControlPanelProps = {
  scaleZoom: ProvidedZoom<SVGSVGElement>["scale"]
  resetZoom: ProvidedZoom<SVGSVGElement>["reset"]
  toggleBranchLength: () => void
}

export const ControlPanel = ({scaleZoom, resetZoom, toggleBranchLength}: ControlPanelProps) => {
  return (
    <div
      style={{
        position: "absolute",
        margin: "4px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        background: "rgba(255, 255, 255, 0.6)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)", // Safari support
        border: "1px solid rgba(255, 255, 255, 0.3)",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Tooltip id={"test"} title="Zoom In" placement="right">
        <IconButton onClick={() => scaleZoom({ scaleX: 1.2, scaleY: 1.2 })}>
          <Add fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Zoom Out" placement="right">
        <IconButton onClick={() => scaleZoom({ scaleX: 1 / 1.2, scaleY: 1 / 1.2 })}>
          <Remove fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Reset" placement="right">
        <IconButton onClick={resetZoom}>
          <SettingsBackupRestore fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Toggle Evolutionary Distance" placement="right">
        <IconButton onClick={toggleBranchLength}>
          <Timeline fontSize="small" />
        </IconButton>
      </Tooltip>
    </div>
  );
}