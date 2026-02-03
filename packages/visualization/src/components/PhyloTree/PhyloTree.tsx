import { useMemo } from "react";
import { Group } from "@visx/group";
import { Cluster, hierarchy, Tree } from "@visx/hierarchy";
import {ascending} from '@visx/vendor/d3-array'
import { pointRadial } from "d3-shape";
import { PhyloTreeProps } from "./types";
import { data as sampleTreeData } from "./data";
import { LinkHorizontalStep, LinkRadialStep, LinkVerticalStep } from "@visx/shape";

const defaultMargin = { top: 30, left: 30, right: 30, bottom: 70 };

export type LinkTypesProps = {
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
};

export default function PhyloTree({
  width: totalHeight,
  height: totalWidth,
  margin = defaultMargin,
  data = sampleTreeData,
  useBranchLengths = false,
}: PhyloTreeProps) {
  const innerWidth = totalWidth - margin.left - margin.right;
  const innerHeight = totalHeight - margin.top - margin.bottom;

  const origin = {
    x: innerWidth / 2,
    y: innerHeight / 2,
  };

  const innerRadius = Math.min(innerWidth, innerHeight) / 2;

  const root = useMemo(() => {
    const r = hierarchy(data, (d) => d.children)
      .sum((d) => (d.children ? 0 : 1)) // This sets the 'value' property only on leaf nodes, see https://d3js.org/d3-hierarchy/hierarchy#node_sum
      // .sort((a, b) => (a.value - b.value) || d3.ascending(a.data.length, b.data.length))
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

  return totalWidth < 10 ? null : (
    <div>
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
                  {/* This render the normal link */}
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
                    return (
                      <LinkRadialStep
                        key={i}
                        data={data}
                        percent={0}
                        stroke="rgb(254,110,158)"
                        strokeWidth="1"
                        fill="none"
                        pointerEvents={"none"}
                      />
                    );
                  })}
                  {/* This renders the extension to the outer rim */}
                  {cluster.links().filter((link) => !link.target.children).map((link, i) => {
                    //source is the target node and target is the max radius
                    const data = {
                      source: {
                        ...link.target,
                        y: useBranchLengths ? scaleLengthToRadius(lengthMap.get(link.target) ?? 0) : link.target.y,
                      },
                      target: {
                        ...link.target,
                        y: innerRadius,
                      },
                    };
                    //under the hood this is rendering a single <path> element and we need to transition the d property of it
                    return (
                      <LinkRadialStep
                        key={i}
                        data={data}
                        percent={0}
                        stroke="#000"
                        strokeOpacity={0.20}
                        strokeWidth="1"
                        pointerEvents={"none"}
                      />
                    );
                  })}
                  {cluster.leaves().map((node, key) => {
                    const radius = useBranchLengths ? scaleLengthToRadius(lengthMap.get(node) ?? 0) : node.y;
                    const [radialX, radialY] = pointRadial(node.x, node.y);
                    const top = radialY;
                    const left = radialX;
                    return (
                      <Group top={top} left={left} key={key} onClick={() => console.log(node.data)}>
                        <>
                          <circle r={1} stroke="black" strokeWidth={1} fill="transparent" />
                          {/* <text dy=".33em" dx=".5em" fontSize={9} fontFamily="Arial" textAnchor="left" color="black">
                            {node.data.name}
                          </text> */}
                        </>
                      </Group>
                    );
                  })}
                  {/* Modifying the location of the node does not modify the location of the link */}
                </Group>
              );}}
          </Cluster>
        </Group>
      </svg>
    </div>
  );
}