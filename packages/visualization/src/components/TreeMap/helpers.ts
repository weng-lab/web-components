import { HierarchyRectangularNode } from "@visx/hierarchy/lib/types";
import { AnimationType, TreemapNode } from "./types";
import { easeOut, Transition } from "framer-motion";

//get coords for label placement based on user input
export function getLabelPlacement(
    node: HierarchyRectangularNode<TreemapNode<any>>,
    placement: string,
    showValue?: boolean
) {
    const padding = 6;
    const cx = (node.x0 + node.x1) / 2;
    const cy = (node.y0 + node.y1) / 2;

    switch (placement) {
        case "topLeft":
            return {
                textX: node.x0 + padding,
                textY: node.y0 + 10,
                valueY: node.y0 + 40,
                anchor: "start",
                baseline: "hanging",
            };
        case "topRight":
            return {
                textX: node.x1 - padding,
                textY: node.y0 + 10,
                valueY: node.y0 + 40,
                anchor: "end",
                baseline: "hanging",
            };
        case "bottomLeft":
            return {
                textX: node.x0 + padding,
                textY: showValue ? node.y1 - 35 : node.y1 - 15 ,
                valueY: node.y1 - 15,
                anchor: "start",
                baseline: "baseline",
            };
        case "bottomRight":
            return {
                textX: node.x1 - padding,
                textY: showValue ? node.y1 - 35 : node.y1 - 15,
                valueY: node.y1 - 15,
                anchor: "end",
                baseline: "baseline",
            };
        case "middle":
        default:
            return {
                textX: cx,
                textY: showValue ? cy - 5 : cy + 5,
                valueY: cy + 15,
                anchor: "middle",
                baseline: "middle",
            };
    }
}

//Check if text exceeds box
export function measureTextWidth(text: string, fontSize: number, fontFamily: string) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return 0;
    ctx.font = `${fontSize}px ${fontFamily}`;
    return ctx.measureText(text).width;
}

//truncate text with ... to fit in box
export function truncateTextToWidth(
  text: string,
  maxWidth: number,
  fontSize: number,
  fontFamily: string
): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return text;

  ctx.font = `${fontSize}px ${fontFamily}`;
  if (ctx.measureText(text).width <= maxWidth) return text;

  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + "…").width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }

  const result = truncated === "" ? "" : truncated + "..."

  return result;
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