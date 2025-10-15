import { HierarchyRectangularNode } from "@visx/hierarchy/lib/types";
import { TreemapNode } from "./types";

export function getLabelPlacement(
    node: HierarchyRectangularNode<TreemapNode<any>>,
    placement: string,
) {
    const padding = 6;
    const cx = (node.x0 + node.x1) / 2;
    const cy = (node.y0 + node.y1) / 2;

    switch (placement) {
        case "topLeft":
            return {
                textX: node.x0 + padding,
                textY: node.y0 + 14,
                valueY: node.y0 + 44,
                anchor: "start",
                baseline: "hanging",
            };
        case "topRight":
            return {
                textX: node.x1 - padding,
                textY: node.y0 + 14,
                valueY: node.y0 + 44,
                anchor: "end",
                baseline: "hanging",
            };
        case "bottomLeft":
            return {
                textX: node.x0 + padding,
                textY: node.y1 - 34,
                valueY: node.y1 - 14,
                anchor: "start",
                baseline: "baseline",
            };
        case "bottomRight":
            return {
                textX: node.x1 - padding,
                textY: node.y1 - 34,
                valueY: node.y1 - 14,
                anchor: "end",
                baseline: "baseline",
            };
        case "middle":
        default:
            return {
                textX: cx,
                textY: cy - 5,
                valueY: cy + 15,
                anchor: "middle",
                baseline: "middle",
            };
    }
}

export function measureTextWidth(text: string, fontSize: number, fontFamily: string) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return 0;
    ctx.font = `${fontSize}px ${fontFamily}`;
    return ctx.measureText(text).width;
}

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

  return truncated + "…";
}
