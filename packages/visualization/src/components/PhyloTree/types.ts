import { TransformMatrix } from "@visx/zoom/lib/types";
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
  /**
   * placeholder for cumulative branch length to be put when creating root node
   */
  cumulative_branch_length?: number,
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
   * @default 100
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
};