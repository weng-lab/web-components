import { TableProps } from "../Table";

export type EncodeBiosample = {
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

export type BiosampleTableProps<T extends TableProps["rows"] = EncodeBiosample[]> = Partial<TableProps> & {
  /**
   * If passing rows, no biosamples will be fetched inside the component. Must use useEncodeBiosampleData to retrieve and pass in
   */
  rows?: T;
  /**
   * optionally prefilter biosamples. Filters the rows before going into the table. To modify initial filter state of table use initialState
   */
  prefilterBiosamples?: (biosample: T extends object ? T[number] : undefined) => boolean;
  /**
   * assembly to fetch samples for
   */
  assembly: "GRCh38" | "mm10";
  /**
   * Callback triggered when rowSelectionModel changes. Returns whole row objects. If only id needed, can use onRowSelectionModelChange
   */
  onSelectionChange?: (selected: EncodeBiosample[]) => void
};

const CCRE_ASSAYS = ["dnase", "atac", "h3k4me3", "h3k27ac", "ctcf"] as const;

export type CcreAssay = (typeof CCRE_ASSAYS)[number];