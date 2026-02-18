import { useMemo, useState, useCallback } from "react";
import { Group } from "@visx/group";
import { ascending } from "@visx/vendor/d3-array";
import { cluster as d3cluster, hierarchy as d3hierarchy } from "d3-hierarchy";
import { PhyloTreeProps, TreeItem, ZoomState } from "./types";
import { HierarchyPointNode } from "@visx/hierarchy/lib/types";
import { useTooltip, TooltipWithBounds } from "@visx/tooltip";
import { Zoom } from "@visx/zoom";
import { ProvidedZoom } from "@visx/zoom/lib/types";
import { ZoomFrame } from "./ZoomFrame";
import { RenderTree } from "./RenderTree";
import styles from "./PhyloTree.module.css";

export const hoverTransition = {
  duration: 0.2,
  ease: "easeInOut",
} as const;

export const useBranchLengthTransition = {
  duration: 0.3,
  ease: "easeInOut",
} as const;

// Keep spacing of all leaf nodes consistent
const separationFn = () => 1;

export default function PhyloTree({
  width: totalHeight,
  height: totalWidth,
  data,
  highlighted = [],
  getColor = () => "black",
  getLabel = (item: TreeItem) => item.id,
  labelPadding = 135,
  tooltipContents,
}: PhyloTreeProps) {
  const [enableBranchLengths, setEnableBranchLengths] = useState<boolean>(false);
  const { tooltipData, tooltipLeft, tooltipTop, showTooltip, hideTooltip } = useTooltip<TreeItem>();

  /* Plot Math */
  const innerWidth = totalWidth;
  const innerHeight = totalHeight;

  const origin = useMemo(
    () => ({
      x: innerWidth / 2,
      y: innerHeight / 2,
    }),
    [innerWidth, innerHeight]
  );

  const plotBoundedRadius = Math.min(innerWidth, innerHeight) / 2;
  const innerRadius = Math.max(0, plotBoundedRadius - labelPadding);

  // This defines the arbitrary x/y coordinate system. For our radial layout X is the angle defined in radians, Y is radius. https://d3js.org/d3-hierarchy/cluster#cluster_size
  const size: [number, number] = useMemo(() => [2 * Math.PI, innerRadius], [innerRadius]);

  /* Calculate Layout */
  const root = useMemo(() => {
    const r = d3hierarchy(data, (d) => d.children)
      // sorts first by least number of children, and then by branch length to create nice looking plot
      .sum((d) => (d.children ? 0 : 1))
      .sort(
        (a, b) =>
          (a.value || 0) - (b.value || 0) ||
          ascending(a.data.branch_length ?? undefined, b.data.branch_length ?? undefined)
      )
      //add cumulative_branch_length to each node
      .eachBefore((node) => {
        const parentLen = node.parent?.data?.cumulative_branch_length ?? 0;
        // We cast to any or extend the HierarchyNode type to avoid TS errors
        node.data.cumulative_branch_length = parentLen + (node.data.branch_length ?? 0);
      });
    return r;
  }, [data]);

  const rootNode = useMemo(() => {
    const cluster = d3cluster<TreeItem>();
    cluster.size(size);
    cluster.separation(separationFn);

    return cluster(root);
  }, [data, size, root]);

  const maxBranchLength = useMemo(
    () => Math.max(...root.leaves().map((n) => n.data.cumulative_branch_length ?? 0), 0),
    [root]
  );

  /**
   * Use this instead of node.y when scaling by branch length.
   * Both this function and node.y are calculated using innerRadius, this function explicitly and node.y by defining size as [2 * Math.PI, innerRadius]
   */
  const getBranchLengthScaledY = useCallback(
    (cumulativeBranchLength: number) =>
      maxBranchLength === 0 ? 0 : (cumulativeBranchLength / maxBranchLength) * innerRadius,
    [maxBranchLength, innerRadius]
  );
  const toggleBranchLength = useCallback(() => setEnableBranchLengths((prev) => !prev), []);

  const handleLeafOnMouseEnter = useCallback((e: React.MouseEvent, node: HierarchyPointNode<TreeItem>) => {
    showTooltip({
      tooltipData: node.data,
      tooltipLeft: e.clientX,
      tooltipTop: e.clientY,
    });
  }, []);

  const handleLeafOnMouseLeave = useCallback(() => {
    hideTooltip();
  }, []);

  const renderTree = useCallback(
    (zoom: ProvidedZoom<SVGSVGElement> & ZoomState) => {
      return (
        <ZoomFrame
          zoom={zoom}
          totalWidth={totalWidth}
          totalHeight={totalHeight}
          toggleBranchLength={toggleBranchLength}
        >
          <Group top={origin.y} left={origin.x} className={styles.tree}>
            <RenderTree
              node={rootNode}
              enableBranchLengths={enableBranchLengths}
              highlighted={highlighted}
              getBranchLengthScaledY={getBranchLengthScaledY}
              getColor={getColor}
              getLabel={getLabel}
              onLeafMouseEnter={handleLeafOnMouseEnter}
              onLeafMouseLeave={handleLeafOnMouseLeave}
            />
          </Group>
        </ZoomFrame>
      );
    },
    [
      totalWidth,
      totalHeight,
      origin,
      enableBranchLengths,
      toggleBranchLength,
      highlighted,
      getBranchLengthScaledY,
      getColor,
      getLabel,
      handleLeafOnMouseEnter,
      handleLeafOnMouseLeave,
    ]
  );

  return totalWidth < 10 ? null : (
    <div>
      <Zoom<SVGSVGElement>
        width={totalWidth}
        height={totalHeight}
        scaleXMin={0.8}
        scaleXMax={4}
        scaleYMin={0.8}
        scaleYMax={4}
      >
        {renderTree}
      </Zoom>
      {tooltipData && tooltipContents && (
        <TooltipWithBounds left={tooltipLeft} top={tooltipTop}>
          {tooltipContents(tooltipData)}
        </TooltipWithBounds>
      )}
    </div>
  );
}
