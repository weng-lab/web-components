import { AutocompleteProps, BoxProps, ButtonProps, TextFieldProps } from "@mui/material";

// Props for the GenomeSearch component
export type GenomeSearchProps = Partial<AutocompleteProps<Result, false, true, false, React.ElementType>> & {
  assembly: "GRCh38" | "mm10";
  onSearchSubmit: (result: Result) => void;
  defaultResults?: Result[];
  showiCREFlag?: boolean;
  geneVersion?: number | number[];
  // queries
  queries: ResultType[];
  geneLimit?: number;
  snpLimit?: number;
  icreLimit?: number;
  ccreLimit?: number;
  legacyCcreLimit?: number;
  studyLimit?: number;

  // slot props for internal MUI components
  slotProps?: {
    input?: Partial<TextFieldProps>;
    button?: Partial<ButtonProps>;
    box?: Partial<BoxProps>;
  };

  // slots to replace internal MUI components
  slots?: {
    input?: React.ReactElement<TextFieldProps>;
    button?: React.ReactElement<ButtonProps>;
    box?: React.ReactElement<BoxProps>;
  };
};

export type Domain = {
  chromosome: string;
  start: number;
  end: number;
};

// Result types used to distinguish between different types of results
export type ResultType = "Gene" | "SNP" | "Coordinate" | "iCRE" | "cCRE" | "Study" | "Legacy cCRE";

// Result object used to display in the autocomplete dropdown
export type Result = {
  title?: string;
  description?: string;
  type?: ResultType;
  id?: string;
  name?: string;
  domain?: Domain;
};

// Response from the SNP GraphQL query
export interface SnpResponse {
  id: string;
  coordinates: {
    chromosome: string;
    start: number;
    end: number;
  };
}

// Response from the Gene GraphQL query
export interface GeneResponse {
  id: string;
  name: string;
  coordinates: {
    chromosome: string;
    start: number;
    end: number;
  };
  description: string;
  versions: { id: string; version: number }[];
}

// Response from the ICRE GraphQL query
export interface ICREResponse {
  accession: string;
  coordinates: Domain;
  celltypes: string[];
  rdhs: string;
}

// Response from the CCRE GraphQL query
export interface CCREResponse {
  accession: string;
  coordinates: Domain;
  celltypes: string[];
  isiCRE: boolean;
}

// Response from the CCRE GraphQL query
export interface LegacyCcreResponse {
  input: string;
  input_latest_previous_version: "v2" | "v3";
  input_region: string;
  v4_match_or_intersecting: string;
  v4_region: string;
}


// Response from the GWAS GraphQL query
export interface StudyResponse {
  disease_trait: string;
  studyid: string;
  population: string;
  parent_terms: string[];
  has_enrichment_info: boolean;
  author: string;
  pubmedid: string;
  total_ld_blocks: number;
}
