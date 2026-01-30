import { useMemo } from "react";
import { Group } from "@visx/group";
import { hierarchy, Tree } from "@visx/hierarchy";
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
  layout,
  width: totalHeight,
  height: totalWidth,
  margin = defaultMargin,
  data = sampleTreeData,
}: PhyloTreeProps) {
  const innerWidth = totalWidth - margin.left - margin.right;
  const innerHeight = totalHeight - margin.top - margin.bottom;

  let origin: { x: number; y: number };
  let sizeWidth: number;
  let sizeHeight: number;

  if (layout === "radial") {
    origin = {
      x: innerWidth / 2,
      y: innerHeight / 2,
    };
    sizeWidth = 2 * Math.PI;
    sizeHeight = Math.min(innerWidth, innerHeight) / 2;
  } else {
    origin = { x: 0, y: 0 };
    if (layout === "vertical") {
      sizeWidth = innerWidth;
      sizeHeight = innerHeight;
    } else {
      sizeWidth = innerHeight;
      sizeHeight = innerWidth;
    }
  }

  const LinkComponent = useMemo(() => {
    switch (layout) {
      case "radial":
        return LinkRadialStep;
      case "horizontal":
        return LinkHorizontalStep;
      case "vertical":
        return LinkVerticalStep;
    }
  }, [layout]);

  return totalWidth < 10 ? null : (
    <div>
      <svg width={totalWidth} height={totalHeight}>
        <Group top={margin.top} left={margin.left}>
          <Tree
            root={hierarchy(data, (d) => (d.children))}
            size={[sizeWidth, sizeHeight]}
            separation={(a, b) => (a.parent === b.parent ? 1 : 0.5) / a.depth}
          >
            {(tree) => (
              <Group top={origin.y} left={origin.x}>
                {tree.links().map((link, i) => (
                  <LinkComponent
                    key={i}
                    data={link}
                    percent={0}
                    stroke="rgb(254,110,158,0.6)"
                    strokeWidth="1"
                    fill="none"
                    pointerEvents={"none"}
                  />
                ))}

                {tree.descendants().map((node, key) => {
                  let top: number;
                  let left: number;
                  if (layout === "radial") {
                    const [radialX, radialY] = pointRadial(node.x, node.y);
                    top = radialY;
                    left = radialX;
                  } else if (layout === "vertical") {
                    top = node.y;
                    left = node.x;
                  } else {
                    top = node.x;
                    left = node.y;
                  }

                  return (
                    <Group top={top} left={left} key={key} onClick={() => console.log(node.data)}>
                      {!node.children && (
                        <>
                          <circle r={3} stroke="black" strokeWidth={1} fill="transparent" />
                          <text dy=".33em" dx=".5em" fontSize={9} fontFamily="Arial" textAnchor="left" color="black">
                            {node.data.name}
                          </text>
                        </>
                      )}
                    </Group>
                  );
                })}
              </Group>
            )}
          </Tree>
        </Group>
      </svg>
    </div>
  );
}