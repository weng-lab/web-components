import { TreeNode } from "./types";
import { motion } from "framer-motion";
import { useBranchLengthTransition } from "./PhyloTree";
import { memo } from "react";

export type TreeLinkProps = {
  scaledLinkPath: TreeNode["scaledLinkPath"]
  baseLinkPath: TreeNode["baseLinkPath"]
  color: TreeNode["color"]
  strokeWidth: TreeNode["linkStrokeWidth"]
  useBranchLengths: boolean;
};

/**
 * Link from node to its parent
 */
export const TreeLink = memo(function TreeLink({
  scaledLinkPath,
  baseLinkPath,
  color,
  strokeWidth,
  useBranchLengths,
}: TreeLinkProps) {
  return (
    <motion.path
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      initial={false}
      strokeLinecap={"round"}
      strokeLinejoin={"round"}
      animate={{
        d: useBranchLengths ? scaledLinkPath : baseLinkPath,
      }}
      transition={{
        d: useBranchLengthTransition,
      }}
    />
  );
})
