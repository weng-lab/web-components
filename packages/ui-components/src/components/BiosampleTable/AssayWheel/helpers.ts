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