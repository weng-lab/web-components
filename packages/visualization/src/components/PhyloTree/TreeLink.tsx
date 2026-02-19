import { HierarchyPointLink } from "d3-hierarchy";
import { HierarchyPointNode as visxHierarchyPointNode, HierarchyPointLink as visxHierarchyPointLink } from "@visx/hierarchy/lib/types";
import { TreeItem } from "./types";
import { pathRadialStep } from "@visx/shape";
import { motion } from "framer-motion";
import { useBranchLengthTransition } from "./PhyloTree";
import { memo } from "react";
import styles from "./PhyloTree.module.css";

export type TreeLinkProps = {
  link: HierarchyPointLink<TreeItem>;
  enableBranchLengths: boolean;
  className: string
  stroke: string,
};

// Framer motion had issues with e notation 
const rmSciNotation = (pathString: string) => {
  // Regex to match scientific notation:
  // optional sign, digits/dots, 'e' or 'E', optional sign, and exponent digits
  const scientificRegex = /-?\d*\.?\d+[eE][+-]?\d+/g;

  return pathString.replace(scientificRegex, (match) => {
    // Convert the match to a Number and then back to a decimal string
    const num = Number(match);

    // Use toFixed() to ensure no new scientific notation is generated
    // 10 decimal places is usually enough for SVG precision
    return num.toFixed(10).replace(/\.?0+$/, "");
  });
};

const getPathRadialStep = pathRadialStep<visxHierarchyPointLink<TreeItem>, visxHierarchyPointNode<TreeItem>>({
  source: (l) => l.source,
  target: (l) => l.target,
  x: (n) => n?.x || 0,
  y: (n) => n?.y || 0,
});

export const TreeLink = memo(function TreeLink({
  link,
  enableBranchLengths,
  className,
  stroke
}: TreeLinkProps) {
  const dConstant = rmSciNotation(getPathRadialStep(link));

  const dScaled = rmSciNotation(
    getPathRadialStep({
      source: {
        ...link.source,
        //This doesn't work as it needs to be scaled and not put through the pointRadial
        y: link.source.data.branchLengthScaledRadius ?? 0,
      },
      target: {
        ...link.target,
        y: link.target.data.branchLengthScaledRadius ?? 0,
      },
    })
  );

  return (
    <motion.path
      stroke={stroke}
      onMouseEnter={(e) => {
        e.currentTarget.closest(`.${styles.branch}`)?.classList.add(styles.branchActive);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.closest(`.${styles.branch}`)?.classList.remove(styles.branchActive);
      }}
      className={className}
      fill="none"
      initial={false}
      strokeLinecap={"square"}
      animate={{
        d: enableBranchLengths ? dScaled : dConstant,
      }}
      transition={{
        d: useBranchLengthTransition,
      }}
    />
  );
})
