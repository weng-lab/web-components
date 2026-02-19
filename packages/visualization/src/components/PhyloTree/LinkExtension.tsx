import { motion } from "framer-motion";
import { useBranchLengthTransition } from "./PhyloTree";
import { memo } from "react";

export type LinkExtensionProps = {
  baseNodeX: number;
  baseNodeY: number;
  scaledNodeX: number;
  scaledNodeY: number;
  color: string;
  mode: "base" | "scaled";
};

const t = "0.2s ease-in-out";

export const LinkExtension = memo(function LinkExtension({
  mode,
  color,
  baseNodeX,
  baseNodeY,
  scaledNodeX,
  scaledNodeY,
}: LinkExtensionProps) {
  const connectorLineVariants: Record<typeof mode, { x1: number; x2: number; y1: number; y2: number }> = {
    base: { x1: baseNodeX, x2: baseNodeX, y1: baseNodeY, y2: baseNodeY },
    scaled: { x1: scaledNodeX, x2: baseNodeX, y1: scaledNodeY, y2: baseNodeY },
  };

  /**
   * @todo fix this thing, move all to css file versus mixing
   */
  const variant = "normal" as string;

  return (
    <motion.line
      initial={false}
      animate={mode}
      variants={connectorLineVariants}
      stroke={color}
      strokeWidth={1}
      transition={useBranchLengthTransition}
      style={{
        opacity: variant === "highlighted" ? 1 : 0.2,
        transition: `opacity ${t}`,
      }}
    />
  );
});
