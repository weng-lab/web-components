import { TransformMatrix } from "@visx/zoom/lib/types";
import { HierarchyPointNode } from "d3-hierarchy";
import { ReactNode } from "react";

// Not great but needed to copy this type since visx doesn't export it
export type ZoomState = {
    initialTransformMatrix: TransformMatrix;
    transformMatrix: TransformMatrix;
    isDragging: boolean;
};

export type TreeItem = {
  id: string;
  branch_length: number | null,
  children?: TreeItem[]
}

export interface TreeNode extends HierarchyPointNode<TreeItem> {
  cumulativeBranchLength?: number,
  baseNodeX?: number;
  baseNodeY?: number;
  scaledNodeX?: number;
  scaledNodeY?: number;
  branchLengthScaledRadius?: number;
  baseLinkPath?: string
  scaledLinkPath?: string
  linkStrokeWidth?: number
  labelStrokeWidth?: number
  baseLeafLinkExtension?: { x1: number, x2: number, y1: number, y2: number }
  scaledLeafLinkExtension?: { x1: number, x2: number, y1: number, y2: number }
  label?: string;
  color?: string;
  lightenedLinkExtColor?: string
}

export type TreeLink = {
  source: TreeNode,
  target: TreeNode
}


/**
 * @todo figure out how to use this type within the component to not expose branch length and leaf colot
 */
type TreeItemInternal = TreeItem & {
  cumulativeBranchLength: number,
  uniformLeafColor?: string | null
}

export type PhyloTreeProps = {
  width: number;
  height: number;
  data: TreeItem;
  /**
   * `id` of TreeItem(s) to be highlighted
   */
  highlighted?: string[]
  /**
   * @default 135
   */
  labelPadding?: number
  /**
   * @default 
   * (item: TreeItem) => item.id
   */
  getLabel?: (item: TreeItem) => string
  /**
   * @default
   * (item: TreeItem) => 'black'
   */
  getColor?: (item: TreeItem) => string
  /**
   * Optionally define tooltip for hover over leaf nodes
   */
  tooltipContents?: (item: TreeItem) => ReactNode
  /**
   * @default 8
   */
  leafFontSize?: number
  /**
   * @default 'Arial'
   */
  leafFontFamily?: string
  /**
   * @default 1
   */
  linkStrokeWidth?: number
};