import { useMemo, useState, useRef, useCallback } from "react";
import { Group } from "@visx/group";
import { Cluster, hierarchy } from "@visx/hierarchy";
import { ascending } from "@visx/vendor/d3-array";
import { pointRadial } from "d3-shape";
import { PhyloTreeProps, TreeItem } from "./types";
import { pathRadialStep } from "@visx/shape";
import { HierarchyPointLink, HierarchyPointNode } from "@visx/hierarchy/lib/types";
import { useTooltip, TooltipWithBounds } from "@visx/tooltip";
import { motion } from "framer-motion";

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

export default function PhyloTree({
  width: totalHeight,
  height: totalWidth,
  margin = { top: 30, left: 30, right: 30, bottom: 30 },
  data,
  highlighted = [],
  getColor = () => "black",
  getLabel = (item: TreeItem) => item.id,
  useBranchLengths = false,
  labelPadding = 120,
  tooltipContents,
}: PhyloTreeProps) {
  const innerWidth = totalWidth - margin.left - margin.right;
  const innerHeight = totalHeight - margin.top - margin.bottom;

  const origin = {
    x: innerWidth / 2,
    y: innerHeight / 2,
  };

  const plotBoundedRadius = Math.min(innerWidth, innerHeight) / 2;
  const innerRadius = Math.max(0, plotBoundedRadius - labelPadding);

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

  const size: [number, number] = useMemo(() => [2 * Math.PI, innerRadius], [innerRadius]);
  const separation = useCallback(() => 1, []);

  // compute cumulative branch lengths (distance from root) in a typed, non-mutating WeakMap
  const lengthMap = useMemo(() => {
    const map = new WeakMap<any, number>();
    root.each((node) => {
      const parentLen = node.parent ? (map.get(node.parent) ?? 0) : 0;
      map.set(node, parentLen + (node.data.branch_length ?? 0));
    });
    return map;
  }, [root]);

  const [hoveredLeaf, setHoveredLeaf] = useState<HierarchyPointNode<TreeItem> | null>(null);
  const [hoveredBranchTarget, setHoveredBranchTarget] = useState<HierarchyPointNode<TreeItem> | null>(null);

  // tooltip state & container ref
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { tooltipData, tooltipLeft, tooltipTop, showTooltip, hideTooltip } = useTooltip<TreeItem>();

  return totalWidth < 10 ? null : (
    <div ref={containerRef} style={{ position: "relative" }}>
      <svg width={totalWidth} height={totalHeight}>
        <Group top={margin.top} left={margin.left}>
          <Cluster
            root={root}
            // This defines the arbitrary x/y coordinate system. For our radial layout X is defined in radians, Y is node depth.
            // https://d3js.org/d3-hierarchy/cluster#cluster_size
            size={size}
            // Keep spacing of all leaf nodes consistent (could separate leaf nodes with different parents)
            separation={separation}
          >
            {(cluster) => {
              // if requested, compute a scale mapping cumulative branch length -> layout radius
              const maxLen = useBranchLengths
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

                    const targetLeafIsHovered = link.target.leaves().some((leafNode) => leafNode === hoveredLeaf);
                    const hoveredLeafColor = hoveredLeaf && targetLeafIsHovered ? getColor(hoveredLeaf.data) : null;
                    const targetAncestorLinkIsHovered = link.target.ancestors().some((node) => node === hoveredBranchTarget);
                    const targetLeafIsHighlighted = link.target.leaves().some((leafNode) => highlighted.includes(leafNode.data.id))
                    const somethingIsHovered = (hoveredLeaf !== null || hoveredBranchTarget !== null);

                    const stroke = hoveredLeafColor ?? "#999";
                    const strokeWidth =
                      targetAncestorLinkIsHovered || targetLeafIsHovered || (!somethingIsHovered && targetLeafIsHighlighted) ? 2.5 : 1;

                    //When it's the branch that's hovered, need to find depth relative to hovered link
                    const depthOffset = hoveredBranchTarget ? hoveredBranchTarget.depth : 0;
                    const delay = (link.target.depth - depthOffset) * 0.015;

                    return (
                      <motion.path
                        onMouseEnter={() => setHoveredBranchTarget(link.target)}
                        onMouseLeave={() => setHoveredBranchTarget(null)}
                        fill="none"
                        initial={false}
                        animate={{
                          d: useBranchLengths ? dScaled : dConstant,
                          stroke,
                          strokeWidth,
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
                    const nodeRadius = useBranchLengths ? scaleLengthToRadius(lengthMap.get(node) ?? 0) : node.y;
                    const [nodeX, nodeY] = pointRadial(node.x, nodeRadius);
                    const [labelX, labelY] = pointRadial(node.x, node.y);

                    const angleDeg = (node.x * 180) / Math.PI - 90;
                    const flip = angleDeg > 90 || angleDeg < -90;
                    const rotation = flip ? angleDeg + 180 : angleDeg;
                    const textAnchor: "start" | "end" = flip ? "end" : "start";
                    const xOffset = flip ? -6 : 6;

                    const label = getLabel(node.data);
                    const color = getColor(node.data);

                    const thisLeafIsHovered = hoveredLeaf === node;
                    const ancestorLinkIsHovered = node.ancestors().some((node) => node === hoveredBranchTarget);
                    const somethingIsHovered = (hoveredLeaf !== null || hoveredBranchTarget !== null);
                    const thisLeafIsHighlighted = highlighted.includes(node.data.id);

                    const shouldHighlight = somethingIsHovered
                      ? thisLeafIsHovered || ancestorLinkIsHovered
                      : thisLeafIsHighlighted;

                    const state = shouldHighlight ? "highlighted" : somethingIsHovered ? "dimmed" : "normal";

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

      {tooltipData && tooltipContents && (
        <TooltipWithBounds left={tooltipLeft} top={tooltipTop}>
          {tooltipContents(tooltipData)}
        </TooltipWithBounds>
      )}
    </div>
  );
}
