import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { AxisLeft, AxisBottom } from "@visx/axis";
import type { ColumnDatum, HeatmapCellId } from "../types";
import type { AnimationType } from "../../../utility";
import type { HeatmapLayout } from "../heatmapLayout";
import { LEGEND_GAP } from "../heatmapLayout";
import { AXIS_TITLE_FONT_SIZE, TICK_FONT_FAMILY, getXAxisTickLabelProps, yAxisTickLabelProps } from "../heatmapAxisProps";
import HeatmapCells, { type AnyBin } from "../HeatmapCells";

const SVG_NS = "http://www.w3.org/2000/svg";

interface ScrollableExportOptions {
  layout: HeatmapLayout;
  data: ColumnDatum[];
  gap: number;
  isRect: boolean;
  animationType?: AnimationType;
  onClick?: (bin: AnyBin) => void;
  selectedCells?: HeatmapCellId[];
  deselectedColor?: string;
  xLabel?: string;
  yLabel?: string;
  showLegend: boolean;
  legendSvg: SVGSVGElement | null;
  xAxisTickFormat: (d: number | { valueOf(): number }) => string;
  yAxisTickFormat: (d: number | { valueOf(): number }) => string;
  xAxisTickLabelProps: ReturnType<typeof getXAxisTickLabelProps>;
}

const appendTitle = (exportSvg: SVGSVGElement, text: string, x: number, y: number, rotate: boolean) => {
  const titleEl = document.createElementNS(SVG_NS, "text");
  titleEl.setAttribute("x", String(x));
  titleEl.setAttribute("y", String(y));
  if (rotate) titleEl.setAttribute("transform", `rotate(-90, ${x}, ${y})`);
  titleEl.setAttribute("text-anchor", "middle");
  titleEl.setAttribute("dominant-baseline", "middle");
  titleEl.setAttribute("font-size", String(AXIS_TITLE_FONT_SIZE));
  titleEl.setAttribute("font-family", TICK_FONT_FAMILY);
  titleEl.textContent = text;
  exportSvg.appendChild(titleEl);
};

const appendClone = (exportSvg: SVGSVGElement, source: SVGSVGElement, x: number, y: number) => {
  const group = document.createElementNS(SVG_NS, "g");
  group.setAttribute("transform", `translate(${x},${y})`);
  source.childNodes.forEach((node) => group.appendChild(node.cloneNode(true)));
  exportSvg.appendChild(group);
};

// Builds a standalone, off-DOM <svg> at full content size for export. Both the on-screen cell
// layer (a canvas painting only the current scroll viewport) and the on-screen row/column axis
// panes (SVGs windowed to the visible tick range) only ever hold a slice of the full grid -
// neither can just be cloned for export without capturing an incomplete/mispositioned snapshot.
// So all three (cells, row axis, column axis) are instead rendered fresh here in one detached
// tree - synchronously, full grid, no windowing - purely to snapshot into the export SVG below.
export function buildScrollableExportSVG(o: ScrollableExportOptions): SVGSVGElement | null {
  const { layout } = o;
  const {
    marg, xMax, yMax, xScale, yScale, cellYScale, stableColors, minValue, maxValue,
    binWidth, binHeight, numRows, xTickValues, yTickValues, yTickLabelWidth, xTickLabelHeight,
    yTitleWidth, xTitleHeight,
  } = layout;

  const exportSvg = document.createElementNS(SVG_NS, "svg") as SVGSVGElement;
  exportSvg.setAttribute("width", String(marg.left + xMax + marg.right));
  exportSvg.setAttribute("height", String(marg.top + yMax + marg.bottom));

  let fullCells: SVGSVGElement | null = null;
  let fullRowAxis: SVGSVGElement | null = null;
  let fullColAxis: SVGSVGElement | null = null;
  const exportContainer = document.createElement("div");
  const exportRoot = createRoot(exportContainer);
  flushSync(() => {
    exportRoot.render(
      <>
        <svg width={xMax} height={yMax} ref={(el) => { fullCells = el; }}>
          <HeatmapCells
            data={o.data}
            xScale={xScale}
            yScale={cellYScale}
            colors={stableColors}
            minValue={minValue}
            maxValue={maxValue}
            gap={o.gap}
            isRect={o.isRect}
            binWidth={binWidth}
            binHeight={binHeight}
            animationType={o.animationType}
            onClick={o.onClick}
            selectedCells={o.selectedCells}
            deselectedColor={o.deselectedColor}
          />
        </svg>
        <svg width={yTickLabelWidth} height={yMax} ref={(el) => { fullRowAxis = el; }}>
          <g transform={`translate(${yTickLabelWidth},0)`}>
            <AxisLeft
              scale={yScale}
              numTicks={numRows}
              tickValues={yTickValues}
              tickFormat={o.yAxisTickFormat}
              tickLabelProps={yAxisTickLabelProps}
            />
          </g>
        </svg>
        <svg width={xMax} height={xTickLabelHeight} ref={(el) => { fullColAxis = el; }}>
          <AxisBottom
            top={0}
            scale={xScale}
            numTicks={o.data.length}
            tickFormat={o.xAxisTickFormat}
            tickValues={xTickValues}
            tickLabelProps={o.xAxisTickLabelProps}
          />
        </svg>
      </>
    );
  });
  if (fullCells) appendClone(exportSvg, fullCells, marg.left, marg.top);
  if (fullRowAxis) appendClone(exportSvg, fullRowAxis, yTitleWidth, marg.top);
  if (fullColAxis) appendClone(exportSvg, fullColAxis, marg.left, marg.top + yMax);
  exportRoot.unmount();

  if (o.showLegend && o.legendSvg) {
    appendClone(exportSvg, o.legendSvg, marg.left + xMax + LEGEND_GAP, marg.top);
  }

  // The axis titles live in their own always-visible panes on screen (so scrolling can't
  // carry them out of view) rather than as visx's built-in centered-on-the-full-axis label,
  // so they're added here directly instead of being cloned from a live pane.
  if (o.yLabel) appendTitle(exportSvg, o.yLabel, yTitleWidth / 2, marg.top + yMax / 2, true);
  if (o.xLabel) appendTitle(exportSvg, o.xLabel, marg.left + xMax / 2, marg.top + yMax + xTickLabelHeight + xTitleHeight / 2, false);

  return exportSvg;
}

// downloadSVGAsPNG reads the element's layout box asynchronously (after its image loads), so
// an off-DOM export node has to stay attached (off-screen) until onComplete fires. The
// off-screen positioning goes on a wrapper div, never on the <svg> itself - that svg is what
// gets serialized and downloaded, so any inline style set directly on it (e.g. `left:
// -99999px`) would be baked into the exported file, rendering everything pushed off-canvas
// and out of view - the exact "blank image" bug this replaced.
export function withOffscreenExportSVG(o: ScrollableExportOptions, run: (svg: SVGSVGElement, onDone: () => void) => void): void {
  const svg = buildScrollableExportSVG(o);
  if (!svg) return;
  const wrapper = document.createElement("div");
  wrapper.style.position = "absolute";
  wrapper.style.top = "0";
  wrapper.style.left = "-99999px";
  wrapper.appendChild(svg);
  document.body.appendChild(wrapper);
  run(svg, () => {
    if (wrapper.parentNode) document.body.removeChild(wrapper);
  });
}
