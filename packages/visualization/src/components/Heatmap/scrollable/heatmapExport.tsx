import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { AxisLeft, AxisBottom } from "@visx/axis";
import type { ColumnDatum } from "../types";
import { MAX_CANVAS_EXPORT_DIMENSION, MAX_CANVAS_EXPORT_PIXELS, downloadBlob } from "../../../utility";
import type { HeatmapLayout } from "../heatmapLayout";
import { LEGEND_GAP } from "../heatmapLayout";
import { AXIS_TITLE_FONT_SIZE, TICK_FONT_FAMILY, getXAxisTickLabelProps, yAxisTickLabelProps } from "../heatmapAxisProps";
import { drawHeatmapCells } from "../HeatmapCanvasCells";

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

// Resolution is capped (never upscaled) so a canvas can't exceed what browsers will reliably
// allocate - past that, some browsers just hand back a blank canvas instead of erroring.
function computeExportScale(width: number, height: number): number {
  const desiredScale = window.devicePixelRatio || 2;
  return Math.min(
    desiredScale,
    MAX_CANVAS_EXPORT_DIMENSION / width,
    MAX_CANVAS_EXPORT_DIMENSION / height,
    Math.sqrt(MAX_CANVAS_EXPORT_PIXELS / (width * height))
  );
}

// Rasterizes the full (unwindowed) cell grid onto a canvas using the same paint routine the
// live scrollable grid and minimap use for their own canvases (drawHeatmapCells). This is the
// key difference from every other layer here: a large grid (e.g. 1000x1000 = 1M cells) rendered
// as individual SVG shapes via React would mean 1M DOM nodes built synchronously and then
// serialized into a multi-hundred-MB XML string - that's what used to hang/crash the tab.
// Painting into a canvas instead collapses that to a bounded number of fillRect calls, which is
// exactly how the minimap already handles full-dataset draws.
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
  drawHeatmapCells(ctx, canvasCellParams, range, null);
  return canvas;
}

// Only used to embed the cell layer in an actual downloadable .svg file (see
// buildScrollableExportSVG) - the PNG path (downloadScrollableHeatmapPNG below) draws the
// rasterized canvas directly onto the output canvas instead, so it never needs this as a string.
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
  // Both attributes are set for compatibility: xlink:href is what older SVG renderers (and some
  // image editors) still expect, href is the modern SVG2/browser-native attribute.
  image.setAttributeNS(XLINK_NS, "href", dataUrl);
  image.setAttribute("href", dataUrl);
  exportSvg.appendChild(image);
};

// Builds a standalone, off-DOM <svg> at full content size for export. The on-screen row/column
// axis panes (SVGs windowed to the visible tick range) only ever hold a slice of the full grid -
// they can't just be cloned for export without capturing an incomplete/mispositioned snapshot -
// so both are rendered fresh here in one detached tree, synchronously, full grid, no windowing,
// purely to snapshot into the export SVG below. The cell layer is handled separately (see
// renderCellsToDataURL above) since it doesn't have this problem's flip side: rendering it fresh
// as SVG shapes is exactly what's too expensive at full-grid scale.
export function buildScrollableExportSVG(o: ScrollableExportOptions, { includeCells = true }: { includeCells?: boolean } = {}): SVGSVGElement | null {
  const { layout } = o;
  const {
    marg, xMax, yMax, xScale, yScale, numRows, xTickValues, yTickValues, yTickLabelWidth, xTickLabelHeight,
    yTitleWidth, xTitleHeight,
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

// Renders a scrollable heatmap straight to a downloadable PNG in a single raster pass: the cell
// grid is drawn once (rasterizeCells) directly onto the output canvas, and only the much smaller
// axes/legend/titles are round-tripped through SVG-to-image to rasterize on top of it. This
// deliberately avoids buildScrollableExportSVG's normal cells-as-embedded-image path (used for
// the actual .svg download, where a raster layer has to be embedded as a data URL to produce a
// valid standalone file) - base64-encoding a full-resolution cell canvas into an XML string,
// then decoding that string back into an image to redraw onto a second full-size canvas, doubles
// both the memory footprint and the encode/decode work for no benefit here, and was enough to
// crash the tab on a large export. No DOM attachment is needed either: unlike downloadSVGAsPNG,
// nothing here reads clientWidth/clientHeight - the output size comes straight from the layout.
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
