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
import { pointRadial } from "d3-shape";

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

const newBranchLengthScaledY = (cumulativeBranchLength: number, maxBranchLength: number, innerRadius: number) => {
  return maxBranchLength === 0 ? 0 : (cumulativeBranchLength / maxBranchLength) * innerRadius;
};

export const INNER_RADIUS = 500
export const INNER_DIAMETER = 1000;

export default function PhyloTree({
  width: totalHeight,
  height: totalWidth,
  data,
  highlighted = [],
  leafFontSize = 8,
  leafFontFamily = "Arial",
  linkStrokeWidth = 1,
  getColor = () => "black",
  getLabel = (item: TreeItem) => item.id,
  labelPadding = 135,
  tooltipContents,
}: PhyloTreeProps) {
  const [enableBranchLengths, setEnableBranchLengths] = useState<boolean>(false);
  const { tooltipData, tooltipLeft, tooltipTop, showTooltip, hideTooltip } = useTooltip<TreeItem>();

  const innerRadius = Math.max(0, INNER_RADIUS - labelPadding);

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
        node.data.cumulative_branch_length = parentLen + (node.data.branch_length ?? 0)
      })
      .eachAfter((node) => {
        //This node is visited after all of it's descendents. Allows us to look at immediate children to see if they have same color.
        //For leaf nodes, there will be no children, so assign the color
        if (!node.children){
          node.data.uniform_leaf_color = getColor(node.data)
        } else {
          const childColors = node.children.map(x => x.data.uniform_leaf_color)
          const firstColor = node.children[0].data.uniform_leaf_color
          const allSame = firstColor !== null && childColors.every(color => color === firstColor)
          node.data.uniform_leaf_color = allSame ? firstColor : null
        }
      })
    return r;
  }, [data, getColor, innerRadius]);

  

  const rootNode = useMemo(() => {
    const clusterLayout = d3cluster<TreeItem>();
    clusterLayout.size(size);
    clusterLayout.separation(separationFn);
    const clusterRoot = clusterLayout(root);

    let maxBranchLength = Math.max(...clusterRoot.leaves().map((node) => node.data.cumulative_branch_length ?? 0));

    clusterRoot.descendants().forEach((node) => {
      const branchLengthScaledRadius = newBranchLengthScaledY(node.data.cumulative_branch_length ?? 0, maxBranchLength, innerRadius)

      const [baseNodeX, baseNodeY] = pointRadial(node.x, node.y);
      const [scaledNodeX, scaledNodeY] = pointRadial(
        node.x,
       branchLengthScaledRadius
      );

      node.data.baseNodeX = baseNodeX;
      node.data.baseNodeY = baseNodeY;
      node.data.scaledNodeX = scaledNodeX;
      node.data.scaledNodeY = scaledNodeY;
      node.data.branchLengthScaledRadius = branchLengthScaledRadius
    });

    return clusterRoot;
  }, [data, size, innerRadius, root]);

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
          <Group
            top={INNER_RADIUS}
            left={INNER_RADIUS}
            className={styles.tree}
            style={
              {
                "--link-stroke-width": `${linkStrokeWidth}px`,
              } as React.CSSProperties
            }
          >
            <RenderTree
              node={rootNode}
              leafFontFamily={leafFontFamily}
              leafFontSize={leafFontSize}
              enableBranchLengths={enableBranchLengths}
              highlighted={highlighted}
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
