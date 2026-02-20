import { PhyloTreeProps, TreeNode } from "./types";
import { Group } from "@visx/group";
import { memo } from "react";
import styles from "./PhyloTree.module.css";


export type LeafNodeLabelProps = {
  // node.x is the angle the node is at in radial layout while base/scaled are true x/y position in svg
  nodeX: number;
  baseNodeX: TreeNode["baseNodeX"];
  baseNodeY: TreeNode["baseNodeY"];
  label: TreeNode["label"];
  color: TreeNode["color"];
  fontSize: PhyloTreeProps["leafFontSize"];
  fontFamily: PhyloTreeProps["leafFontFamily"];
  strokeWidth: TreeNode["labelStrokeWidth"]
};

export const LeafNodeLabel = memo(function LeafNodeLabel({
  nodeX,
  color,
  baseNodeX,
  baseNodeY,
  label,
  fontSize,
  fontFamily,
  strokeWidth
}: LeafNodeLabelProps) {
  const angleDeg = (nodeX * 180) / Math.PI - 90;
  const flip = angleDeg > 90 || angleDeg < -90;
  const rotation = flip ? angleDeg + 180 : angleDeg;
  const textAnchor: "start" | "end" = flip ? "end" : "start";
  const xOffset = flip ? -6 : 6;

  return (
    <Group
      top={baseNodeY}
      left={baseNodeX}
      className={styles.leafLabel}
    >
      <text
        fontSize={fontSize}
        fontFamily={fontFamily}
        fill={color}
        stroke={color}
        strokeWidth={strokeWidth}
        paintOrder="stroke"
        transform={`rotate(${rotation}) translate(0, ${(fontSize ?? 2.4) / 3})`}
        textAnchor={textAnchor}
        x={xOffset}
      >
        {label === "Human" ? `${label} \u2605\u2605\u2605` : label}
      </text>
      <circle
        r={1.5}
        fill={color}
      />
    </Group>
  );
});
