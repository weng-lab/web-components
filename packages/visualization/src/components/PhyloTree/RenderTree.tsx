import { HierarchyPointLink, HierarchyPointNode } from "d3-hierarchy";
import { PhyloTreeProps, TreeItem } from "./types";
import { TreeLink } from "./TreeLink";
import { LeafNode } from "./LeafNode";
import { pointRadial } from "d3-shape";
import styles from "./PhyloTree.module.css";
import { memo } from "react";

export type RenderTreeProps = {
  node: HierarchyPointNode<TreeItem>
  enableBranchLengths: boolean;
  highlighted: PhyloTreeProps["highlighted"];
  getBranchLengthScaledY: (cumulativeBranchLength: number) => number;
  getColor: PhyloTreeProps["getColor"];
  getLabel: PhyloTreeProps["getLabel"];
};

/**
 * This takes in the root node, and renders all links and leaf nodes
 */
export const RenderTree = memo(function RenderTree({
  node,
  enableBranchLengths,
  getBranchLengthScaledY,
  getColor = () => "black",
  getLabel = (item) => item.id,
  highlighted,
}: RenderTreeProps) {
  const isLeaf = !node.children?.length;

  const link = node.parent ? {
    source: node.parent,
    target: node
  } : null

  //Where should the tooltip live?

  const [baseNodeX, baseNodeY] = pointRadial(node.x, node.y);
  const [scaledNodeX, scaledNodeY] = pointRadial(
    node.x,
    getBranchLengthScaledY(node.data.cumulative_branch_length ?? 0)
  );

  return (
    <g className={styles.node}>
      {link && (
        <TreeLink
          link={link}
          // To be changed
          stroke={"#999"}
          strokeWidth={1}
          getBranchLengthScaledY={getBranchLengthScaledY}
          enableBranchLengths={enableBranchLengths}
        />
      )}
      {/* Should separate out the connector line from the leaf node to separate */}
      {isLeaf && (
        <LeafNode
          node={node}
          selected={!!highlighted?.includes(node.data.id)}
          baseNodeX={baseNodeX}
          baseNodeY={baseNodeY}
          scaledNodeX={scaledNodeX}
          scaledNodeY={scaledNodeY}
          label={getLabel(node.data)}
          color={getColor(node.data)}
          mode={enableBranchLengths ? "scaled" : "base"}
        />
      )}
      {node.children?.map((child) => (
        <RenderTree
          key={child.data.id}
          node={child}
          enableBranchLengths={enableBranchLengths}
          getBranchLengthScaledY={getBranchLengthScaledY}
          highlighted={highlighted}
          getColor={getColor}
          getLabel={getLabel}
        />
      ))}
    </g>
  );
})
