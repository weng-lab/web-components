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

/**
 * Internal only, used for layout precalculation
 */
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
  ancestorIds?: Set<string>
  descendantIds?: Set<string>
}

export type TreeLink = {
  source: TreeNode,
  target: TreeNode
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
   * (id: string) => id
   */
  getLabel?: (id: string) => string
  /**
   * @default
   * (id: string) => 'black'
   */
  getColor?: (id: string) => string
  /**
   * Optionally define tooltip for hover over leaf nodes
   */
  tooltipContents?: (id: string) => ReactNode
  /**
   * fired when individual leaf node clicked
   */
  onLeafClick?: (id: string) => void,
  /**
   * Fired when hover state changes, single item if leaf hovered, multiple if branch hovered, empty on mouse leave
   */
  onLeafHoverChange?: (hovered: string[]) => void
  /**
   * Whether or not to use branch length on initial load
   * @default "scaled"
   */
  defaultScaling?: "unscaled" | "scaled"
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