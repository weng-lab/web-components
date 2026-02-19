import { HierarchyPointNode } from "d3-hierarchy";
import { PhyloTreeProps, TreeItem } from "./types";
import { TreeLink } from "./TreeLink";
import { LeafNode } from "./LeafNode";
import { pointRadial } from "d3-shape";
import styles from "./PhyloTree.module.css";
import { memo } from "react";

export type RenderTreeProps = {
  node: HierarchyPointNode<TreeItem>;
  enableBranchLengths: boolean;
  highlighted: PhyloTreeProps["highlighted"];
  getColor: PhyloTreeProps["getColor"];
  getLabel: PhyloTreeProps["getLabel"];
  leafFontSize: PhyloTreeProps["leafFontSize"];
  leafFontFamily: PhyloTreeProps["leafFontFamily"];
  // Instead of prop drilling is context more performant?
  onLeafMouseEnter: (event: React.MouseEvent, node: HierarchyPointNode<TreeItem>) => void;
  onLeafMouseLeave: (event: React.MouseEvent, node: HierarchyPointNode<TreeItem>) => void;
};

//Now our issue is that the math is being rerun every single time

export const RenderTree = memo(function RenderTree({
  node,
  enableBranchLengths,
  getColor = () => "black",
  getLabel = (item) => item.id,
  onLeafMouseEnter,
  onLeafMouseLeave,
  leafFontSize,
  leafFontFamily,
  highlighted,
}: RenderTreeProps) {
  const isLeaf = !node.children?.length;

  return (
    <g className={styles.node}>
      {isLeaf && (
        <LeafNode
          node={node}
          fontFamily={leafFontFamily}
          fontSize={leafFontSize}
          className={`${styles.leaf} ${highlighted?.includes(node.data.id) ? styles.highlighted : ""}`}
          baseNodeX={node.data.baseNodeX ?? 0}
          baseNodeY={node.data.baseNodeY ?? 0}
          scaledNodeX={node.data.scaledNodeX ?? 0}
          scaledNodeY={node.data.scaledNodeY ?? 0}
          label={getLabel(node.data)}
          color={getColor(node.data)}
          mode={enableBranchLengths ? "scaled" : "base"}
          onMouseEnter={onLeafMouseEnter}
          onMouseLeave={onLeafMouseLeave}
        />
      )}
      {node.children?.map((child) => {
        const link = { source: node, target: child };

        return (
          <g className={styles.branch} key={child.data.id}>
            <TreeLink
              link={link}
              stroke={child.data.uniform_leaf_color ?? "#666"}
              className={styles.link}
              enableBranchLengths={enableBranchLengths}
            />
            <RenderTree
              node={child}
              leafFontFamily={leafFontFamily}
              leafFontSize={leafFontSize}
              enableBranchLengths={enableBranchLengths}
              highlighted={highlighted}
              getColor={getColor}
              getLabel={getLabel}
              onLeafMouseEnter={onLeafMouseEnter}
              onLeafMouseLeave={onLeafMouseLeave}
            />
          </g>
        );
      })}
    </g>
  );
});