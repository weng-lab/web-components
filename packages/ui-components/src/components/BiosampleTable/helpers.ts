/**
 * 
 * @param url 
 * @param handleSetState 
 * 
 * Attempts to fetch the file size, and sets state with given fn. -1 if unsucessful
 */
export const fetchFileSize = async (url: string, handleSetState: (fileSize: number) => void) => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    if (!response.ok) {
      throw new Error("Error fetching file size for " + url)
    }
    const contentLength = response.headers.get("Content-Length");
    if (contentLength) {
      handleSetState(parseInt(contentLength, 10));
    }
  } catch (error) {
    console.error(error);
    handleSetState(-1)
  }
};

export const formatFileSize = (fileSize: number) => fileSize === -1 ? "Unknown Size" : (fileSize / 1000000).toFixed(1) + " MB"
/**
 *
 * @param assay
 * @returns Formatted assay name
 */
export const formatAssay = (assay: CcreAssay) => {
  switch (assay) {
    case "atac":
      return "ATAC";
    case "ctcf":
      return "CTCF";
    case "dnase":
      return "DNase";
    case "h3k27ac":
      return "H3K27ac";
    case "h3k4me3":
      return "H3K4me3";
  }
};

import { CcreAssay } from "./types";

/**
 *
 * @param assays
 * @returns string to display on hover above available assay wheel
 */
export function assayHoverInfo(assays: Record<CcreAssay, string | null>) {
  const { dnase, h3k27ac, h3k4me3, ctcf, atac } = assays;

  if (dnase && h3k27ac && h3k4me3 && ctcf && atac) {
    return "All assays available";
  } else if (!dnase && !h3k27ac && !h3k4me3 && !ctcf && !atac) {
    return "No assays available";
  } else
    return `Available:\n${dnase ? "DNase\n" : ""}${h3k27ac ? "H3K27ac\n" : ""}${h3k4me3 ? "H3K4me3\n" : ""}${ctcf ? "CTCF\n" : ""}${
      atac ? "ATAC\n" : ""
    }`;
}

export const ASSAY_COLORS: Record<CcreAssay, string> = {
  dnase: "#06DA93",
  h3k27ac: "#FFCD00",
  h3k4me3: "#FF0000",
  ctcf: "#00B0F0",
  atac: "#02c7b9",
};