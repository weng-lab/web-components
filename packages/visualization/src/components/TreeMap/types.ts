import { HierarchyRectangularNode } from "@visx/hierarchy/lib/types";

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
      borderRadius?: number;
      strokeWidth?: number;
    }
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
