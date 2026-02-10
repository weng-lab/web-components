import { useMemo, useState, useRef, useCallback } from "react";
import { Group } from "@visx/group";
import { Cluster, hierarchy } from "@visx/hierarchy";
import { ascending } from "@visx/vendor/d3-array";
import { pointRadial } from "d3-shape";
import { PhyloTreeProps, TreeItem } from "./types";
import { pathRadialStep } from "@visx/shape";
import { HierarchyNode, HierarchyPointLink, HierarchyPointNode } from "@visx/hierarchy/lib/types";
import { useTooltip, TooltipWithBounds } from "@visx/tooltip";
import { motion } from "framer-motion";
import { Zoom } from "@visx/zoom";
import { localPoint } from "@visx/event";
import { Checkbox, FormControlLabel, IconButton, Tooltip } from "@mui/material";
import { Add, Remove, SettingsBackupRestore, Timeline } from "@mui/icons-material";

export type LinkTypesProps = {
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
};

const t = "0.2s ease-in-out";

const highlightTransition = {
  duration: 0.2,
  ease: "easeInOut",
} as const;

const linkTransition = {
  duration: 0.3,
  ease: "easeInOut",
} as const;

const getPathRadialStep = pathRadialStep<HierarchyPointLink<TreeItem>, HierarchyPointNode<TreeItem>>({
  source: (l) => l.source,
  target: (l) => l.target,
  x: (n) => n?.x || 0,
  y: (n) => n?.y || 0,
});

const separationFn = () => 1

const initialTransform = {
  scaleX: 1,
  scaleY: 1,
  translateX: 0,
  translateY: 0,
  skewX: 0,
  skewY: 0,
};

