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
              return (
                <Group top={origin.y} left={origin.x}>
                  {/* We need to modify the location within the `link` here as well to make it match up */}
                  {/* Can I find a single location to modify the y position in? */}
                  {cluster.links().map((link, i) => {
                    const data = {
                      source: { ...link.source, y: link.source.y },
                      target: { ...link.target, y: link.target.y },
                    };
                    return (
                      <LinkRadialStep
                        key={i}
                        data={data}
                        percent={0}
                        stroke="rgb(254,110,158,0.6)"
                        strokeWidth="1"
                        fill="none"
                        pointerEvents={"none"}
                      />
                    );
                  })}
                  {/* Modifying the location of the node does not modify the location of the link */}
                  {cluster.descendants().map((node, key) => {
                    // const [radialX, radialY] = pointRadial(node.x, node.y);
                    const [radialX, radialY] = pointRadial(node.x, node.y);
                    const top = radialY;
                    const left = radialX;
                    return (
                      <Group top={top} left={left} key={key} onClick={() => console.log(node.data)}>
                        {true && (
                          <>
                            <circle r={1} stroke="black" strokeWidth={1} fill="transparent" />
                            {/* <text dy=".33em" dx=".5em" fontSize={9} fontFamily="Arial" textAnchor="left" color="black">
                            {node.data.name}
                          </text> */}
                          </>
                        )}
                      </Group>
                    );
                  })}
                </Group>
              );}}
          </Cluster>
        </Group>
      </svg>
    </div>
  );
}