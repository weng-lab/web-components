import { ReactNode } from "react";

export type TreeItem = {
  id: string;
  branch_length: number | null,
  children?: TreeItem[]
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
   * @default 
   * { top: 30, left: 30, right: 30, bottom: 30 };
   */
  margin?: { top: number; right: number; bottom: number; left: number };
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