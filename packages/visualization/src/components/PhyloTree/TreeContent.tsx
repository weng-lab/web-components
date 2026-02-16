import { HierarchyPointLink, HierarchyPointNode } from "d3-hierarchy";
import { memo, useCallback, useRef, useState } from "react";
import { PhyloTreeProps, TreeItem } from "./types";
import { Group } from "@visx/group";
import { TreeLink } from "./TreeLink";
import { LeafNode } from "./LeafNode";
import { useTooltip } from "@visx/tooltip";

type TreeContentProps = {
  origin: { x: number; y: number };
  links: HierarchyPointLink<TreeItem>[];
  leafNodesWithPositions: {
    node: HierarchyPointNode<TreeItem>;
    baseNodeX: number;
    baseNodeY: number;
    scaledNodeX: number;
    scaledNodeY: number;
  }[];
  enableBranchLengths: boolean;
  highlighted: PhyloTreeProps["highlighted"];
  getBranchLengthScaledY: (cumulativeBranchLength: number) => number;
  getColor: PhyloTreeProps["getColor"];
  getLabel: PhyloTreeProps["getLabel"];
};

export const TreeContent = memo(function TreeContent({
  origin,
  links,
  leafNodesWithPositions,
  enableBranchLengths,
  highlighted = [],
  getBranchLengthScaledY,
  getColor = () => "black",
  getLabel = (item) => item.id,
}: TreeContentProps) {
  const [hoveredLeaf, setHoveredLeaf] = useState<HierarchyPointNode<TreeItem> | null>(null);
  const [hoveredBranchTarget, setHoveredBranchTarget] = useState<HierarchyPointNode<TreeItem> | null>(null);
  const { tooltipData, tooltipLeft, tooltipTop, showTooltip, hideTooltip } = useTooltip<TreeItem>();
  /**
   * @todo fix the tooltip behavior. Right now would need to define the ref in ZoomFrame which can be done but is eh
   */
  const containerRef = useRef<HTMLDivElement | null>(null);

  const getLeafNodeState = useCallback(
    (node: HierarchyPointNode<TreeItem>) => {
      const thisLeafIsHovered = hoveredLeaf === node;
      const ancestorLinkIsHovered = node.ancestors().some((node) => node === hoveredBranchTarget);
      const somethingIsHovered = hoveredLeaf !== null || hoveredBranchTarget !== null;
      const thisLeafIsHighlighted = highlighted.includes(node.data.id);

      const shouldHighlight = somethingIsHovered ? thisLeafIsHovered || ancestorLinkIsHovered : thisLeafIsHighlighted;

      const state = shouldHighlight ? "highlighted" : somethingIsHovered ? "dimmed" : "normal";

      return state;
    },
    [hoveredLeaf, hoveredBranchTarget, highlighted]
  );

  const getLinkIsHighlighted = useCallback(
    (link: HierarchyPointLink<TreeItem>) => {
      const targetLeafIsHovered = link.target.leaves().some((leafNode) => leafNode === hoveredLeaf);
      const targetAncestorLinkIsHovered = link.target.ancestors().some((node) => node === hoveredBranchTarget);
      const targetLeafIsHighlighted = link.target.leaves().some((leafNode) => highlighted.includes(leafNode.data.id));
      const somethingIsHovered = hoveredLeaf !== null || hoveredBranchTarget !== null;

      return targetAncestorLinkIsHovered || targetLeafIsHovered || (!somethingIsHovered && targetLeafIsHighlighted);
    },
    [hoveredLeaf, hoveredBranchTarget, highlighted]
  );

  const getLinkColor = useCallback(
    (link: HierarchyPointLink<TreeItem>) => {
      const targetLeafIsHovered = link.target.leaves().some((leafNode) => leafNode === hoveredLeaf);
      const hoveredLeafColor = hoveredLeaf && targetLeafIsHovered ? getColor(hoveredLeaf.data) : null;

      return hoveredLeafColor ?? "#999";
    },
    [hoveredLeaf, hoveredBranchTarget, highlighted]
  );

  const handleLinkOnMouseEnter = useCallback((l: HierarchyPointLink<TreeItem>) => setHoveredBranchTarget(l.target), []);
  const handleLinkOnMouseLeave = useCallback(() => setHoveredBranchTarget(null), []);

  const handleLeafOnMouseMove = useCallback((e: React.MouseEvent, node: HierarchyPointNode<TreeItem>) => {
    setHoveredLeaf(node);

    const rect = containerRef.current?.getBoundingClientRect();
    const left = e.clientX - (rect?.left ?? 0);
    const top = e.clientY - (rect?.top ?? 0);

    showTooltip({
      tooltipData: node.data,
      tooltipLeft: left,
      tooltipTop: top,
    });
  }, []);

  const handleLeafOnMouseLeave = useCallback(() => {
    setHoveredLeaf(null);
    hideTooltip();
  }, []);

  return (
    <Group top={origin.y} left={origin.x}>
      {links.map((link, i) => {
        return (
          <TreeLink
            key={i}
            link={link}
            enableBranchLengths={enableBranchLengths}
            stroke={getLinkColor(link)}
            strokeWidth={getLinkIsHighlighted(link) ? 2 : 1}
            getBranchLengthScaledY={getBranchLengthScaledY}
            // onMouseEnter={handleLinkOnMouseEnter}
            // onMouseLeave={handleLinkOnMouseLeave}
          />
        );
      })}
      {leafNodesWithPositions.map((leaf, i) => {
        return (
          <LeafNode
            key={i}
            node={leaf.node}
            baseNodeX={leaf.baseNodeX}
            baseNodeY={leaf.baseNodeY}
            scaledNodeX={leaf.scaledNodeX}
            scaledNodeY={leaf.scaledNodeY}
            label={getLabel(leaf.node.data)}
            color={getColor(leaf.node.data)}
            variant={getLeafNodeState(leaf.node)}
            mode={enableBranchLengths ? "scaled" : "base"}
            onMouseMove={handleLeafOnMouseMove}
            onMouseLeave={handleLeafOnMouseLeave}
          />
        );
      })}
    </Group>
  );
});
