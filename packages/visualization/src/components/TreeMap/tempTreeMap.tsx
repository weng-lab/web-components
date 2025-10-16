import { useImperativeHandle, useRef, useState } from "react";
import { Treemap as VisxTreemap, hierarchy, treemapBinary, treemapDice, treemapResquarify, treemapSlice, treemapSliceDice, treemapSquarify } from "@visx/hierarchy";
import { TreemapNode, TreemapProps } from "./types";
import { useParentSize } from "@visx/responsive";
import SingleNode from "./tempSingleNode";
import { TileMethod } from "@visx/hierarchy/lib/types";
import { motion } from "framer-motion";
import { getAnimationProps } from "./helpers";
import { downloadAsSVG, downloadSVGAsPNG } from "../../utility";

const Treemap = <T extends object>(
    props: TreemapProps<T>,
) => {
    const { parentRef, width: parentWidth, height: parentHeight } = useParentSize();
    const [hovered, setHovered] = useState<string | null>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);

    // wrap the array in a root node
    const root = hierarchy({ label: "root", value: 0, children: props.data })
        .sum((d) => d.value)
        .sort((a, b) => (b.value || 0) - (a.value || 0));

    const tileMethods: { [tile: string]: TileMethod<TreemapNode<T>> } = {
        treemapSquarify,
        treemapBinary,
        treemapDice,
        treemapResquarify,
        treemapSlice,
        treemapSliceDice,
    };

    const style = props.treemapStyle ?? {};

    const paddingInner =
        style.paddingInner !== undefined
            ? style.paddingInner
            : style.padding !== undefined
                ? style.padding
                : 0;

    const paddingOuter =
        style.paddingOuter !== undefined
            ? style.paddingOuter
            : style.padding !== undefined
                ? style.padding
                : 0;

    //Download the plot as svg or png using the passed ref from the parent
    useImperativeHandle(props.ref, () => ({
        downloadSVG: () => {
            if (svgRef.current) downloadAsSVG(svgRef.current, props.downloadFileName ?? "tree_map.svg");
        },
        downloadPNG: () => {
            if (svgRef.current) downloadSVGAsPNG(svgRef.current, props.downloadFileName ?? "tree_map.png");
        },
    }));

    return (
        <div style={{ position: "relative", width: "100%", height: "100%" }} ref={parentRef}>
            <svg width={parentWidth} height={parentHeight} ref={svgRef}>
                <VisxTreemap<TreemapNode<T>>
                    root={root}
                    size={[parentWidth, parentHeight]}
                    paddingInner={paddingInner}
                    paddingOuter={paddingOuter}
                    tile={tileMethods[props.tileMethod ?? "treemapResquarify"]}
                >
                    {(treemap) =>
                        treemap
                            .descendants()
                            .filter((n) => n.depth > 0)
                            .map((node, i) => {
                                const nodeId = node.ancestors().map((a) => a.data.label).join("/");
                                const Wrapper = props.animation ? motion.g : "g";
                                const animProps = getAnimationProps(props.animation, i);

                                return (
                                    <Wrapper key={`node-${i}`} {...animProps}>
                                        <SingleNode
                                            node={node}
                                            isHovered={hovered === nodeId}
                                            onHover={(hover) => setHovered(hover ? nodeId : null)}
                                            strokeWidth={style.strokeWidth ?? 0}
                                            borderRadius={style.borderRadius ?? 0}
                                            fontSize={style.fontSize ?? 16}
                                            labelPlacement={props.labelPlacement ?? "middle"}
                                            tooltipBody={props.tooltipBody}
                                            onNodeClicked={props.onNodeClicked}
                                        />
                                    </Wrapper>
                                );
                            })
                    }
                </VisxTreemap>
            </svg>
        </div>

    );
};

export default Treemap;
