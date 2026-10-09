import { Box } from "@mui/material";

/** A legend's color dot, hollow for a group switched off. */
const Swatch = ({ color, hollow = false }: { color: string; hollow?: boolean }) => (
  <Box
    sx={{
      width: 10,
      height: 10,
      borderRadius: "50%",
      bgcolor: hollow ? "transparent" : color,
      border: `2px solid ${color}`,
      flexShrink: 0,
    }}
  />
);

export default Swatch;
