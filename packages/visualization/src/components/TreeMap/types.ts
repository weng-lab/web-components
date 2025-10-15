import { HierarchyRectangularNode, TileMethod } from "@visx/hierarchy/lib/types";

export type Methods = "treemapSquarify" | "treemapBinary" | "treemapDice" | "treemapResquarify" | "treemapSlice" | "treemapSliceDice"

export type TreemapNode = {
  label: string;
  value: number;
  color?: string;
  children?: TreemapNode[];
}

export type TreemapProps = {
    data: TreemapNode[];
    //styling types
    style?: {
      /**
       * padding will apply to both inner and outer but
       * specifying inner/outer will override that specific padding
       */
      padding?: number;
      paddingInner?: number;
      paddingOuter?: number;
      borderRadius?: number;
      strokeWidth?: number;
    }
    /**
     * Visx has a few built in tiling methods that can be changed here
     */
    tileMethod?: Methods;
}

export type SingleNodeProps = {
    node: HierarchyRectangularNode<TreemapNode>;
    isHovered: boolean;
    onHover: (hovered: boolean) => void;
    strokeWidth: number;
    borderRadius?: number;
}

export type ValueOvalProps = {
    cx: number;
    cy: number;
    value: number | string;
    color: string;
}