export default function PhyloTree({
  width: totalHeight,
  height: totalWidth,
  margin = { top: 30, left: 30, right: 30, bottom: 30 },
  data,
  highlighted = [],
  getColor = () => "black",
  getLabel = (item: TreeItem) => item.id,
  labelPadding = 120,
  tooltipContents,
}: PhyloTreeProps) {
  /* Hover State */
  const [hoveredLeaf, setHoveredLeaf] = useState<HierarchyPointNode<TreeItem> | null>(null);
  const [hoveredBranchTarget, setHoveredBranchTarget] = useState<HierarchyPointNode<TreeItem> | null>(null);

  const [enableBranchLengths, setEnableBranchLengths] = useState<boolean>(true);

  /* Tooltip Stuff */
  const { tooltipData, tooltipLeft, tooltipTop, showTooltip, hideTooltip } = useTooltip<TreeItem>();
  const containerRef = useRef<HTMLDivElement | null>(null);

  /* Plot Math */
  const innerWidth = totalWidth - margin.left - margin.right;
  const innerHeight = totalHeight - margin.top - margin.bottom;

  const origin = {
    x: innerWidth / 2,
    y: innerHeight / 2,
  };

  const plotBoundedRadius = Math.min(innerWidth, innerHeight) / 2;
  const innerRadius = Math.max(0, plotBoundedRadius - labelPadding);

  const size: [number, number] = useMemo(() => [2 * Math.PI, innerRadius], [innerRadius]);

  /* Make Cluster Data */
  const root = useMemo(() => {
    const r = hierarchy(data, (d) => d.children)
      .sum((d) => (d.children ? 0 : 1))
      .sort((a, b) =>
        a?.value !== undefined && b?.value !== undefined
          ? a.value - b.value || ascending(a.data.branch_length ?? undefined, b.data.branch_length ?? undefined)
          : 0
      );
    return r;
  }, [data]);

  /* Map for looking up cumulative branch length for given node */
  const lengthMap = useMemo(() => {
    const map = new WeakMap<HierarchyNode<TreeItem>, number>();
    root.each((node) => {
      const parentLen = node.parent ? (map.get(node.parent) ?? 0) : 0;
      map.set(node, parentLen + (node.data.branch_length ?? 0));
    });
    return map;
  }, [root]);

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

  const getLinkStrokeAndWidth = useCallback(
    (link: HierarchyPointLink<TreeItem>) => {
      const targetLeafIsHovered = link.target.leaves().some((leafNode) => leafNode === hoveredLeaf);
      const hoveredLeafColor = hoveredLeaf && targetLeafIsHovered ? getColor(hoveredLeaf.data) : null;
      const targetAncestorLinkIsHovered = link.target.ancestors().some((node) => node === hoveredBranchTarget);
      const targetLeafIsHighlighted = link.target.leaves().some((leafNode) => highlighted.includes(leafNode.data.id));
      const somethingIsHovered = hoveredLeaf !== null || hoveredBranchTarget !== null;

      const stroke = hoveredLeafColor ?? "#999";
      const strokeWidth =
        targetAncestorLinkIsHovered || targetLeafIsHovered || (!somethingIsHovered && targetLeafIsHighlighted)
          ? 2.5
          : 1;

      return { stroke, strokeWidth };
    },
    [hoveredLeaf, hoveredBranchTarget, highlighted]
  );

  return totalWidth < 10 ? null : (
    <Zoom<SVGSVGElement>
      width={totalWidth}
      height={totalHeight}
      scaleXMin={1}
      scaleXMax={4}
      scaleYMin={1}
      scaleYMax={4}
      initialTransformMatrix={initialTransform}
    >
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
          <div
            style={{
              position: "absolute",
              margin: '4px',
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <Tooltip title="Zoom In" placement="right">
              <IconButton onClick={() => zoom.scale({ scaleX: 1.2, scaleY: 1.2 })}>
                <Add fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom Out" placement="right">
              <IconButton onClick={() => zoom.scale({ scaleX: 1 / 1.2, scaleY: 1 / 1.2 })}>
                <Remove fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reset" placement="right">
              <IconButton onClick={zoom.reset}>
                <SettingsBackupRestore fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Toggle Evolutionary Distance" placement="right">
              <IconButton onClick={() => setEnableBranchLengths((prev) => !prev)}>
                <Timeline fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>
          <svg
            width={totalWidth}
            height={totalHeight}
            style={{ cursor: zoom.isDragging ? "grabbing" : "grab", touchAction: "none" }}
            ref={zoom.containerRef}
          >
            {/* Surface to capture mouse events for zooming */}
            <rect
              width={totalWidth}
              height={totalHeight}
              rx={14}
              fill="transparent"
              onTouchStart={zoom.dragStart}
              onTouchMove={zoom.dragMove}
              onTouchEnd={zoom.dragEnd}
              onMouseDown={zoom.dragStart}
              onMouseMove={zoom.dragMove}
              onMouseUp={zoom.dragEnd}
              onMouseLeave={() => {
                if (zoom.isDragging) zoom.dragEnd();
              }}
              onDoubleClick={(event) => {
                const point = localPoint(event) || { x: 0, y: 0 };
                zoom.scale({ scaleX: 1.1, scaleY: 1.1, point });
              }}
            />
            <Group top={margin.top} left={margin.left} transform={zoom.toString()}>
              <Cluster
                root={root}
                // This defines the arbitrary x/y coordinate system. For our radial layout X is defined in radians, Y is node depth.
                // https://d3js.org/d3-hierarchy/cluster#cluster_size
                size={size}
                // Keep spacing of all leaf nodes consistent (could separate leaf nodes with different parents)
                separation={separationFn}
              >
                {(cluster) => {
                  // if requested, compute a scale mapping cumulative branch length -> layout radius
                  const maxLen = enableBranchLengths
                    ? Math.max(...cluster.descendants().map((n) => lengthMap.get(n) ?? 0), 0)
                    : 0;
                  const scaleLengthToRadius = (v: number) => (maxLen === 0 ? 0 : (v / maxLen) * innerRadius);
                  //So the link extension always exists so that it can be transitioned too and from cleanly... interesting
                  //So it's always an element disinct for the purposes of coloring and transitioning
                  return (
                    <Group top={origin.y} left={origin.x}>
                      {/* In this coordinate system, x is the angle and y is the radius */}
                      {cluster.links().map((link, i) => {
                        const dConstant = getPathRadialStep(link);
                        const dScaled = getPathRadialStep({
                          source: {
                            ...link.source,
                            y: scaleLengthToRadius(lengthMap.get(link.source) ?? 0),
                          },
                          target: {
                            ...link.target,
                            y: scaleLengthToRadius(lengthMap.get(link.target) ?? 0),
                          },
                        });

                        //When it's the branch that's hovered, need to find depth relative to hovered link
                        const depthOffset = hoveredBranchTarget ? hoveredBranchTarget.depth : 0;
                        const delay = (link.target.depth - depthOffset) * 0.015;

                        return (
                          <motion.path
                            key={i}
                            onMouseEnter={() => setHoveredBranchTarget(link.target)}
                            onMouseLeave={() => setHoveredBranchTarget(null)}
                            fill="none"
                            initial={false}
                            animate={{
                              d: enableBranchLengths ? dScaled : dConstant,
                              ...getLinkStrokeAndWidth(link),
                            }}
                            transition={{
                              d: { ...linkTransition, duration: 0.3 },
                              stroke: {
                                ...highlightTransition,
                                delay,
                              },
                              strokeWidth: {
                                ...highlightTransition,
                                delay,
                              },
                            }}
                          />
                        );
                      })}
                      {cluster.leaves().map((node, i) => {
                        const nodeRadius = enableBranchLengths ? scaleLengthToRadius(lengthMap.get(node) ?? 0) : node.y;
                        const [nodeX, nodeY] = pointRadial(node.x, nodeRadius);
                        const [labelX, labelY] = pointRadial(node.x, node.y);

                        const angleDeg = (node.x * 180) / Math.PI - 90;
                        const flip = angleDeg > 90 || angleDeg < -90;
                        const rotation = flip ? angleDeg + 180 : angleDeg;
                        const textAnchor: "start" | "end" = flip ? "end" : "start";
                        const xOffset = flip ? -6 : 6;

                        const label = getLabel(node.data);
                        const color = getColor(node.data);

                        const state = getLeafNodeState(node);

                        return (
                          <Group
                            key={i}
                            onMouseMove={(e: React.MouseEvent) => {
                              if (node !== hoveredLeaf) setHoveredLeaf(node);
                              const rect = containerRef.current?.getBoundingClientRect();
                              const left = e.clientX - (rect?.left ?? 0);
                              const top = e.clientY - (rect?.top ?? 0);
                              showTooltip({
                                tooltipData: node.data,
                                tooltipLeft: left,
                                tooltipTop: top,
                              });
                            }}
                            onMouseLeave={() => {
                              setHoveredLeaf(null);
                              hideTooltip();
                            }}
                          >
                            <motion.line
                              initial={false}
                              animate={{
                                x1: nodeX,
                                y1: nodeY,
                                x2: labelX,
                                y2: labelY,
                                opacity: state === "highlighted" ? 1 : 0.2,
                              }}
                              stroke={color}
                              transition={{
                                x1: linkTransition,
                                y1: linkTransition,
                                x2: linkTransition,
                                y2: linkTransition,
                                opacity: highlightTransition,
                              }}
                            />
                            <Group top={labelY} left={labelX}>
                              <text
                                fontSize={8}
                                fontFamily="Arial"
                                fill={color}
                                opacity={state === "dimmed" ? 0.5 : 1}
                                stroke={state === "highlighted" ? color : "none"}
                                strokeWidth={state === "highlighted" ? 0.5 : 0}
                                paintOrder="stroke"
                                transform={`rotate(${rotation}) translate(0, 2.4)`}
                                textAnchor={textAnchor}
                                x={xOffset}
                                style={{
                                  transition: `opacity ${t}, stroke-width ${t}`,
                                }}
                              >
                                {label === "Human" ? `${label} \u2605\u2605\u2605` : label}
                              </text>
                              <circle
                                r={1.5}
                                transform={state === "highlighted" ? "scale(1.5)" : "scale(1)"}
                                style={{ transition: `transform ${t}, opacity ${t}` }}
                                fill={color}
                                opacity={state === "dimmed" ? 0.5 : 1}
                              />
                            </Group>
                          </Group>
                        );
                      })}
                    </Group>
                  );
                }}
              </Cluster>
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
