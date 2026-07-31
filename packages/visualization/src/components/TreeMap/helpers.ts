import { HierarchyRectangularNode } from "@visx/hierarchy";
import { TreemapNode, TreemapProps } from "./types";

//get coords for label placement based on user input
export function getLabelPlacement(
    node: HierarchyRectangularNode<TreemapNode<any>>,
    placement: TreemapProps<any>["labelPlacement"],
    showValue?: boolean,
    hasChildren?: boolean
) {
    const padding = 6;
    const cx = (node.x0 + node.x1) / 2;
    const cy = (node.y0 + node.y1) / 2;

    switch (placement) {
        case "topLeft":
            return {
                textX: node.x0 + padding,
                textY: node.y0 + 10,
                valueY: hasChildren ? node.y0 + 17 : node.y0 + 40,
                valueX: hasChildren ? node.x1 - padding : node.x0 + padding,
                textAnchor: "start",
                valueAnchor: hasChildren ? "end" : "start",
                baseline: "hanging",
            } as const;
        case "topRight":
            return {
                textX: node.x1 - padding,
                textY: node.y0 + 10,
                valueY: node.y0 + 40,
                valueX: node.x1 - padding,
                textAnchor: "end",
                valueAnchor: "end",
                baseline: "hanging",
            } as const;
        case "bottomLeft":
            return {
                textX: node.x0 + padding,
                textY: showValue ? node.y1 - 35 : node.y1 - 15 ,
                valueY: node.y1 - 15,
                valueX: node.x0 + padding,
                textAnchor: "start",
                valueAnchor: "start",
                baseline: "alphabetic",
            } as const;
        case "bottomRight":
            return {
                textX: node.x1 - padding,
                textY: showValue ? node.y1 - 35 : node.y1 - 15,
                valueY: node.y1 - 15,
                valueX: node.x1 - padding,
                textAnchor: "end",
                valueAnchor: "end",
                baseline: "alphabetic",
            } as const;
        case "middle":
        default:
            return {
                textX: cx,
                textY: showValue ? cy - 5 : cy + 5,
                valueY: cy + 15,
                valueX: cx,
                textAnchor: "middle",
                valueAnchor: "middle",
                baseline: "middle",
            } as const;
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
