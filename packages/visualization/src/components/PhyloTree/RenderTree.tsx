import { PhyloTreeProps, TreeNode } from "./types";
import { TreeLink } from "./TreeLink";
import styles from "./PhyloTree.module.css";
import { memo } from "react";
import { LeafLinkExtension } from "./LeafLinkExtension";
import { LeafNodeLabel } from "./LeafNodeLabel";

export type RenderTreeProps = {
  node: TreeNode;
  useBranchLengths: boolean;
  leafFontSize: PhyloTreeProps["leafFontSize"];
  leafFontFamily: PhyloTreeProps["leafFontFamily"];
  onLeafMouseEnter: (event: React.MouseEvent, node: TreeNode) => void;
  onLeafMouseLeave: (event: React.MouseEvent, node: TreeNode) => void;
};

export const RenderTree = memo(function RenderTree({
  node,
  useBranchLengths,
  onLeafMouseEnter,
  onLeafMouseLeave,
  leafFontSize,
  leafFontFamily,
}: RenderTreeProps) {
  const isLeaf = !node.children?.length;

  return (
    <g className={styles.node}>
      {isLeaf && (
        <g
          onMouseEnter={(e: React.MouseEvent) => onLeafMouseEnter(e, node)}
          onMouseLeave={(e: React.MouseEvent) => onLeafMouseLeave(e, node)}
          className={styles.leafGroup}
        >
          <LeafLinkExtension
            useBranchLengths={useBranchLengths}
            color={node.lightenedLinkExtColor}
            baseLeafLinkExtension={node.baseLeafLinkExtension}
            scaledLeafLinkExtension={node.scaledLeafLinkExtension}
            strokeWidth={node.linkStrokeWidth}
          />
          <LeafNodeLabel
            nodeX={node.x}
            strokeWidth={node.labelStrokeWidth}
            baseNodeX={node.baseNodeX}
            baseNodeY={node.baseNodeY}
            label={node.label}
            color={node.color}
            fontSize={leafFontSize}
            fontFamily={leafFontFamily}
          />
        </g>
      )}
      {node.children?.map((child) => {
        return (
          <g className={styles.branch} key={child.data.id}>
            <TreeLink
              scaledLinkPath={child.scaledLinkPath}
              baseLinkPath={child.baseLinkPath}
              color={child.color}
              strokeWidth={child.linkStrokeWidth}
              useBranchLengths={useBranchLengths}
            />
            <RenderTree
              node={child}
              leafFontFamily={leafFontFamily}
              leafFontSize={leafFontSize}
              useBranchLengths={useBranchLengths}
              onLeafMouseEnter={onLeafMouseEnter}
              onLeafMouseLeave={onLeafMouseLeave}
            />
          </g>
        );
      })}
    </g>
  );
});