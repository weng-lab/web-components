import { PhyloTreeProps, TreeNode } from "./types";
import { TreeLink } from "./TreeLink";
import { memo } from "react";
import { LeafLinkExtension } from "./LeafLinkExtension";
import { LeafNodeLabel } from "./LeafNodeLabel";

export type RenderTreeProps = {
  root: TreeNode;
  hoveredId: string | null;
  useBranchLengths: boolean;
  leafFontSize: PhyloTreeProps["leafFontSize"];
  leafFontFamily: PhyloTreeProps["leafFontFamily"];
  onNodeEnter: (event: React.MouseEvent, node: TreeNode) => void;
  onNodeLeave: (event: React.MouseEvent, node: TreeNode) => void;
};

export type RenderChild = {
  node: TreeNode;
  dimmed: boolean;
  useBranchLengths: boolean;
  leafFontSize: PhyloTreeProps["leafFontSize"];
  leafFontFamily: PhyloTreeProps["leafFontFamily"];
  onNodeEnter: (event: React.MouseEvent, node: TreeNode) => void;
  onNodeLeave: (event: React.MouseEvent, node: TreeNode) => void;
};

const ChildNode = memo(
  ({ node, dimmed, useBranchLengths, leafFontFamily, leafFontSize, onNodeEnter, onNodeLeave }: RenderChild) => {
    return (
      <g
        onMouseEnter={(e: React.MouseEvent) => onNodeEnter(e, node)}
        onMouseLeave={(e: React.MouseEvent) => onNodeLeave(e, node)}
        id={node.data.id}
        opacity={dimmed ? 0.2 : 1}
        style={{ transition: "opacity 0.2s ease-in" }}
      >
        <TreeLink
          scaledLinkPath={node.scaledLinkPath}
          baseLinkPath={node.baseLinkPath}
          color={node.color}
          strokeWidth={node.linkStrokeWidth}
          useBranchLengths={useBranchLengths}
          />
        {!node.children && (
          <>
          {/* Would need to draw the element here */}
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
          </>
        )}
      </g>
    );
  }
);

export const RenderTree = memo(function RenderTree({
  root,
  hoveredId,
  useBranchLengths,
  onNodeEnter,
  onNodeLeave,
  leafFontSize,
  leafFontFamily,
}: RenderTreeProps) {
  return (
    <g id={"tree-root"}>
      {/* no root node rendered (since root does not need to display link to parent) */}
      {root.descendants()?.map((node, i) => {
        if (!node.parent) return;
        const dimmed = !!hoveredId && !(node.descendantIds?.has(hoveredId) || node.ancestorIds?.has(hoveredId));

        return (
          <ChildNode
            key={i}
            node={node}
            dimmed={dimmed}
            useBranchLengths={useBranchLengths}
            leafFontSize={leafFontSize}
            leafFontFamily={leafFontFamily}
            onNodeEnter={onNodeEnter}
            onNodeLeave={onNodeLeave}
          />
        );
      })}
    </g>
  );
});
