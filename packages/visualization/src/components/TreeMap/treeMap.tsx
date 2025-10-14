import React, { useState } from "react";
import { Treemap as VisxTreemap, hierarchy, treemapBinary, treemapDice, treemapResquarify, treemapSlice, treemapSliceDice, treemapSquarify } from "@visx/hierarchy";
import { TreemapNode, TreemapProps } from "./types";
import { useParentSize } from "@visx/responsive";
import SingleNode from "./singleNode";
import { TileMethod } from "@visx/hierarchy/lib/types";

const Treemap: React.FC<TreemapProps> = (
    props: TreemapProps,
) => {
    const { parentRef, width: parentWidth, height: parentHeight } = useParentSize();
    const [hovered, setHovered] = useState<string | null>(null);

    // wrap the array in a root node
    const root = hierarchy({ label: "root", value: 0, children: props.data })
        .sum((d) => d.value)
        .sort((a, b) => (b.value || 0) - (a.value || 0));

    const tileMethods: { [tile: string]: TileMethod<TreemapNode> } = {
        treemapSquarify,
        treemapBinary,
        treemapDice,
        treemapResquarify,
        treemapSlice,
        treemapSliceDice,
    };

    const sx = props.sx ?? {};

    const paddingInner =
        sx.paddingInner !== undefined
            ? sx.paddingInner
            : sx.padding !== undefined
                ? sx.padding
                : 0;

    const paddingOuter =
        sx.paddingOuter !== undefined
            ? sx.paddingOuter
            : sx.padding !== undefined
                ? sx.padding
                : 0;

    return (
        <div style={{ position: "relative", width: "100%", height: "100%" }} ref={parentRef}>
            <svg width={parentWidth} height={parentHeight}>
                <VisxTreemap<TreemapNode>
                    root={root}
                    size={[parentWidth, parentHeight]}
                    paddingInner={paddingInner}
                    paddingOuter={paddingOuter}
                    tile={tileMethods[props.tileMethod ?? "treemapResquarify"]}
                >
                    {(treemap) =>
                        treemap
                            .descendants()
                            .filter((n) => n.depth > 0) // skip the artificial root
                            .map((node, i) => {
                                const nodeId = node.ancestors().map(a => a.data.label).join("/");

                                return (
                                    <SingleNode
                                        key={`node-${i}`}
                                        node={node}
                                        isHovered={hovered === nodeId}
                                        onHover={(hover) => setHovered(hover ? nodeId : null)}
                                        strokeWidth={props.sx?.strokeWidth ?? 0}
                                        borderRadius={props.sx?.borderRadius}
                                    />
                                );
                            })
                    }
                </VisxTreemap>
            </svg>
        </div>
    );
};

export default Treemap;
