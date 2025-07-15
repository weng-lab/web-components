import { InfoOutlineRounded, WarningAmberRounded } from "@mui/icons-material";
import { Stack, Typography } from "@mui/material";

export type TableFallbackProps = {
  message: string;
  variant: "error" | "empty";
};

const TableFallback = ({ message, variant }: TableFallbackProps) => {
  return (
    <Stack direction={"row"} border={"1px solid #e0e0e0"} borderRadius={1} p={2} spacing={1}>
      {variant === "empty" ? <InfoOutlineRounded /> : <WarningAmberRounded />}
      <Typography>{message}</Typography>
    </Stack>
  );
};

export default TableFallback;
