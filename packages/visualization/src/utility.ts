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
// Seconds, for every type but "pop"
const ANIMATION_DURATION = 0.4;
const POP_SPRING = { stiffness: 150, damping: 12 };

// Each type's starting pose. All come to rest at opacity 1, scale 1 and no offset.
const ANIMATION_START: Record<AnimationType, { opacity?: number; scale?: number; x?: number; y?: number }> = {
    fade: { opacity: 0 },
    scale: { opacity: 0, scale: 0.8 },
    slideUp: { opacity: 0, y: 20 },
    slideRight: { opacity: 0, x: -20 },
    pop: { scale: 0 },
};

export const getAnimationProps = (type: AnimationType | undefined, index: number, buffer = .03) => {
    if (!type) return {};

    const delay = Math.min(index * buffer, MAX_ANIMATION_DELAY);

    // Reusable transition object, typed properly
    const common: { transition: Transition } = {
        transition: { duration: ANIMATION_DURATION, delay, ease: easeOut },
    };

    switch (type) {
        case "fade":
            return { initial: ANIMATION_START.fade, animate: { opacity: 1 }, ...common };
        case "scale":
            return { initial: ANIMATION_START.scale, animate: { opacity: 1, scale: 1 }, ...common };
        case "slideUp":
            return { initial: ANIMATION_START.slideUp, animate: { opacity: 1, y: 0 }, ...common };
        case "slideRight":
            return { initial: ANIMATION_START.slideRight, animate: { opacity: 1, x: 0 }, ...common };
        case "pop":
            const spring: Transition = {
                type: "spring" as const,
                ...POP_SPRING,
                delay,
            };
            return {
                initial: ANIMATION_START.pop,
                animate: { scale: 1 },
                transition: spring,
            };
        default:
            return {};
    }
};

/** A mark partway through its entry animation. */
export interface AnimationPose {
    opacity: number;
    scale: number;
    /** Offset from its resting place, in px. */
    x: number;
    y: number;
    done: boolean;
}

const AT_REST: AnimationPose = { opacity: 1, scale: 1, x: 0, y: 0, done: true };

// POP_SPRING in closed form, as framer-motion runs it: an underdamped oscillator (mass 1) released
// from 0 toward 1, so it overshoots before settling.
const popUndamped = Math.sqrt(POP_SPRING.stiffness);
const popDecay = POP_SPRING.damping / 2;
const popFrequency = Math.sqrt(popUndamped * popUndamped - popDecay * popDecay);
const popAt = (t: number) =>
    1 - Math.exp(-popDecay * t) * (Math.cos(popFrequency * t) + (popDecay / popFrequency) * Math.sin(popFrequency * t));
// Once its swing is under half a percent, too little to see.
const POP_SETTLE = Math.log(Math.hypot(1, popDecay / popFrequency) / 0.005) / popDecay;

/**
 * getAnimationProps's animation sampled `elapsed` seconds in, for renderers that paint their own
 * frames (a canvas).
 */
export const getAnimationPose = (type: AnimationType, index: number, elapsed: number, buffer = .03): AnimationPose => {
    const start = ANIMATION_START[type];
    if (!start) return AT_REST;
    const t = elapsed - Math.min(index * buffer, MAX_ANIMATION_DELAY);
    const isPop = type === "pop";
    if (t >= (isPop ? POP_SETTLE : ANIMATION_DURATION)) return AT_REST;

    // 0 until the delay is up, then toward 1 - past it while the spring overshoots.
    const progress = t <= 0 ? 0 : isPop ? popAt(t) : easeOut(t / ANIMATION_DURATION);
    const towardOne = (from = 1) => from + (1 - from) * progress;
    return {
        opacity: towardOne(start.opacity),
        scale: towardOne(start.scale),
        x: (start.x ?? 0) * (1 - progress),
        y: (start.y ?? 0) * (1 - progress),
        done: false,
    };
};

