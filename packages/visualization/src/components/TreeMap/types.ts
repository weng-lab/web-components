import { HierarchyRectangularNode, TileMethod } from "@visx/hierarchy/lib/types";
import { ReactElement } from "react";

export type Methods = "treemapSquarify" | "treemapBinary" | "treemapDice" | "treemapResquarify" | "treemapSlice" | "treemapSliceDice"

export type TreemapNode<T> = {
  label: string;
  value: number;
  color?: string;
  children?: TreemapNode<T>[];
  metaData?: T;
}

export type TreemapProps<T> = {
    data: TreemapNode<T>[];
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
      fontSize?: number;
    }
    /**
     * Visx has a few built in tiling methods that can be changed here
     */
    tileMethod?: Methods;
    labelPlacement?: "middle" | "topRight" | "topLeft" | "bottomLeft" | "bottomRight";
    tooltipBody?: (node: TreemapNode<T>) => ReactElement;
}

export type SingleNodeProps<T> = {
    node: HierarchyRectangularNode<TreemapNode<T>>;
    isHovered: boolean;
    onHover: (hovered: boolean) => void;
    strokeWidth: number;
    borderRadius: number;
    fontSize: number;
    labelPlacement: "middle" | "topRight" | "topLeft" | "bottomLeft" | "bottomRight";
    tooltipBody?: (node: TreemapNode<T>) => ReactElement
}

export type ValueOvalProps = {
    cx: number;
    cy: number;
    value: number | string;
    color: string;
    align: string;
}