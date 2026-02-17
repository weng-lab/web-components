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
  // Instead of prop drilling is context more performant?
  onLeafMouseEnter: (event: React.MouseEvent, node: HierarchyPointNode<TreeItem>) => void
  onLeafMouseLeave: (event: React.MouseEvent, node: HierarchyPointNode<TreeItem>) => void
};

//Now our issue is that the math is being rerun every single time

export const RenderTree = memo(function RenderTree({
  node,
  enableBranchLengths,
  getBranchLengthScaledY,
  getColor = () => "black",
  getLabel = (item) => item.id,
  onLeafMouseEnter,
  onLeafMouseLeave,
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

  // console.log("rerendering")

  const branchIsHighlighted = node.leaves().some(leaf => highlighted?.includes(leaf.data.id))

  // Should we move to rendering links to children instead of links to parents? It would remove the link ternary
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

          <g className={styles.subtree}>
            {/* SUBTREE MOVED INSIDE BRANCH */}
            {node.children &&
              node.children.map((child) => (
                <RenderTree
                  key={child.data.id}
                  node={child}
                  enableBranchLengths={enableBranchLengths}
                  getBranchLengthScaledY={getBranchLengthScaledY}
                  highlighted={highlighted}
                  getColor={getColor}
                  getLabel={getLabel}
                  onLeafMouseEnter={onLeafMouseEnter}
                  onLeafMouseLeave={onLeafMouseLeave}
                />
              ))}
            {isLeaf && (
              <LeafNode
                node={node}
                className={`${styles.leaf} ${highlighted?.includes(node.data.id) ? styles.highlighted : ""}`}
                baseNodeX={baseNodeX}
                baseNodeY={baseNodeY}
                scaledNodeX={scaledNodeX}
                scaledNodeY={scaledNodeY}
                label={getLabel(node.data)}
                color={getColor(node.data)}
                mode={enableBranchLengths ? "scaled" : "base"}
                onMouseEnter={onLeafMouseEnter}
                onMouseLeave={onLeafMouseLeave}
              />
            )}
          </g>
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
            onLeafMouseEnter={onLeafMouseEnter}
            onLeafMouseLeave={onLeafMouseLeave}
          />
        ))
      )}
    </g>
  );
});
