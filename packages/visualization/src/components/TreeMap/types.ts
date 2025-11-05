import { HierarchyRectangularNode } from "@visx/hierarchy/lib/types";
import { ReactElement } from "react";
import { DownloadPlotHandle } from "../../utility";

export type Methods = "treemapSquarify" | "treemapBinary" | "treemapDice" | "treemapResquarify" | "treemapSlice" | "treemapSliceDice"

export type AnimationType = "fade" | "scale" | "slideUp" | "slideRight" | "pop";

export type TreemapNode<T> = {
  label: string;
  value: number;
  children?: TreemapNode<T>[];
  // styling types applied only to this specific node
  style?: {
    color?: string;
    // Defaults to color if not provided
    labelColor?: string;
    //defaults to treemapStyle stroke width if not provided
    strokeWidth?: number;
    strokeColor?: string;
  }
  metaData?: T;
}

export type TreemapProps<T> = {
    data: TreemapNode<T>[];
    //styling types applied to all nodes in the treemap
    treemapStyle?: {
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
      opacity?: number;
    }
    /**
     * Visx has a few built in tiling methods that can be changed here
     */
    tileMethod?: Methods;
    labelPlacement?: "middle" | "topRight" | "topLeft" | "bottomLeft" | "bottomRight";
    tooltipBody?: (node: TreemapNode<T>) => ReactElement;
    onNodeClicked?: (point: TreemapNode<T>) => void;
    animation?: AnimationType;
    ref?: React.Ref<DownloadPlotHandle>
    downloadFileName?: string;
}

export type SingleNodeProps<T> = {
    node: HierarchyRectangularNode<TreemapNode<T>>;
    isHovered: boolean;
    onHover: (hovered: boolean) => void;
    strokeWidth: number;
    opacity: number;
    borderRadius: number;
    fontSize: number;
    labelPlacement: "middle" | "topRight" | "topLeft" | "bottomLeft" | "bottomRight";
    tooltipBody?: (node: TreemapNode<T>) => ReactElement
    onNodeClicked?: (point: TreemapNode<T>) => void;
}

export type ValueOvalProps = {
    cx: number;
    cy: number;
    value: number | string;
    color: string;
    align: string;
}