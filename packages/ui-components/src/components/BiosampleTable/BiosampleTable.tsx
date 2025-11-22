import { capitalize } from "@mui/material";
import Table from "../Table/Table";
import { columns as defaultCols } from "./columns";
import { BiosampleTableProps } from "./types";
import { useEncodeBiosampleData } from "./useEncodeBiosampleData";
import { JSX } from "react";

/**
 * This intentionally lists all columns in the visibility model (even visible cols) so that consumers can import and print it out to see all the keys
 */
export const initialTableState = {
  rowGrouping: { model: ["ontology"] },
  sorting: { sortModel: [{ field: "collection", sort: "asc" } as const] },
  columns: {
    columnVisibilityModel: {
      displayname: false,
      assays: true,
      ontology: true,
      sampleType: true,
      lifeStage: true,
      bedurl: false,
      bigbedurl: false,
      dnase_experiment_accession: false,
      dnase_file_accession: false,
      dnaseZ: false,
      dnase_signal_url: false,
      atac_experiment_accession: false,
      atac_file_accession: false,
      atacZ: false,
      atac_signal_url: false,
      h3k4me3_experiment_accession: false,
      h3k4me3_file_accession: false,
      h3k4me3Z: false,
      h3k4me3_signal_url: false,
      h3k27ac_experiment_accession: false,
      h3k27ac_file_accession: false,
      h3k27acZ: false,
      h3k27ac_signal_url: false,
      ctcf_experiment_accession: false,
      ctcf_file_accession: false,
      ctcfZ: false,
      ctcf_signal_url: false,
      chromhmm_url: false,
      rnaSeqCheckCol: false
    },
  },
};

export function BiosampleTable(props: BiosampleTableProps): JSX.Element {
  const {
    data: encodeSamples,
    loading: encodeLoading,
    error: encodeError,
  } = useEncodeBiosampleData({ assembly: props.assembly, skip: props.rows !== undefined });
  
  const {
    loading,
    error,
    assembly,
    rows = encodeSamples,
    prefilterBiosamples,
    columns = defaultCols,
    label = "Biosamples",
    downloadFileName = "Biosamples",
    initialState = initialTableState,
    ...restProps
  } = props;
  

  const internalRows = prefilterBiosamples ? rows?.filter(prefilterBiosamples) : rows;

  return (
    <Table
      label={label}
      downloadFileName={downloadFileName}
      rows={internalRows}
      columns={columns}
      loading={loading || encodeLoading}
      error={error || encodeError}
      initialState={initialState}
      rowSelectionPropagation={{ descendants: true }}
      groupingColDef={{ leafField: "displayname", valueFormatter: (value) => capitalize(value) }}
      {...restProps}
    />
  );
}