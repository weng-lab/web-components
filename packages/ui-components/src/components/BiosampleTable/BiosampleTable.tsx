import { capitalize } from "@mui/material";
import Table from "../Table/Table";
import { columns as defaultCols } from "./columns";
import { BiosampleTableProps, EncodeBiosample } from "./types";
import { useEncodeBiosampleData } from "./useEncodeBiosampleData";
import { JSX, useMemo } from "react";
import { DataGridPremiumProps } from "@mui/x-data-grid-premium";

/**
 * This intentionally lists all columns in the visibility model (even visible cols) so that consumers can import and print it out to see all the keys
 */
export const initialTableState = {
  rowGrouping: { model: ["ontology"] },
  sorting: { sortModel: [{ field: "collection", sort: "asc" } as const] },
  columns: {
    columnVisibilityModel: {
      displayname: false, //only false since it is used as "leafField" in groupingColDef
      assays: true,
      ontology: true,
      sampleType: false,
      lifeStage: false,
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
      rnaSeq: false
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
    assembly, //custom added prop
    rows = encodeSamples ?? [],
    prefilterBiosamples = () => true, //custom added prop
    columns = defaultCols,
    label = "Biosamples",
    downloadFileName = "Biosamples",
    initialState = initialTableState,
    onSelectionChange = (selected: EncodeBiosample[]) => null, //custom added prop
    onRowSelectionModelChange, //have to extract here or else overrides to it would break the onSelectionChange functionality
    ...restProps
  } = props;
  
  const internalRows = rows.filter(prefilterBiosamples)

  const handleSelection: DataGridPremiumProps["onRowSelectionModelChange"] = (rowSelectionModel, details) => {
    if (onRowSelectionModelChange) onRowSelectionModelChange(rowSelectionModel, details);
    // we are passing disableRowSelectionExcludeModel, so should always be using "include"
    onSelectionChange(internalRows.filter(row => rowSelectionModel.ids.has(row.name)))
  };

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
      getRowId={x => x.name}
      onRowSelectionModelChange={handleSelection}
      disableRowSelectionExcludeModel // forces only using "include" model for easier mapping
      keepNonExistentRowsSelected
      {...restProps}
    />
  );
}