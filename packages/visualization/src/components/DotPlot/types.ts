import { DownloadPlotHandle } from "../../utility";

export type DotPlotData = {
  /** X-axis category (e.g. gene name or cell type) */
  x: string;
  /** Y-axis category (e.g. disease or dataset) */
  y: string;
  radius: number;
  color: number;
  highlighted?: boolean;
};

export type DotPlotProps = {
  data: DotPlotData[];
  showTooltipData?: boolean;
  /** When true, uses a diverging red–blue color scale instead of a single blue scale */
  deg?: boolean;
  /** Font style applied to x-axis tick labels — use "italic" when labels are gene names */
  xTickFontStyle?: "normal" | "italic" | "other";
  /**
   * When true, y-axis tick labels (datasets) are shown on the right and yAxisLabel is
   * rendered as a rotated title on the left — matching the layout in the screenshot.
   */
  yLabelsRight?: boolean;
  yAxisLabel?: string;
  /** Legend title for the radius scale */
  radiusTitle?: string;
  /** Legend title for the color scale */
  colorTitle?: string;
  ref?: React.Ref<DownloadPlotHandle>;
  downloadFileName?: string;
};
