import { PhyloTreeProps, TreeItem } from "./types";
import { HierarchyPointNode } from "d3-hierarchy";
import { Group } from "@visx/group";
import { memo } from "react";
import { LinkExtension } from "./LinkExtension";
import { LeafNodeLabel } from "./LeafNodeLabel";

export type LeafNodeProps = {
  node: HierarchyPointNode<TreeItem>;
  baseNodeX: number;
  baseNodeY: number;
  scaledNodeX: number;
  scaledNodeY: number;
  label: string;
  color: string;
  fontSize: PhyloTreeProps["leafFontSize"];
  fontFamily: PhyloTreeProps["leafFontFamily"];
  mode: "base" | "scaled";
  onMouseEnter: (event: React.MouseEvent, node: HierarchyPointNode<TreeItem>) => void;
  onMouseLeave: (event: React.MouseEvent, node: HierarchyPointNode<TreeItem>) => void;
  className?: string;
};

export const LeafNode = memo(function LeafNode({
  node,
  mode,
  color,
  baseNodeX,
  baseNodeY,
  scaledNodeX,
  scaledNodeY,
  label,
  fontSize,
  fontFamily,
  className,
  onMouseEnter,
  onMouseLeave,
}: LeafNodeProps) {

  return (
    <Group
      onMouseEnter={(e: React.MouseEvent) => onMouseEnter(e, node)}
      onMouseLeave={(e: React.MouseEvent) => onMouseLeave(e, node)}
      className={className}
    >
      <LinkExtension
        baseNodeX={baseNodeX}
        baseNodeY={baseNodeY}
        scaledNodeX={scaledNodeX}
        scaledNodeY={scaledNodeY}
        color={color}
        mode={mode}
      />
      <LeafNodeLabel
        nodeX={node.x}
        baseNodeX={baseNodeX}
        baseNodeY={baseNodeY}
        label={label}
        color={color}
        fontSize={fontSize}
        fontFamily={fontFamily}
      />
    </Group>
  );
});
