import { useState } from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import { Download } from "@mui/icons-material";
import { fetchFileSize, formatFileSize } from "./helpers";

export type DownloadButtonProps = {
  message?: (fileSize: string) => string,
  url: string
  filename?: string,
  disabled?: boolean
};

export const DownloadButton = <T extends boolean>({ message, url, filename, disabled = false }: DownloadButtonProps) => {
  const [fileSize, setFileSize] = useState<number | null>(null);

  const handleSetHover = (isHovered: boolean) => {
    if (isHovered && url && !fileSize) {
      fetchFileSize(url, setFileSize);
    }
  };

  const fileSizeFormatted = fileSize ? formatFileSize(fileSize) : "Loading file size";

  return (
    <Box onMouseEnter={() => handleSetHover(true)} onMouseLeave={() => handleSetHover(false)}>
      <Tooltip title={message ? message(fileSizeFormatted) : null} placement="left" arrow>
        <span>
          <IconButton href={url} download={filename} disabled={disabled}>
            <Download />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
};
