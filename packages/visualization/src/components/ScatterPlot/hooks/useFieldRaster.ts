import { useMemo } from "react";
import { BackgroundField } from "../types";
import { DEFAULT_FIELD_COLORS, rasterizeField } from "../backgroundField";

/**
 * A backgroundField as a bitmap, rasterized once and reused for every draw - the points are
 * redrawn on each frame of a pan or a hover, and the grid behind them can run to a million values.
 *
 * Keyed on the field's parts rather than on the object, so a consumer building the field inline on
 * each render doesn't rasterize again a grid that hasn't changed.
 */
export const useFieldRaster = (field: BackgroundField | undefined) => {
    const x = field?.x;
    const y = field?.y;
    const values = field?.values;
    const low = field?.domain[0];
    const high = field?.domain[1];
    const colors = (field?.colorScale ?? DEFAULT_FIELD_COLORS).join("|");

    return useMemo(
        () =>
            x && y && values && low !== undefined && high !== undefined
                ? rasterizeField(x, y, values, [low, high], colors.split("|"))
                : null,
        [x, y, values, low, high, colors]
    );
};
