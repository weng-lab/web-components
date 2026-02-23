import { motion } from "framer-motion";
import { useBranchLengthTransition } from "./PhyloTree";
import { memo } from "react";
import { TreeNode } from "./types";


export type LeafLinkExtensionProps = {
  baseLeafLinkExtension: TreeNode["baseLeafLinkExtension"]
  scaledLeafLinkExtension: TreeNode["scaledLeafLinkExtension"]
  color: TreeNode["color"];
  strokeWidth: TreeNode["linkStrokeWidth"]
  useBranchLengths: boolean
};

export const LeafLinkExtension = memo(function LinkExtension({
  useBranchLengths,
  color,
  baseLeafLinkExtension,
  scaledLeafLinkExtension,
  strokeWidth
}: LeafLinkExtensionProps) {

  return (
    <motion.line
      strokeWidth={strokeWidth}
      initial={false}
      animate={useBranchLengths ? scaledLeafLinkExtension : baseLeafLinkExtension}
      stroke={color}
      transition={useBranchLengthTransition}
    />
  );
});
