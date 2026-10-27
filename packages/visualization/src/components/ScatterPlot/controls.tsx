import { useEffect } from "react";
import { ControlButtonsProps } from "./types";
import { Add, Remove, BackHand, Edit, SettingsBackupRestore, Download, HighlightAlt } from "@mui/icons-material"
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

    useEffect(() => {
        // Function to handle key press
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Shift' && selectable && selectMode === "select") {
                handleSelectionModeChange('pan'); // Switch to pan mode when Shift is pressed

                // Function to handle key release
                const handleKeyUp = (e: KeyboardEvent) => {
                    if (e.key === 'Shift' && selectable) {
                        handleSelectionModeChange('select'); // Switch back to select mode when Shift is released
                    }
                };

                window.addEventListener('keyup', handleKeyUp);
                return () => {
                    window.removeEventListener('keyup', handleKeyUp);
                };
            }
        };

        // Add event listeners for key press and release
        window.addEventListener('keydown', handleKeyDown);

        // Clean up event listeners on unmount
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleSelectionModeChange, selectMode, selectable]);

    if (selectMode === "none") return null;
    return (
        <ControlPanel
            // Toward the plot, rather than off the container's edge.
            tooltipPlacement={side === "right" ? "left" : "right"}
            highlight={highlight}
            buttons={[
                selectable && {
                    label: "pan",
                    tooltip: "Drag to pan, or hold Shift and drag",
                    icon: <BackHand fontSize="small" />,
                    onClick: () => handleSelectionModeChange("pan"),
                    pressed: selectMode === "pan",
                },
                selectable && {
                    label: "edit",
                    tooltip: "Drag to select",
                    icon: <Edit fontSize="small" />,
                    onClick: () => handleSelectionModeChange("select"),
                    pressed: selectMode === "select",
                },
                { label: "zoom-in", tooltip: "Zoom In", icon: <Add fontSize="small" />, onClick: zoomIn },
                { label: "zoom-out", tooltip: "Zoom Out", icon: <Remove fontSize="small" />, onClick: zoomOut },
                {
                    label: "resetZoom",
                    tooltip: "Reset Zoom and Pan",
                    icon: <SettingsBackupRestore fontSize="small" />,
                    onClick: zoomReset,
                    disabled: !resetable,
                },
                miniMap && {
                    label: "minimap",
                    tooltip: miniMap.open ? "Hide Minimap" : "Show Minimap While Zoomed",
                    icon: <HighlightAlt fontSize="small" />,
                    onClick: miniMap.toggle,
                    pressed: miniMap.open,
                },
                downloadButton && {
                    label: "download",
                    tooltip: "Download Plot as SVG",
                    icon: <Download fontSize="small" />,
                    onClick: () => downloadPlot(),
                },
            ]}
        />
    );
};

export default ControlButtons;
