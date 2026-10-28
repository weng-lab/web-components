import type { ReactNode, Ref } from "react";
import type { DownloadPlotHandle } from "../../utility";
import type { ManualSizeProps } from "../../responsive";
import type { ColorRange, RampKind, RangePreset } from "../Legend/colorbarAxis";
import type { ColorbarLabelStyle } from "../Legend/Colorbar/colorbarLabels";

/** A cell, by its row and column, and its value. */
export type ZoomableHeatmapCell = { row: number; column: number; value: number };

/** The colorbar above the grid, and the button beside it that moves its range. */
export type ZoomableHeatmapLegend = {
  /** What the colors stand for, for screen readers. "Values" by default. */
  label?: string;
  /** Its end labels. Three significant figures by default. */
  format?: (value: number) => string;
  /** A sweep's tooltip, which can want more precision than the ends. `format` by default. */
  formatValue?: (value: number) => string;
  /** What one value is, in the sweep's counts. "cell" by default. */
  noun?: string;
  /** The theme's caption by default. */
  labelStyle?: ColorbarLabelStyle;
  /** Whether the range button shows. Default true. */
  editable?: boolean;
  /** Diverging keeps the range symmetric about 0 as it's moved. "sequential" by default. */
  kind?: RampKind;
  /** How far the range editor's bar reaches. The values' extent by default. */
  extent?: ColorRange;
  /** Ranges the editor offers in one click. */
  presets?: RangePreset[];
  /** What the range panel says about the scale, a paragraph each. */
  notes?: readonly string[];
};

export type ZoomableHeatmapProps = ManualSizeProps & {
  /**
   * Every cell's value, a column at a time: column c's cells start at `c * rowNames.length`. NaN for
   * a cell with none, which is left empty. A Float32Array keeps a million cells to a few MB.
   */
  values: ArrayLike<number>;
  /** Top to bottom. */
  rowNames: readonly string[];
  /** Left to right. */
  columnNames: readonly string[];
  /** The ramp's colors, spaced evenly across colorDomain. */
  colors: readonly [string, string, ...string[]];
  /**
   * The values the colors span until the range button moves them; beyond, the end colors. The
   * values' extent by default. A range moved from one domain is kept for it, so a page switching
   * between scales finds each as it was left.
   */
  colorDomain?: ColorRange;
  xLabel?: string;
  yLabel?: string;
  /**
   * The tooltip for a cell, once cells are big enough to point at, given the range the colors span
   * now. Names the cell and its value by default.
   */
  tooltipBody?: (cell: ZoomableHeatmapCell, colorRange: ColorRange) => ReactNode;
  /**
   * A cell clicked, once cells are big enough to aim at; until then a click zooms in. On a touch
   * screen the first tap shows the cell's tooltip and a second tap on it clicks.
   */
  onCellClick?: (cell: ZoomableHeatmapCell) => void;
  /**
   * Columns to frame, by index. Their labels always show, in bold, and those too close together to
   * read are grouped under one "N selected" label that lists them on hover or tap.
   */
  selectedColumns?: readonly number[];
  /** Pans newly selected columns into view. */
  scrollToSelection?: boolean;
  /** A colorbar above the grid, which can be swept to pick out values, with a button to move its range. Default true. */
  showLegend?: boolean;
  legend?: ZoomableHeatmapLegend;
  /** Fades the cells in once drawn. */
  fadeIn?: boolean;
  ref?: Ref<DownloadPlotHandle>;
  /** Downloads are of the current view. */
  downloadFileName?: string;
};
