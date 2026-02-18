import { HierarchyPointLink, HierarchyPointNode } from "d3-hierarchy";
import { PhyloTreeProps, TreeItem } from "./types";
import { TreeLink } from "./TreeLink";
import { LeafNode } from "./LeafNode";
import { pointRadial } from "d3-shape";
import styles from "./PhyloTree.module.css";
import { memo } from "react";

export type RenderTreeProps = {
  node: HierarchyPointNode<TreeItem>;
  enableBranchLengths: boolean;
  highlighted: PhyloTreeProps["highlighted"];
  getBranchLengthScaledY: (cumulativeBranchLength: number) => number;
  getColor: PhyloTreeProps["getColor"];
  getLabel: PhyloTreeProps["getLabel"];
  // Instead of prop drilling is context more performant?
  onLeafMouseEnter: (event: React.MouseEvent, node: HierarchyPointNode<TreeItem>) => void;
  onLeafMouseLeave: (event: React.MouseEvent, node: HierarchyPointNode<TreeItem>) => void;
};

//Now our issue is that the math is being rerun every single time

export const RenderTree = memo(function RenderTree({
  node,
  enableBranchLengths,
  getBranchLengthScaledY,
  getColor = () => "black",
  getLabel = (item) => item.id,
  onLeafMouseEnter,
  onLeafMouseLeave,
  highlighted,
}: RenderTreeProps) {
  const isLeaf = !node.children?.length;

  const [baseNodeX, baseNodeY] = pointRadial(node.x, node.y);
  const [scaledNodeX, scaledNodeY] = pointRadial(
    node.x,
    getBranchLengthScaledY(node.data.cumulative_branch_length ?? 0)
  );

  return (
    <g className={styles.node}>
      {isLeaf && (
        <LeafNode
          node={node}
          className={`${styles.leaf} ${highlighted?.includes(node.data.id) ? styles.highlighted : ""}`}
          baseNodeX={baseNodeX}
          baseNodeY={baseNodeY}
          scaledNodeX={scaledNodeX}
          scaledNodeY={scaledNodeY}
          label={getLabel(node.data)}
          color={getColor(node.data)}
          mode={enableBranchLengths ? "scaled" : "base"}
          onMouseEnter={onLeafMouseEnter}
          onMouseLeave={onLeafMouseLeave}
        />
      )}

      {/* Render children branches */}
      {node.children?.map((child) => {
        const link = { source: node, target: child };

        return (
          <g className={styles.branch} key={child.data.id}>
            <TreeLink
              link={link}
              className={styles.link}
              getBranchLengthScaledY={getBranchLengthScaledY}
              enableBranchLengths={enableBranchLengths}
            />
            <RenderTree
              node={child}
              enableBranchLengths={enableBranchLengths}
              getBranchLengthScaledY={getBranchLengthScaledY}
              highlighted={highlighted}
              getColor={getColor}
              getLabel={getLabel}
              onLeafMouseEnter={onLeafMouseEnter}
              onLeafMouseLeave={onLeafMouseLeave}
            />
          </g>
        );
      })}
    </g>
  );
});

const Node = Wrapper;
const Link = Wrapper;
const Branch = Wrapper;

type WrapperProps = React.ComponentPropsWithoutRef<"div">;

export function Wrapper({ children, ...rest }: WrapperProps) {
  return <div {...rest}>{children}</div>;
}

const mock = () => {
  return (
    // hovered
    <Branch>
      {/* hovered */}
      <Node>
        {/* hovered */}
        <Branch>
          <Link />
          {/* hovered */}
          <Node>
            {/* hovered */}
            <Branch>
              <Link />
              {/* hovered */}
              <Node>
                {/* hovered */}
                <Branch>
                  {/* HOVER HERE, this is the link */}
                  <Link />
                  <Node>
                    <Branch>
                      {/* Target this Link */}
                      <Link />
                      <Node>
                        <Branch>
                          {/* Target this Link */}
                          <Link />
                          <Node></Node>
                        </Branch>
                      </Node>
                    </Branch>
                  </Node>
                </Branch>
                {/* not hovered */}
                <Branch>
                  {/* IGNORE */}
                  <Link/>
                  <Node>

                  </Node>
                </Branch>
              </Node>

            </Branch>
          </Node>
        </Branch>
        {/* want to ignore the below */}
        <Branch>
          <Link />
          <Node>
            <Branch>
              <Link />
              <Node></Node>
            </Branch>
          </Node>
        </Branch>
      </Node>
      <Node>

      </Node>
    </Branch>
  );
};