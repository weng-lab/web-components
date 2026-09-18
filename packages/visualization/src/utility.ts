import downloadjs from 'downloadjs';
import domtoimage from 'dom-to-image';
import { easeOut, Transition } from "framer-motion";

export type AnimationType = "fade" | "scale" | "slideUp" | "slideRight" | "pop";

export interface DownloadPlotHandle {
  // May return a Promise: callers driving a loading indicator (e.g. DownloadModal) await it to
  // keep the indicator up for as long as the export actually takes.
  downloadSVG: () => void | Promise<void>;
  downloadPNG: () => void | Promise<void>;
}

/**
 * Used to combine canvas and svg elements in scatterplot
 */
export function downloadDivAsPNG(
    target: HTMLElement | null,
    filename = "scatterPlot.png",
    scale = window.devicePixelRatio || 2
) {
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const size = Math.ceil(Math.max(rect.width, rect.height));

    domtoimage
        .toPng(target, {
            width: size * scale,
            height: size * scale,
            style: {
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                width: `${size}px`,
                height: `${size}px`,
                overflow: "visible",
            },
        })
        .then((dataUrl) => {
            downloadjs(dataUrl, filename, "image/png");
        })
        .catch((error) => {
            console.error("Download failed:", error);
        });
}

/**
 * Used to combine canvas and svg elements in scatterplot
 */
export function downloadDivAsSVG(
    target: HTMLElement | null,
    filename: string = 'scatterPlot.svg'
) {
    if (!target) return;

    domtoimage
        .toSvg(target)
        .then((dataUrl) => {
            // Convert the returned SVG data URL into a downloadable file
            downloadjs(dataUrl, filename, 'image/svg+xml');
        })
        .catch((error) => {
            console.error('SVG download failed:', error);
        });
}

/**
 * Triggers a browser download of an already-built blob via a throwaway <a download> click.
 */
export function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Downloads an SVG element as an .svg file
 */
export function downloadAsSVG(svgElement: SVGSVGElement, fileName = "chart.svg") {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    downloadBlob(new Blob([svgString], { type: "image/svg+xml;charset=utf-8" }), fileName);
}

// Browsers silently produce a blank canvas (rather than throwing) once a canvas's pixel
// dimensions or total area get too large - the exact threshold varies by browser, so this stays
// comfortably under the tightest known limits rather than the most permissive one.
export const MAX_CANVAS_EXPORT_DIMENSION = 16384;
export const MAX_CANVAS_EXPORT_PIXELS = MAX_CANVAS_EXPORT_DIMENSION * MAX_CANVAS_EXPORT_DIMENSION;

/**
 * Converts an SVG element to PNG and downloads it. svgElement must be attached to the document
 * (clientWidth/clientHeight are read from its layout box) for the whole duration of the export -
 * if the caller only needs it attached for this call (e.g. an off-screen node built just for
 * export), pass onComplete to know when it's safe to detach/remove it. onComplete receives
 * whether the download actually succeeded, so callers can surface a failure if they care to -
 * it's called the same way (once, eventually) on every path either way.
 */
export function downloadSVGAsPNG(svgElement: SVGSVGElement, fileName = "chart.png", scale = window.devicePixelRatio || 2, onComplete?: (success: boolean) => void) {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement("canvas");
        const width = svgElement.clientWidth || 800;
        const height = svgElement.clientHeight || 600;
        // A very large source (e.g. a full-content export of a big scrollable heatmap) can
        // otherwise ask for a canvas past what the browser will actually allocate - clamp the
        // scale down (never up) so the output always fits within a safe pixel budget.
        const clampedScale = Math.min(
            scale,
            MAX_CANVAS_EXPORT_DIMENSION / width,
            MAX_CANVAS_EXPORT_DIMENSION / height,
            Math.sqrt(MAX_CANVAS_EXPORT_PIXELS / (width * height))
        );
        canvas.width = Math.max(1, Math.round(width * clampedScale));
        canvas.height = Math.max(1, Math.round(height * clampedScale));

        const ctx = canvas.getContext("2d");
        if (!ctx) {
            onComplete?.(false);
            return;
        }

        // Ensure sharp scaling
        ctx.setTransform(clampedScale, 0, 0, clampedScale, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        canvas.toBlob((blob) => {
            if (blob) downloadBlob(blob, fileName);
            onComplete?.(!!blob);
        }, "image/png",
            1, // max quality
        );
    };
    img.onerror = () => onComplete?.(false);

    img.src = url;
}

let measureTextCanvas: HTMLCanvasElement | null = null;

/**
 * Measures the rendered width of a string without touching the DOM (no layout/reflow).
 */
export function measureTextWidth(text: string, fontSize: number, fontFamily: string): number {
    if (!measureTextCanvas) {
        measureTextCanvas = document.createElement("canvas");
    }
    const ctx = measureTextCanvas.getContext("2d");
    if (!ctx) return 0;

    ctx.font = `${fontSize}px ${fontFamily}`;
    return ctx.measureText(text).width;
}

// Maximum stagger delay (in seconds) regardless of how many bars are being animated
const MAX_ANIMATION_DELAY = 1;

export const getAnimationProps = (type: AnimationType | undefined, index: number, buffer = .03) => {
    if (!type) return {};

    const delay = Math.min(index * buffer, MAX_ANIMATION_DELAY);

    // Reusable transition object, typed properly
    const common: { transition: Transition } = {
        transition: { duration: 0.4, delay, ease: easeOut },
    };

    switch (type) {
        case "fade":
            return { initial: { opacity: 0 }, animate: { opacity: 1 }, ...common };
        case "scale":
            return { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 }, ...common };
        case "slideUp":
            return { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, ...common };
        case "slideRight":
            return { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, ...common };
        case "pop":
            const spring: Transition = {
                type: "spring" as const,
                stiffness: 150,
                damping: 12,
                delay,
            };
            return {
                initial: { scale: 0 },
                animate: { scale: 1 },
                transition: spring,
            };
        default:
            return {};
    }
};

