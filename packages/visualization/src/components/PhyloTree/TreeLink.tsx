import { HierarchyPointLink, HierarchyPointNode } from "@visx/hierarchy/lib/types";
import { TreeItem } from "./types";
import { pathRadialStep } from "@visx/shape";
import { motion } from "framer-motion";
import { hoverTransition, useBranchLengthTransition } from "./PhyloTree";
import { memo } from "react";

export type TreeLinkProps = {
  link: HierarchyPointLink<TreeItem>;
  stroke: string;
  strokeWidth: number;
  getBranchLengthScaledY: (cumulativeBranchLength: number) => number;
  enableBranchLengths: boolean;
  onMouseEnter: (link: HierarchyPointLink<TreeItem>) => void;
  onMouseLeave: (link: HierarchyPointLink<TreeItem>) => void;
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

const getPathRadialStep = pathRadialStep<HierarchyPointLink<TreeItem>, HierarchyPointNode<TreeItem>>({
  source: (l) => l.source,
  target: (l) => l.target,
  x: (n) => n?.x || 0,
  y: (n) => n?.y || 0,
});

export const TreeLink = memo(({
  link,
  stroke,
  strokeWidth,
  enableBranchLengths,
  getBranchLengthScaledY,
  onMouseEnter,
  onMouseLeave,
}: TreeLinkProps) => {
  const dConstant = rmSciNotation(getPathRadialStep(link));
  const dScaled = rmSciNotation(
    getPathRadialStep({
      source: {
        ...link.source,
        y: getBranchLengthScaledY(link.source.data.cumulative_branch_length ?? 0),
      },
      target: {
        ...link.target,
        y: getBranchLengthScaledY(link.target.data.cumulative_branch_length ?? 0),
      },
    })
  );

  return (
    <motion.path
      onMouseEnter={() => onMouseEnter(link)}
      onMouseLeave={() => onMouseLeave(link)}
      fill="none"
      initial={false}
      strokeLinecap={"square"}
      animate={{
        d: enableBranchLengths ? dScaled : dConstant,
        stroke,
        strokeWidth,
      }}
      transition={{
        d: useBranchLengthTransition,
        stroke: hoverTransition,
        strokeWidth: hoverTransition,
      }}
    />
  );
})
