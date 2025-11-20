const CCRE_ASSAYS = ["dnase", "atac", "h3k4me3", "h3k27ac", "ctcf"] as const;

export type CcreAssay = (typeof CCRE_ASSAYS)[number];
