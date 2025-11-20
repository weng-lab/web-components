import { GridColDef } from "@mui/x-data-grid-premium";
import { TableProps } from "../Table";

export type EncodeBiosample = {
  type: "ENCODE"
  name: string;
  ontology: string;
  lifeStage: string;
  sampleType: string;
  displayname: string;
  dnase_experiment_accession: string | null;
  h3k4me3_experiment_accession: string | null;
  h3k27ac_experiment_accession: string | null;
  ctcf_experiment_accession: string | null;
  atac_experiment_accession: string | null;
  dnase_file_accession: string | null;
  h3k4me3_file_accession: string | null;
  h3k27ac_file_accession: string | null;
  ctcf_file_accession: string | null;
  atac_file_accession: string | null;
  dnase_signal_url?: string;
  h3k4me3_signal_url?: string;
  h3k27ac_signal_url?: string;
  ctcf_signal_url?: string;
  atac_signal_url?: string;
  rna_seq_tracks?: {
    id: string;
    title: string;
    url: string;
    rnaseq_experiment_accession: string;
    rnaseq_file_accession: string;
  }[];
  chromhmm?: string;
  chromhmm_url?: string;
  bigbedurl?: string | null;
};

// can add more biosample sources later if needed
export type SampleSource = 'encode'

// Mandate addition of "type" property to be able to safely access the "type" field in the filter and column definitions
export type UnknownRow = Record<string, unknown> & { type: string }

type BiosampleTablePropsBase<T extends UnknownRow> = Partial<TableProps> & {
  /**
   * the "type" field can be used to discriminate between different sample types.
   * Currently ENCODE samples have `type: "ENCODE"`
   */
  prefilterBiosamples?: (biosample: T) => boolean
  assembly: "GRCh38" | "mm10";
};

// Default
export type BiosampleTablePropsEncode = BiosampleTablePropsBase<EncodeBiosample> & {
  sources?: ['encode'] | undefined
  extraRows?: never
  columns?: GridColDef<EncodeBiosample>[]
};

// ENCODE + extra rows
export type BiosampleTablePropsMixed<T extends UnknownRow> = BiosampleTablePropsBase<EncodeBiosample | T> & {
  sources?: ['encode'] | undefined
  /**
   * Type should be able to be stricly inferred. Use `as const` when defining if needed
   */
  extraRows: T[]
  columns?: GridColDef<EncodeBiosample | T>[]
};

// Custom rows only - for rows that don't conform to EncodeBiosample
// Must provide custom columns to handle the row type
// Unclear if this will ever be useful...
export type BiosampleTablePropsCustom<T extends UnknownRow> = BiosampleTablePropsBase<T> & {
  sources?: []
  extraRows: T[]
  columns?: GridColDef<T>[]
};
