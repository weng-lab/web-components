import { AutocompleteProps, BoxProps, ButtonProps, TextFieldProps } from "@mui/material";

type AutocompleteBase = AutocompleteProps<Result, false, false, false>;

/**
 * MUI Autocomplete props that GenomeSearch owns internally. Consumers cannot
 * override these because doing so would break the component's data flow,
 * rendering, or its single-select `Result`-shaped generics.
 */
type GenomeSearchOmittedProps =
  | "options"
  | "value"
  | "onChange"
  | "inputValue"
  | "onInputChange"
  | "renderInput"
  | "renderOption"
  | "renderGroup"
  | "groupBy"
  | "getOptionLabel"
  | "isOptionEqualToValue"
  | "filterOptions"
  | "noOptionsText"
  | "slots"
  | "slotProps"
  | "multiple"
  | "freeSolo";

// Props for the GenomeSearch component
export type GenomeSearchProps = Omit<Partial<AutocompleteBase>, GenomeSearchOmittedProps> & {
  assembly: "GRCh38" | "mm10";
  onSearchSubmit: (result: Result) => void;
  defaultResults?: Result[];
  showiCREFlag?: boolean;
  geneVersion?: number | number[];
  // queries
  queries: ResultType[];

  /**
   * Maximum number of results per group. Pass a single `number` to apply the same
   * cap to every result type, or an object keyed by `ResultType` to override
   * individual types (unspecified types fall back to the default of 3).
   */
  limit?: number | Partial<Record<ResultType, number>>;

  /** GraphQL endpoint for autocomplete fetches. The wenglab gateway requires
   *  a server-injected secret header, so this should point at an app route
   *  handler (e.g. "/api/graphql") that attaches the key server-side. */
  graphqlUrl: string;

  /** Extend internal MUI component props, plus MUI Autocomplete's own slotProps. */
  slotProps?: Partial<AutocompleteBase["slotProps"]> & {
    input?: Partial<TextFieldProps>;
    button?: Partial<ButtonProps>;
    box?: Partial<BoxProps>;
  };

  /** Replace internal components, plus MUI Autocomplete's own slots.
   *  Pass a component type (e.g. `IconButton`); props go in `slotProps`. */
  slots?: Partial<AutocompleteBase["slots"]> & {
    input?: React.ElementType<TextFieldProps>;
    button?: React.ElementType<ButtonProps>;
    box?: React.ElementType<BoxProps>;
  };
};

export type Domain = {
  chromosome: string;
  start: number;
  end: number;
};

// Result types used to distinguish between different types of results
export type ResultType = "Gene" | "SNP" | "Coordinate" | "iCRE" | "cCRE" | "Study" | "Legacy cCRE" | "Ome";

// Result object used to display in the autocomplete dropdown
export type Result = {
  title?: string;
  description?: string;
  type: ResultType;
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
