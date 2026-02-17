import { TreeItem } from "./types";
import { HierarchyPointNode } from "d3-hierarchy";
import { Group } from "@visx/group";
import { motion } from "framer-motion";
import { useBranchLengthTransition } from "./PhyloTree";
import { memo } from "react";

export type LeafNodeProps = {
  node: HierarchyPointNode<TreeItem>;
  baseNodeX: number;
  baseNodeY: number;
  scaledNodeX: number;
  scaledNodeY: number;
  label: string;
  color: string;
  // variant: "highlighted" | "dimmed" | "normal";
  mode: "base" | "scaled";
  onMouseEnter: (event: React.MouseEvent, node: HierarchyPointNode<TreeItem>) => void;
  onMouseLeave: (event: React.MouseEvent, node: HierarchyPointNode<TreeItem>) => void;
  className?: string
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
    className,
    onMouseEnter,
    onMouseLeave,
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

    /**
     * @todo fix this thing, move all to css file versus mixing
     */
    const variant = "normal" as string

    return (
      <Group
        onMouseEnter={(e: React.MouseEvent) => onMouseEnter(e, node)}
        onMouseLeave={(e: React.MouseEvent) => onMouseLeave(e, node)}
        className={className}
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
            stroke={color}
            // strokeWidth={0}
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
, (prevProps, nextProps) => {
  const allKeys = Object.keys({ ...prevProps, ...nextProps })

  allKeys.forEach(key => {
    if (prevProps[key] !== nextProps[key]) {
      console.log(`Prop changed: ${key}`, {
        prev: prevProps[key],
        next: nextProps[key],
      })
    }
  })

  return false // force re-render for debugging
});
