import { useMemo, useState, useRef } from "react";
import { Group } from "@visx/group";
import { Cluster, hierarchy, Tree } from "@visx/hierarchy";
import {ascending} from '@visx/vendor/d3-array'
import { pointRadial } from "d3-shape";
import { PhyloTreeProps, TreeItem } from "./types";
import { data as sampleTreeData } from "./data";
import { LinkRadialStep } from "@visx/shape";
import { HierarchyPointNode } from "@visx/hierarchy/lib/types";
import { useTooltip, TooltipWithBounds } from "@visx/tooltip";
import metadataRaw from "./241-mammals-metadata-w-human.txt?raw";

export type LinkTypesProps = {
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
};

export default function PhyloTree({
  width: totalHeight,
  height: totalWidth,
  margin = { top: 30, left: 30, right: 30, bottom: 30 },
  data = sampleTreeData,
  useBranchLengths = false,
  labelPadding = 120
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

  // compute cumulative branch lengths (distance from root) in a typed, non-mutating WeakMap
  const lengthMap = useMemo(() => {
    const map = new WeakMap<any, number>();
    root.each((node) => {
      const parentLen = node.parent ? (map.get(node.parent) ?? 0) : 0;
      map.set(node, parentLen + (node.data.branch_length ?? 0));
    });
    return map;
  }, [root]);

  const [hovered, setHovered] = useState<HierarchyPointNode<TreeItem> | null>(null)

  const metadataInfo = useMemo(() => {
    const map: Record<string, { common_name: string; order?: string }> = {};
    try {
      const text = String(metadataRaw ?? "");
      const lines = text.trim().split(/\r?\n/);
      if (lines.length <= 1) return map;
      const header = lines[0].split(/\t/).map((h) => h.trim());
      const fileIndex = header.indexOf("file_name");
      const commonIndex = header.indexOf("common_name");
      const orderIndex = header.indexOf("order");
      lines.slice(1).forEach((line) => {
        const cols = line.split(/\t/);
        const file = cols[fileIndex]?.trim();
        const common = cols[commonIndex]?.trim();
        const order = cols[orderIndex]?.trim();
        if (file) map[file] = { common_name: common ?? file, order: order || undefined };
      });
    } catch (e) {
      // ignore parse errors
    }
    return map;
  }, [metadataRaw]);

  // tooltip state & container ref
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { tooltipData, tooltipLeft, tooltipTop, showTooltip, hideTooltip } = useTooltip<{ common_name: string; order?: string }>();

  const ORDER_COLORS: Record<string, string> = {
    "DERMOPTERA": "#d62728",
    "CARNIVORA": "#1f77b4",
    "LAGOMORPHA": "#ff7f0e",
    "CETARTIODACTYLA": "#2ca02c",
    "RODENTIA": "#9467bd",
    "PRIMATES": "#d60404",
    "HYRACOIDEA": "#17a2b8",
    "PERISSODACTYLA": "#e377c2",
    "CHIROPTERA": "#7f7f7f",
    "EULIPOTYPHLA": "#6b6ecf",
    "PHOLIDOTA": "#08519c",
    "PILOSA": "#7f3b08",
    "AFROSORICIDA": "#b15928",
    "SIRENIA": "#800000",
    "TUBULIDENTATA": "#006d2c",
    "PROBOSCIDEA": "#4d4d4d",
    "SCANDENTIA": "#b35806",
    "CINGULATA": "#3f007d",
    "MACROSCELIDEA": "#525252",
  };

  const getOrderColor = (order?: string) => ORDER_COLORS[order ?? ""] ?? "#000000";

  return totalWidth < 10 ? null : ( 
    <div ref={containerRef} style={{ position: "relative" }}>
      <svg width={totalWidth} height={totalHeight}>
        <Group top={margin.top} left={margin.left}>
          <Cluster
            root={root}
            // This defines the arbitrary x/y coordinate system. For our radial layout X is defined in radians, Y is node depth.
            // https://d3js.org/d3-hierarchy/cluster#cluster_size
            size={[2 * Math.PI, innerRadius]}
            // Keep spacing of all leaf nodes consistent (could separate leaf nodes with different parents)
            separation={(a, b) => 1}
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
                  {/* Render the normal link */}
                  {cluster.links().map((link, i) => {
                    const data = {
                      source: {
                        ...link.source,
                        y: useBranchLengths ? scaleLengthToRadius(lengthMap.get(link.source) ?? 0) : link.source.y,
                      },
                      target: {
                        ...link.target,
                        y: useBranchLengths ? scaleLengthToRadius(lengthMap.get(link.target) ?? 0) : link.target.y,
                      },
                    };

                    const meta = metadataInfo[String(hovered?.data.name ?? "")];
                    const order = meta?.order;
                    const color = getOrderColor(order);

                    return (
                      <LinkRadialStep
                        key={i}
                        data={data}
                        percent={0}
                        stroke={
                          link.target.leaves().some((leafNode) => leafNode === hovered) ? color : "#999"
                        }
                        strokeWidth={
                          link.target.leaves().some((leafNode) => leafNode === hovered) ? 3 : 1
                        }
                        fill="none"
                        pointerEvents={"none"}
                      />
                    );
                  })}
                  {cluster.leaves().map((node, key) => {
                    const nodeRadius = useBranchLengths ? scaleLengthToRadius(lengthMap.get(node) ?? 0) : node.y;
                    const [nodeX, nodeY] = pointRadial(node.x, nodeRadius);
                    const [labelX, labelY] = pointRadial(node.x, node.y);

                    const angleDeg = (node.x * 180) / Math.PI - 90;
                    const flip = angleDeg > 90 || angleDeg < -90;
                    const rotation = flip ? angleDeg + 180 : angleDeg;
                    const anchor: "start" | "end" = flip ? "end" : "start";
                    const xOffset = flip ? -6 : 6;

                    const meta = metadataInfo[String(node.data.name ?? "")];
                    const label = meta?.common_name ?? String(node.data.name ?? "");
                    const order = meta?.order;
                    const color = getOrderColor(order);

                    return (
                      <Group key={key}>
                        <line
                          x1={nodeX}
                          y1={nodeY}
                          x2={labelX}
                          y2={labelY}
                          stroke={color}
                          opacity={0.2}
                          // why not working?
                          // style={{
                          //   transition: "x1 750ms ease, y1 750ms ease, x2 750ms ease, y2 750ms ease",
                          // }}
                          style={{
                            transition: "stroke-width 0.2s ease-in-out",
                          }}
                        />
                        <Group
                          top={labelY}
                          left={labelX}
                          onClick={() => console.log(node.data)}
                          onMouseEnter={(e: React.MouseEvent) => {
                            setHovered(node);
                            const rect = containerRef.current?.getBoundingClientRect();
                            const left = e.clientX - (rect?.left ?? 0);
                            const top = e.clientY - (rect?.top ?? 0);
                            showTooltip({ tooltipData: { common_name: label, order }, tooltipLeft: left, tooltipTop: top });
                          }}
                          onMouseMove={(e: React.MouseEvent) => {
                            const rect = containerRef.current?.getBoundingClientRect();
                            const left = e.clientX - (rect?.left ?? 0);
                            const top = e.clientY - (rect?.top ?? 0);
                            showTooltip({ tooltipData: { common_name: label, order }, tooltipLeft: left, tooltipTop: top });
                          }}
                          onMouseLeave={() => {
                            setHovered(null);
                            hideTooltip();
                          }}
                        >
                          
                          <text
                            fontSize={8}
                            fontFamily="Arial"
                            fill={color}
                            transform={`rotate(${rotation})`}
                            textAnchor={anchor}
                            x={xOffset}
                            dy={".33em"}
                            fontWeight={hovered === node ? 700 : 400}
                          >
                            {label}
                          </text>
                          <circle r={1.5} fill={color}/>
                        </Group>
                      </Group>
                    );
                  })}
                </Group>
              );}}
          </Cluster>
        </Group>
      </svg>

      {tooltipData && (
        <TooltipWithBounds left={tooltipLeft} top={tooltipTop}>
          <div style={{ fontSize: 12 }}>
            <div style={{ fontWeight: 600 }}>{tooltipData.common_name}</div>
            <div style={{ opacity: 0.8 }}>{tooltipData.order}</div>
          </div>
        </TooltipWithBounds>
      )}
    </div>
  );
}