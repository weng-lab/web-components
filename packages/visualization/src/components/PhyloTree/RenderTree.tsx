import { PhyloTreeProps, TreeNode } from "./types";
import { TreeLink } from "./TreeLink";
import { memo } from "react";
import { LeafLinkExtension } from "./LeafLinkExtension";
import { LeafNodeLabel } from "./LeafNodeLabel";

type Shared = {
  node: TreeNode;
  useBranchLengths: boolean;
  leafFontSize: PhyloTreeProps["leafFontSize"];
  leafFontFamily: PhyloTreeProps["leafFontFamily"];
  onNodeMouseMove: (event: React.MouseEvent, node: TreeNode) => void;
  onNodeMouseLeave: (event: React.MouseEvent, node: TreeNode) => void;
  onBranchClick: (leafIds: string[]) => void;
};

export type RenderTreeProps = Shared & {
  hovered: string[];
};

export type RenderChildProps = Shared & {
  dimmed: boolean;
};

const ChildNode = memo(
  ({ node, dimmed, useBranchLengths, leafFontFamily, leafFontSize, onNodeMouseMove, onNodeMouseLeave, onBranchClick }: RenderChildProps) => {
    return (
      <g
        onMouseMove={(e: React.MouseEvent) => onNodeMouseMove(e, node)}
        onMouseLeave={(e: React.MouseEvent) => onNodeMouseLeave(e, node)}
        onClick={() => onBranchClick(node.leaves().map(x => x.data.id))}
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
  node,
  hovered,
  useBranchLengths,
  onNodeMouseMove,
  onNodeMouseLeave,
  onBranchClick,
  leafFontSize,
  leafFontFamily,
}: RenderTreeProps) {
  return (
    <g id={"tree-root"}>
      {/* no root node rendered (since root does not need to display link to parent) */}
      {node.descendants()?.map((child, i) => {
        if (!child.parent) return;
        //This is done to elimate a .ancestors() and .descendants() traversal on every rerender
        const dimmed = !!hovered.length && !(hovered.some(id => child.descendantIds?.has(id) || child.ancestorIds?.has(id)));

        return (
          <ChildNode
            key={i}
            node={child}
            dimmed={dimmed}
            useBranchLengths={useBranchLengths}
            leafFontSize={leafFontSize}
            leafFontFamily={leafFontFamily}
            onBranchClick={onBranchClick}
            onNodeMouseMove={onNodeMouseMove}
            onNodeMouseLeave={onNodeMouseLeave}
          />
        );
      })}
    </g>
  );
}, );
