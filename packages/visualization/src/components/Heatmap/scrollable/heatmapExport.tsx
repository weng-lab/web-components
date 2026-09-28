import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { AxisLeft, AxisBottom } from "@visx/axis";
import type { ColumnDatum } from "../types";
import { MAX_CANVAS_EXPORT_DIMENSION, MAX_CANVAS_EXPORT_PIXELS, downloadBlob } from "../../../utility";
import type { HeatmapLayout } from "../heatmapLayout";
import { LEGEND_GAP, xAxisTitleCenter } from "../heatmapLayout";
import { AXIS_TITLE_FONT_SIZE, TICK_FONT_FAMILY, getXAxisTickLabelProps, markTickLabels, yAxisTickLabelProps } from "../heatmapAxisProps";
import { drawHeatmapCells } from "../HeatmapCanvasCells";
import HeatmapSelectionPointers from "../HeatmapSelectionPointers";

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";

interface ScrollableExportOptions {
  layout: HeatmapLayout;
  data: ColumnDatum[];
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

// Capped at what browsers reliably allocate; past that, some return a blank canvas without erroring.
function computeExportScale(width: number, height: number): number {
  const desiredScale = window.devicePixelRatio || 2;
  return Math.min(
    desiredScale,
    MAX_CANVAS_EXPORT_DIMENSION / width,
    MAX_CANVAS_EXPORT_DIMENSION / height,
    Math.sqrt(MAX_CANVAS_EXPORT_PIXELS / (width * height))
  );
}

// The whole cell grid painted onto a canvas, as the live grid paints it. As SVG shapes, a large grid
// would serialize into hundreds of MB and hang the tab.
function rasterizeCells(o: ScrollableExportOptions, scale: number): HTMLCanvasElement | null {
  const { xMax, yMax, canvasCellParams, numRows } = o.layout;
  if (xMax <= 0 || yMax <= 0) return null;

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(xMax * scale));
  canvas.height = Math.max(1, Math.round(yMax * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  const range = { colStart: 0, colEnd: Math.max(0, o.data.length - 1), rowStart: 0, rowEnd: Math.max(0, numRows - 1) };
  // A highlight is a passing hover, not part of the figure; the selection is kept.
  drawHeatmapCells(ctx, { ...canvasCellParams, highlightRange: null }, range, null);
  return canvas;
}

// For the .svg download only; the PNG draws the canvas directly.
function renderCellsToDataURL(o: ScrollableExportOptions): string | null {
  const { xMax, yMax } = o.layout;
  if (xMax <= 0 || yMax <= 0) return null;
  const canvas = rasterizeCells(o, computeExportScale(xMax, yMax));
  return canvas ? canvas.toDataURL("image/png") : null;
}

const appendCellsImage = (exportSvg: SVGSVGElement, dataUrl: string, x: number, y: number, width: number, height: number) => {
  const image = document.createElementNS(SVG_NS, "image");
  image.setAttribute("x", String(x));
  image.setAttribute("y", String(y));
  image.setAttribute("width", String(width));
  image.setAttribute("height", String(height));
  image.setAttribute("preserveAspectRatio", "none");
  // xlink:href for older SVG renderers and editors, href for SVG2.
  image.setAttributeNS(XLINK_NS, "href", dataUrl);
  image.setAttribute("href", dataUrl);
  exportSvg.appendChild(image);
};

// A standalone <svg> of the whole plot. The on-screen axis panes only hold the visible ticks, so the
// axes are rendered afresh, in full, in a detached tree; the cells come in as an image.
export function buildScrollableExportSVG(o: ScrollableExportOptions, { includeCells = true }: { includeCells?: boolean } = {}): SVGSVGElement | null {
  const { layout } = o;
  const {
    marg, xMax, yMax, xScale, yScale, numRows, xTickValues, yTickValues, yTickLabelWidth, xTickLabelHeight,
    yTitleWidth, xTitleHeight, selectionMarks,
  } = layout;

  const exportSvg = document.createElementNS(SVG_NS, "svg") as SVGSVGElement;
  exportSvg.setAttribute("width", String(marg.left + xMax + marg.right));
  exportSvg.setAttribute("height", String(marg.top + yMax + marg.bottom));

  if (includeCells) {
    const cellsDataUrl = renderCellsToDataURL(o);
    if (cellsDataUrl) appendCellsImage(exportSvg, cellsDataUrl, marg.left, marg.top, xMax, yMax);
  }

  let fullRowAxis: SVGSVGElement | null = null;
  let fullColAxis: SVGSVGElement | null = null;
  const exportContainer = document.createElement("div");
  const exportRoot = createRoot(exportContainer);
  flushSync(() => {
    exportRoot.render(
      <>
        <svg width={yTickLabelWidth} height={yMax} ref={(el) => { fullRowAxis = el; }}>
          <g transform={`translate(${yTickLabelWidth},0)`}>
            <AxisLeft
              scale={yScale}
              numTicks={numRows}
              tickValues={yTickValues}
              tickFormat={o.yAxisTickFormat}
              tickLabelProps={markTickLabels(yAxisTickLabelProps, selectionMarks.rows)}
            />
            <HeatmapSelectionPointers axis="row" marked={selectionMarks.rows} scale={yScale} />
          </g>
        </svg>
        <svg width={xMax} height={xTickLabelHeight} ref={(el) => { fullColAxis = el; }}>
          <AxisBottom
            top={0}
            scale={xScale}
            numTicks={o.data.length}
            tickFormat={o.xAxisTickFormat}
            tickValues={xTickValues}
            tickLabelProps={markTickLabels(o.xAxisTickLabelProps, selectionMarks.columns)}
          />
          <HeatmapSelectionPointers axis="column" marked={selectionMarks.columns} scale={xScale} />
        </svg>
      </>
    );
  });
  if (fullRowAxis) appendClone(exportSvg, fullRowAxis, yTitleWidth, marg.top);
  if (fullColAxis) appendClone(exportSvg, fullColAxis, marg.left, marg.top + yMax);
  exportRoot.unmount();

  if (o.showLegend && o.legendSvg) {
    appendClone(exportSvg, o.legendSvg, marg.left + xMax + LEGEND_GAP, marg.top);
  }

  // On screen the titles sit in their own fixed panes, so there is nothing to clone: they're drawn here.
  if (o.yLabel) appendTitle(exportSvg, o.yLabel, yTitleWidth / 2, marg.top + yMax / 2, true);
  if (o.xLabel) {
    const center = xAxisTitleCenter(o.xLabel, marg.left + xMax / 2, marg.left + xMax + marg.right);
    appendTitle(exportSvg, o.xLabel, center, marg.top + yMax + xTickLabelHeight + xTitleHeight / 2, false);
  }

  return exportSvg;
}

// The cells are painted straight onto the output canvas, with only the axes, legend and titles
// going through SVG. Embedding the cells in the SVG as a data URL and decoding it back doubled the
// memory, enough to crash the tab on a large export.
export function downloadScrollableHeatmapPNG(o: ScrollableExportOptions, fileName: string): void {
  const { marg, xMax, yMax } = o.layout;
  if (xMax <= 0 || yMax <= 0) return;

  const fullWidth = marg.left + xMax + marg.right;
  const fullHeight = marg.top + yMax + marg.bottom;
  const scale = computeExportScale(fullWidth, fullHeight);

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(fullWidth * scale));
  canvas.height = Math.max(1, Math.round(fullHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const cellsCanvas = rasterizeCells(o, scale);
  if (cellsCanvas) ctx.drawImage(cellsCanvas, marg.left * scale, marg.top * scale);

  const finish = (blob: Blob | null) => {
    if (blob) downloadBlob(blob, fileName);
  };

  const axesSvg = buildScrollableExportSVG(o, { includeCells: false });
  if (!axesSvg) {
    canvas.toBlob(finish, "image/png", 1);
    return;
  }

  const svgString = new XMLSerializer().serializeToString(axesSvg);
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    canvas.toBlob(finish, "image/png", 1);
  };
  img.onerror = () => URL.revokeObjectURL(url);
  img.src = url;
}

// Keeps the export <svg> attached off-screen until `run` is done with it. The offset goes on a
// wrapper: set on the <svg> itself, it would be serialized into the file.
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
