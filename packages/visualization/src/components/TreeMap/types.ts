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
    sx?: {
      padding?: number;
      paddingInner?: number;
      paddingOuter?: number;
      borderRadius?: number;
      strokeWidth?: number;
    }
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
