import downloadjs from 'downloadjs';
import domtoimage from 'dom-to-image';
import { easeOut, Transition } from "framer-motion";

export type AnimationType = "fade" | "scale" | "slideUp" | "slideRight" | "pop";

export interface DownloadPlotHandle {
  downloadSVG: () => void;
  downloadPNG: () => void;
}

/**
 * Used to combine canvas and svg elements in scatterplot
 */
export function downloadDivAsPNG(
    target: HTMLElement | null,
    filename: string = 'scatterPlot.png'
) {
    if (!target) return;

    domtoimage
        .toPng(target)
        .then((dataUrl) => {
            downloadjs(dataUrl, filename, 'image/png');
        })
        .catch((error) => {
            console.error('Download failed:', error);
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
 * Downloads an SVG element as an .svg file
 */
export function downloadAsSVG(svgElement: SVGSVGElement, fileName = "chart.svg") {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);

    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
}

/**
 * Converts an SVG element to PNG and downloads it
 */
export function downloadSVGAsPNG(svgElement: SVGSVGElement, fileName = "chart.png") {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = svgElement.clientWidth || 800;
        canvas.height = svgElement.clientHeight || 600;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        canvas.toBlob((blob) => {
            if (!blob) return;
            const pngUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = pngUrl;
            link.download = fileName;
            link.click();
            URL.revokeObjectURL(pngUrl);
        }, "image/png");
    };

    img.src = url;
}

export const getAnimationProps = (type: AnimationType | undefined, index: number) => {
    if (!type) return {};

    const delay = index * 0.03;

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

