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

  const link = node.parent
    ? { source: node.parent, target: node }
    : null;

  const [baseNodeX, baseNodeY] = pointRadial(node.x, node.y);
  const [scaledNodeX, scaledNodeY] = pointRadial(
    node.x,
    getBranchLengthScaledY(node.data.cumulative_branch_length ?? 0)
  );

  console.log("rerendering")

  const branchIsHighlighted = node.leaves().some(leaf => highlighted?.includes(leaf.data.id))

  return (
    <g className={styles.node}>
      {link ? (
        <g className={styles.branch}>
          <TreeLink
            link={link}
            className={`${styles.link} ${branchIsHighlighted ? styles.highlighted : ""}`}
            stroke="#999"
            getBranchLengthScaledY={getBranchLengthScaledY}
            enableBranchLengths={enableBranchLengths}
          />

          {/* SUBTREE MOVED INSIDE BRANCH */}
          {node.children && (
            <g className={styles.subtree}>
              {node.children.map((child) => (
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
          )}
        </g>
      ) : (
        // ROOT NODE (no parent link)
        node.children?.map((child) => (
          <RenderTree
            key={child.data.id}
            node={child}
            enableBranchLengths={enableBranchLengths}
            getBranchLengthScaledY={getBranchLengthScaledY}
            highlighted={highlighted}
            getColor={getColor}
            getLabel={getLabel}
          />
        ))
      )}

      {isLeaf && (
        <LeafNode
          node={node}
          className={`${styles.leaf} ${
            highlighted?.includes(node.data.id) ? styles.highlighted : ""
          }`}
          baseNodeX={baseNodeX}
          baseNodeY={baseNodeY}
          scaledNodeX={scaledNodeX}
          scaledNodeY={scaledNodeY}
          label={getLabel(node.data)}
          color={getColor(node.data)}
          mode={enableBranchLengths ? "scaled" : "base"}
        />
      )}
    </g>
  );
});
