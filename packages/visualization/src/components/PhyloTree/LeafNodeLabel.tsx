import { PhyloTreeProps, TreeItem } from "./types";
import { HierarchyPointNode } from "d3-hierarchy";
import { Group } from "@visx/group";
import { memo } from "react";

export type LeafNodeLabelProps = {
  // node.x is the angle the node is at in radial layout while base/scaled are true x/y position in svg
  nodeX: number;
  baseNodeX: number;
  baseNodeY: number;
  label: string;
  color: string;
  fontSize: PhyloTreeProps["leafFontSize"];
  fontFamily: PhyloTreeProps["leafFontFamily"];
};

const t = "0.2s ease-in-out";

export const LeafNodeLabel = memo(function LeafNodeLabel({
  nodeX,
  color,
  baseNodeX,
  baseNodeY,
  label,
  fontSize,
  fontFamily,
}: LeafNodeLabelProps) {
  const angleDeg = (nodeX * 180) / Math.PI - 90;
  const flip = angleDeg > 90 || angleDeg < -90;
  const rotation = flip ? angleDeg + 180 : angleDeg;
  const textAnchor: "start" | "end" = flip ? "end" : "start";
  const xOffset = flip ? -6 : 6;

  /**
   * @todo fix this thing, move all to css file versus mixing
   */
  const variant = "normal" as string;

  return (
    <Group
      top={baseNodeY}
      left={baseNodeX}
    >
      <text
        fontSize={fontSize}
        fontFamily={fontFamily}
        fill={color}
        opacity={variant === "dimmed" ? 0.5 : 1}
        stroke={color}
        paintOrder="stroke"
        transform={`rotate(${rotation}) translate(0, ${(fontSize ?? 2.4) / 3})`}
        textAnchor={textAnchor}
        x={xOffset}
        style={{
          transition: `opacity ${t}, stroke-width ${t}`,
        }}
      >
        {label === "Human" ? `${label} \u2605\u2605\u2605` : label}
      </text>
      <circle
        r={1.5}
        transform={variant === "highlighted" ? "scale(1.5)" : "scale(1)"}
        style={{ transition: `transform ${t}, opacity ${t}` }}
        fill={color}
        opacity={variant === "dimmed" ? 0.5 : 1}
      />
    </Group>
  );
});
