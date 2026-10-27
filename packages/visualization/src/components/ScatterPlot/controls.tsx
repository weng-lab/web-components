import { ControlButtonsProps } from "./types";
import { Add, Remove, BackHand, SettingsBackupRestore, Download, PictureInPictureAlt, HighlightAlt } from "@mui/icons-material"
import LassoIcon from "./LassoIcon";
import { ControlPanel } from "../../controls";

const ControlButtons = ({
    selectable,
    resetable,
    handleSelectionModeChange,
    selectMode,
    zoomIn,
    zoomOut,
    zoomReset,
    highlight,
    downloadButton,
    downloadPlot,
    side,
    miniMap,
}: ControlButtonsProps) => {
    // Shift is handled by the viewport, which swaps the mode only for the drag it starts.
    if (selectMode === "none") return null;
    return (
        <ControlPanel
            // Toward the plot, rather than off the container's edge.
            tooltipPlacement={side === "right" ? "left" : "right"}
            highlight={highlight}
            buttons={[
                selectable && {
                    label: "Pan",
                    tooltip: "Drag to pan, or hold Shift and drag",
                    icon: <BackHand fontSize="small" />,
                    onClick: () => handleSelectionModeChange("pan"),
                    pressed: selectMode === "pan",
                },
                selectable && {
                    label: "Lasso select",
                    tooltip: "Drag to select",
                    icon: <LassoIcon fontSize="small" />,
                    onClick: () => handleSelectionModeChange("select"),
                    pressed: selectMode === "select",
                },
                { label: "Zoom in", icon: <Add fontSize="small" />, onClick: zoomIn },
                { label: "Zoom out", icon: <Remove fontSize="small" />, onClick: zoomOut },
                {
                    label: "Reset zoom",
                    tooltip: "Reset zoom and pan",
                    icon: <SettingsBackupRestore fontSize="small" />,
                    onClick: zoomReset,
                    disabled: !resetable,
                },
                {
                    label: "Box zoom",
                    tooltip: selectMode === "zoom"
                        ? "Drag a box to zoom in; hold Shift to pan"
                        : selectMode === "pan" ? "Drag a box to zoom in, or hold Shift and drag" : "Drag a box to zoom in",
                    icon: <HighlightAlt fontSize="small" />,
                    // Off again, it goes back to panning.
                    onClick: () => handleSelectionModeChange(selectMode === "zoom" ? "pan" : "zoom"),
                    pressed: selectMode === "zoom",
                },
                miniMap && {
                    label: "Minimap",
                    tooltip: miniMap.open ? "Hide minimap" : "Show minimap while zoomed",
                    icon: <PictureInPictureAlt fontSize="small" />,
                    onClick: miniMap.toggle,
                    pressed: miniMap.open,
                },
                downloadButton && {
                    label: "Download",
                    tooltip: "Download plot as SVG",
                    icon: <Download fontSize="small" />,
                    onClick: () => downloadPlot(),
                },
            ]}
        />
    );
};

export default ControlButtons;
