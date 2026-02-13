import { useMemo, useState, useRef, useCallback } from "react";
import { Group } from "@visx/group";
import { ascending } from "@visx/vendor/d3-array";
import { cluster as d3cluster, hierarchy as d3hierarchy } from "d3-hierarchy";
import { PhyloTreeProps, TreeItem } from "./types";
import { HierarchyPointLink, HierarchyPointNode } from "@visx/hierarchy/lib/types";
import { useTooltip, TooltipWithBounds } from "@visx/tooltip";
import { Zoom } from "@visx/zoom";
import { TreeLink } from "./TreeLink";
import { ControlPanel } from "./ControlPanel";
import { ZoomSurface } from "./ZoomSurface";
import { LeafNode } from "./LeafNode";
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
const separationFn = () => 1

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
  const [hoveredLeaf, setHoveredLeaf] = useState<HierarchyPointNode<TreeItem> | null>(null);
  const [hoveredBranchTarget, setHoveredBranchTarget] = useState<HierarchyPointNode<TreeItem> | null>(null);
  const [enableBranchLengths, setEnableBranchLengths] = useState<boolean>(false);
  const { tooltipData, tooltipLeft, tooltipTop, showTooltip, hideTooltip } = useTooltip<TreeItem>();
  const containerRef = useRef<HTMLDivElement | null>(null);

  /* Plot Math */
  const innerWidth = totalWidth;
  const innerHeight = totalHeight;

  const origin = useMemo(() => ({
    x: innerWidth / 2,
    y: innerHeight / 2,
  }), [innerWidth, innerHeight])

  // const origin = {
  //   x: innerWidth / 2,
  //   y: innerHeight / 2,
  // }

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

  const { links, leaves } = useMemo(() => {
    const cluster = d3cluster<TreeItem>();
    cluster.size(size);
    cluster.separation(separationFn);
    const clusterData = cluster(root);

    return {
      links: clusterData.links(),
      leaves: clusterData.leaves(),
    };
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
   (cumulativeBranchLength: number) => (maxBranchLength === 0 ? 0 : (cumulativeBranchLength / maxBranchLength) * innerRadius),
   [maxBranchLength, innerRadius]
  );

  //Appends for x/y coordinates used by leaf nodes. Defined here to avoid recalculating with pointRadial on every render (since LeafNode needs to rerender on hover state change)
  const leafNodeWithPositions = useMemo(
    () =>
      leaves.map((leaf) => {
        const [baseNodeX, baseNodeY] = pointRadial(leaf.x, leaf.y);
        const [scaledNodeX, scaledNodeY] = pointRadial(
          leaf.x,
          getBranchLengthScaledY(leaf.data.cumulative_branch_length ?? 0)
        );

        return {
          node: leaf,
          baseNodeX,
          baseNodeY,
          scaledNodeX,
          scaledNodeY,
        };
      }),
    [leaves, getBranchLengthScaledY]
  );

  const getLeafNodeState = useCallback(
    (node: HierarchyPointNode<TreeItem>) => {
      const thisLeafIsHovered = hoveredLeaf === node;
      const ancestorLinkIsHovered = node.ancestors().some((node) => node === hoveredBranchTarget);
      const somethingIsHovered = hoveredLeaf !== null || hoveredBranchTarget !== null;
      const thisLeafIsHighlighted = highlighted.includes(node.data.id);

      const shouldHighlight = somethingIsHovered ? thisLeafIsHovered || ancestorLinkIsHovered : thisLeafIsHighlighted;

      const state = shouldHighlight ? "highlighted" : somethingIsHovered ? "dimmed" : "normal";

      return state;
    },
    [hoveredLeaf, hoveredBranchTarget, highlighted]
  );

  const getLinkIsHighlighted = useCallback(
    (link: HierarchyPointLink<TreeItem>) => {
      const targetLeafIsHovered = link.target.leaves().some((leafNode) => leafNode === hoveredLeaf);
      const targetAncestorLinkIsHovered = link.target.ancestors().some((node) => node === hoveredBranchTarget);
      const targetLeafIsHighlighted = link.target.leaves().some((leafNode) => highlighted.includes(leafNode.data.id));
      const somethingIsHovered = hoveredLeaf !== null || hoveredBranchTarget !== null;

      return targetAncestorLinkIsHovered || targetLeafIsHovered || (!somethingIsHovered && targetLeafIsHighlighted);
    },
    [hoveredLeaf, hoveredBranchTarget, highlighted]
  );

  const getLinkColor = useCallback(
    (link: HierarchyPointLink<TreeItem>) => {
      const targetLeafIsHovered = link.target.leaves().some((leafNode) => leafNode === hoveredLeaf);
      const hoveredLeafColor = hoveredLeaf && targetLeafIsHovered ? getColor(hoveredLeaf.data) : null;

      return hoveredLeafColor ?? "#999";
    },
    [hoveredLeaf, hoveredBranchTarget, highlighted]
  );

  const handleLinkOnMouseEnter = useCallback((l: HierarchyPointLink<TreeItem>) => setHoveredBranchTarget(l.target), [])
  const handleLinkOnMouseLeave = useCallback(() => setHoveredBranchTarget(null), [])
  const toggleBranchLength = useCallback(() => setEnableBranchLengths((prev) => !prev), [])

  const handleLeafOnMouseMove = useCallback((e: React.MouseEvent, node: HierarchyPointNode<TreeItem>) => {
    setHoveredLeaf(node);

    const rect = containerRef.current?.getBoundingClientRect();
    const left = e.clientX - (rect?.left ?? 0);
    const top = e.clientY - (rect?.top ?? 0);

    showTooltip({
      tooltipData: node.data,
      tooltipLeft: left,
      tooltipTop: top,
    });
  }, []);

  const handleLeafOnMouseLeave = useCallback(() => {
    setHoveredLeaf(null);
    hideTooltip();
  }, []);

  return totalWidth < 10 ? null : (
    <Zoom<SVGSVGElement>
      width={totalWidth}
      height={totalHeight}
      scaleXMin={0.8}
      scaleXMax={4}
      scaleYMin={0.8}
      scaleYMax={4}
    >
      {/* This here needs to be stable */}
      {(zoom) => (
        <div
          ref={containerRef}
          style={{
            position: "relative",
            border: "1px solid black",
            width: totalWidth,
            height: totalHeight,
            boxSizing: "content-box",
          }}
        >
          <ControlPanel scaleZoom={zoom.scale} resetZoom={zoom.reset} toggleBranchLength={toggleBranchLength} />
          <svg
            width={totalWidth}
            height={totalHeight}
            style={{ cursor: zoom.isDragging ? "grabbing" : "grab", touchAction: "none" }}
            ref={zoom.containerRef}
          >
            <ZoomSurface
              dragStart={zoom.dragStart}
              dragEnd={zoom.dragEnd}
              dragMove={zoom.dragMove}
              scale={zoom.scale}
              isDragging={zoom.isDragging}
            />
            <Group transform={zoom.toString()}>
              <Group top={origin.y} left={origin.x}>
                {links.map((link, i) => {
                  return (
                    <TreeLink
                      key={i}
                      link={link}
                      enableBranchLengths={enableBranchLengths}
                      stroke={getLinkColor(link)}
                      strokeWidth={getLinkIsHighlighted(link) ? 2 : 1}
                      getBranchLengthScaledY={getBranchLengthScaledY}
                      onMouseEnter={handleLinkOnMouseEnter}
                      onMouseLeave={handleLinkOnMouseLeave}
                    />
                  );
                })}
                {leafNodeWithPositions.map((leaf, i) => {
                  return (
                    <LeafNode
                      key={i}
                      node={leaf.node}
                      baseNodeX={leaf.baseNodeX}
                      baseNodeY={leaf.baseNodeY}
                      scaledNodeX={leaf.scaledNodeX}
                      scaledNodeY={leaf.scaledNodeY}
                      label={getLabel(leaf.node.data)}
                      color={getColor(leaf.node.data)}
                      variant={getLeafNodeState(leaf.node)}
                      mode={enableBranchLengths ? "scaled" : "base"}
                      getBranchLengthScaledY={getBranchLengthScaledY}
                      onMouseMove={handleLeafOnMouseMove}
                      onMouseLeave={handleLeafOnMouseLeave}
                    />
                  );
                })}
              </Group>
            </Group>
          </svg>
          {/* @todo this will probably break? */}
          {tooltipData && tooltipContents && (
            <TooltipWithBounds left={tooltipLeft} top={tooltipTop}>
              {tooltipContents(tooltipData)}
            </TooltipWithBounds>
          )}
        </div>
      )}
    </Zoom>
  );
}
