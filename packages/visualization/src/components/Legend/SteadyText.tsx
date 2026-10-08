import { Box } from "@mui/material";
import { useState } from "react";

export type SteadyTextProps = {
  text: string;
  /** While true, the text keeps the widest width it has had since, growing but never shrinking. */
  hold: boolean;
  /** Which side the text keeps to within a held width: the side facing what it labels. */
  align?: "start" | "end";
};

/**
 * A label that doesn't wobble in width while a range is dragged, but takes its own width otherwise
 * - reserving the widest possible label would leave a gap beside a short one like "0".
 *
 * Each shape it takes while held, digits written as 0, sits hidden in the same grid cell, which
 * sizes to the widest. In tabular figures every digit is as wide as a 0.
 */
const SteadyText = ({ text, hold, align = "start" }: SteadyTextProps) => {
  const shape = text.replace(/\d/g, "0");
  const [shapes, setShapes] = useState<string[]>([]);
  // Recorded during render, since an effect would commit again on every step of a drag.
  if (!hold && shapes.length > 0) setShapes([]);
  if (hold && !shapes.includes(shape)) setShapes([...shapes, shape]);

  return (
    <Box component="span" sx={{ display: "inline-grid", justifyItems: align, fontVariantNumeric: "tabular-nums" }}>
      {hold &&
        shapes.map((held) => (
          <Box key={held} component="span" sx={{ gridArea: "1 / 1", visibility: "hidden", whiteSpace: "pre" }}>
            {held}
          </Box>
        ))}
      <Box component="span" sx={{ gridArea: "1 / 1", whiteSpace: "pre" }}>
        {text}
      </Box>
    </Box>
  );
};

export default SteadyText;
