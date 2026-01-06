import {
  Button,
  Tooltip,
  Box,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Typography,
  Divider,
  IconButton,
} from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import { Download } from "@mui/icons-material";
import { ontologyDownloadMap } from "./ontologyDownloads";
import { fetchFileSize, formatFileSize } from "./helpers";
import { useDownloadContext } from "./DownloadContext";

export type AggregateDownloadProps = {
  ontology: string;
};

/**
 *
 * @param ontology
 * Finds available aggregate file urls for the given ontology in the form `[noccl, ccl]`
 */

export const getAvailableFiles = (ontology: string) => {
  const key = ontology.toLowerCase().replace(/\s+/g, "_");
  return ontologyDownloadMap[key] ?? [];
};

export const AggregateDownloadButton = ({ ontology }: AggregateDownloadProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [noccl, setNoccl] = useState(false);
  const [all, setAll] = useState(false);
  const [nocclFileSize, setNocclFileSize] = useState<number | null>(null);
  const [allFileSize, setAllFileSize] = useState<number | null>(null);
  const { onDownload } = useDownloadContext();

  const availibleDownloads = getAvailableFiles(ontology);

  const ncFile = availibleDownloads.find((d) => d.label === "Excluding Cancer Cell Lines")?.filename ?? undefined;
  const allFile = availibleDownloads.find((d) => d.label === "All Biosamples")?.filename ?? undefined;

  const handleOpenDialog = () => {
    if (ncFile && !nocclFileSize) fetchFileSize(`https://downloads.wenglab.org/${ncFile}`, setNocclFileSize);
    if (allFile && !allFileSize) fetchFileSize(`https://downloads.wenglab.org/${allFile}`, setAllFileSize);
    setIsDialogOpen(true);
  };

  const handleDownload = useCallback(() => {
    if (!availibleDownloads || availibleDownloads.length === 0) return;

    const checked = [];
    if (noccl) checked.push(ncFile);
    if (all) checked.push(allFile);

    checked.forEach((filename, index) => {
      if (!filename) return;

      const url = `https://downloads.wenglab.org/${filename}`;

      setTimeout(() => {
        if (onDownload) {
          // Use descriptive name: ontology_aggregate
          const name = `${ontology}_aggregate`;
          onDownload(url, name);
        }

        const link = document.createElement("a");
        link.href = url;
        link.download = filename;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 500); // 500ms delay between downloads (some browsers prevent against mutliple downloads at once)
    });
  }, [all, allFile, availibleDownloads, ncFile, noccl, onDownload, ontology]);

  return (
    <>
      <Tooltip
        title={
          availibleDownloads.length === 0 ? (
            "No Aggregate cCRE Download Options"
          ) : (
            <Box>
              Download cCREs in {ontology.charAt(0).toUpperCase() + ontology.slice(1)}:
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {availibleDownloads.map((d) => (
                  <li key={d.filename}>{d.label}</li>
                ))}
              </ul>
              (Opens Download Dialog)
            </Box>
          )
        }
        placement="left"
        arrow
      >
        <span>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDialog();
            }}
            disabled={availibleDownloads.length === 0}
          >
            <Download />
          </IconButton>
        </span>
      </Tooltip>
      <Dialog
        open={isDialogOpen}
        onClose={(event) => {
          (event as React.MouseEvent).stopPropagation();
          setIsDialogOpen(false);
        }}
        aria-labelledby="export-dialog-title"
        disableScrollLock
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(2px)",
            },
          },
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <DialogTitle id="export-dialog-title">
          Download cCREs in {ontology.charAt(0).toUpperCase() + ontology.slice(1)}:
        </DialogTitle>
        <DialogContent>
          <Stack>
            <FormControlLabel
              control={<Checkbox checked={all} onChange={(e) => setAll(e.target.checked)} disabled={!allFile} />}
              label={`Aggregate cCREs (all biosamples)${allFileSize ? " - " + formatFileSize(allFileSize) : ""}`}
            />
            <FormControlLabel
              control={<Checkbox checked={noccl} onChange={(e) => setNoccl(e.target.checked)} disabled={!ncFile} />}
              label={`Aggregate cCREs (excluding cancer cell lines)${nocclFileSize ? " - " + formatFileSize(nocclFileSize) : ""}`}
            />
            {availibleDownloads.length <= 1 && (
              <>
                <Divider sx={{ marginTop: 1 }} />
                <Typography marginTop={1}>
                  <strong>No cancerous cell lines available in this tissue</strong>
                </Typography>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setIsDialogOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              handleDownload();
              setIsDialogOpen(false);
            }}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
