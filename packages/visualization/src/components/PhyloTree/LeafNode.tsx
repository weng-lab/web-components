import { TreeItem } from "./types";
import { HierarchyPointNode } from "d3-hierarchy";
import { Group } from "@visx/group";
import { motion } from "framer-motion";
import { useBranchLengthTransition } from "./PhyloTree";
import { memo } from "react";
import styles from "./PhyloTree.module.css";

export type LeafNodeProps = {
  node: HierarchyPointNode<TreeItem>;
  baseNodeX: number;
  baseNodeY: number;
  scaledNodeX: number;
  scaledNodeY: number;
  label: string;
  color: string;
  selected: boolean;
  // variant: "highlighted" | "dimmed" | "normal";
  mode: "base" | "scaled";
  // onMouseMove: (event: React.MouseEvent, node: HierarchyPointNode<TreeItem>) => void;
  // onMouseLeave: (event: React.MouseEvent, node: HierarchyPointNode<TreeItem>) => void;
};

const t = "0.2s ease-in-out";

export const LeafNode = memo(function LeafNode
  ({
    node,
    mode,
    color,
    baseNodeX,
    baseNodeY,
    scaledNodeX,
    scaledNodeY,
    label,
    selected
    // variant,
    // onMouseMove,
    // onMouseLeave,
  }: LeafNodeProps) {
    const angleDeg = (node.x * 180) / Math.PI - 90;
    const flip = angleDeg > 90 || angleDeg < -90;
    const rotation = flip ? angleDeg + 180 : angleDeg;
    const textAnchor: "start" | "end" = flip ? "end" : "start";
    const xOffset = flip ? -6 : 6;

    const connectorLineVariants: Record<typeof mode, { x1: number; x2: number; y1: number; y2: number }> = {
      base: { x1: baseNodeX, x2: baseNodeX, y1: baseNodeY, y2: baseNodeY },
      scaled: { x1: scaledNodeX, x2: baseNodeX, y1: scaledNodeY, y2: baseNodeY },
    };

    const variant = "normal" as string

    return (
      <Group
        // onMouseMove={(e: React.MouseEvent) => onMouseMove(e, node)}
        // onMouseLeave={(e: React.MouseEvent) => onMouseLeave(e, node)}
        className={`${styles.node} ${styles.leaf} ${selected ? styles.selected : ""}`}
      >
        <motion.line
          initial={false}
          animate={mode}
          variants={connectorLineVariants}
          stroke={color}
          transition={useBranchLengthTransition}
          style={{
            opacity: variant === "highlighted" ? 1 : 0.2,
            transition: `opacity ${t}`,
          }}
        />
        <Group top={baseNodeY} left={baseNodeX}>
          <text
            fontSize={8}
            fontFamily="Arial"
            fill={color}
            opacity={variant === "dimmed" ? 0.5 : 1}
            stroke={variant === "highlighted" ? color : "none"}
            strokeWidth={variant === "highlighted" ? 0.5 : 0}
            paintOrder="stroke"
            transform={`rotate(${rotation}) translate(0, 2.4)`}
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
      </Group>
    );
  }
);
