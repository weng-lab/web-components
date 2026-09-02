import React from "react";
import { Modal, Box, IconButton, Stack, Typography, Divider, Button } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import type { DataDownloadLink } from "./types";

interface DownloadOptionProps {
  label: string;
  onClick?: () => void;
  href?: string;
}

const DownloadOption: React.FC<DownloadOptionProps> = ({ label, onClick, href }) => (
  <Stack direction="row" alignItems="center" justifyContent="space-between">
    <Typography variant="body1">{label}</Typography>
    {href ? (
      <IconButton
        color="primary"
        component="a"
        href={href}
        download
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Download ${label}`}
      >
        <DownloadIcon />
      </IconButton>
    ) : (
      <IconButton color="primary" onClick={onClick} aria-label={`Download ${label}`}>
        <DownloadIcon />
      </IconButton>
    )}
  </Stack>
);

export interface DownloadModalProps {
  open: boolean;
  onClose: () => void;
  onDownloadSVG?: () => void;
  onDownloadPNG?: () => void;
  dataDownloadLinks?: DataDownloadLink[];
  plotTitle: string;
}

const DownloadModal: React.FC<DownloadModalProps> = ({
  open,
  onClose,
  onDownloadSVG,
  onDownloadPNG,
  dataDownloadLinks,
  plotTitle,
}) => {
  const downloadOptions = [
    { label: "PNG", action: onDownloadPNG },
    { label: "SVG", action: onDownloadSVG },
  ].filter((option) => option.action);

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          bgcolor: "background.paper",
          boxShadow: 24,
          borderRadius: 2,
          p: 3,
          width: 360,
        }}
      >
        <Typography variant="h6" fontWeight={600} mb={1}>
          Download {plotTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Choose a file format to export your plot.
        </Typography>
        <Stack spacing={1.5} divider={<Divider flexItem />}>
          {downloadOptions.map((option) => (
            <DownloadOption key={option.label} label={option.label} onClick={option.action} />
          ))}
        </Stack>
        {dataDownloadLinks && dataDownloadLinks.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" fontWeight={600} mb={1}>
              Download Data
            </Typography>
            <Stack spacing={1.5} divider={<Divider flexItem />}>
              {dataDownloadLinks.map((option) => (
                <DownloadOption key={option.title} label={option.title} href={option.link} />
              ))}
            </Stack>
          </>
        )}
        <Box mt={3} textAlign="right">
          <Button onClick={onClose}>Close</Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default DownloadModal;
