import { GRID_ROW_GROUPING_SINGLE_GROUPING_FIELD, GridColDef, useGridApiRef } from "@mui/x-data-grid-premium";
import Table, { autosizeOptions } from "../Table/Table";
import { data } from "./data";
import { AssayWheel } from "./AssayWheel/AssayWheel";
import React, { useEffect, useMemo } from "react";
 import { useKeepGroupedColumnsHidden } from '@mui/x-data-grid-premium'
import { BiosampleTablePropsEncode, BiosampleTablePropsMixed, BiosampleTablePropsCustom, EncodeBiosample, UnknownRow } from "./types";
import { useEncodeBiosampleData } from "./useEncodeBiosampleData";
import { JSX } from "react/jsx-runtime";

const capitalize = (v: unknown) => {
  const s = String(v ?? "").trim();
  return s ? s[0].toUpperCase() + s.slice(1) : "";
};

/**
 * Should this be an object with keys/object pairs for the key? We need to make it so the columns are easily hidden/shown/more are added
 */

const encodeColumns: GridColDef<EncodeBiosample>[] = [
  {
    field: "ontology",
    headerName: "Organ/Tissue",
    valueFormatter: (value) => capitalize(value),
  },
  { field: "displayname", headerName: "Biosample", valueFormatter: (value) => capitalize(value), maxWidth: 300 },
  {
    field: "sampleType",
    headerName: "Sample Type",
    valueFormatter: (value) => capitalize(value),
  },
  {
    field: "lifeStage",
    headerName: "Life Stage",
    valueFormatter: (value) => capitalize(value),
  },
  {
    field: "assays",
    headerName: "Assays",
    valueGetter: (_, row) => {
      const availableAssays = [];
      if (row.dnase_experiment_accession) availableAssays.push("dnase");
      if (row.atac_experiment_accession) availableAssays.push("atac");
      if (row.h3k4me3_experiment_accession) availableAssays.push("h3k4me3");
      if (row.h3k27ac_experiment_accession) availableAssays.push("h3k27ac");
      if (row.ctcf_experiment_accession) availableAssays.push("ctcf");
      return availableAssays.join(", ");
    },
    sortComparator: (v1, v2) => {
      const count1 = v1.split(", ").filter((s: string) => s.length > 0).length;
      const count2 = v2.split(", ").filter((s: string) => s.length > 0).length;
      return count1 - count2;
    },
    renderCell: (params) => {
      if (params.rowNode.type === "group") return null;
      const row = params.row;
      return (
        <AssayWheel
          row={{
            dnase: row.dnase_experiment_accession,
            atac: row.atac_experiment_accession,
            h3k4me3: row.h3k4me3_experiment_accession,
            h3k27ac: row.h3k27ac_experiment_accession,
            ctcf: row.ctcf_experiment_accession,
          }}
        />
      );
    },
  },
  {field: "collection", headerName: "Collection", valueGetter: (params, row) => {
    // if (params.rowNode.type ==) {}
    let collection = "Ancillary";
      if (row.dnase_experiment_accession) {
        //Assign to Partial if at least dnase is available
        collection = "Partial";
        if (row.ctcf_experiment_accession && row.h3k4me3_experiment_accession && row.h3k27ac_experiment_accession) {
          //If all other marks (ignoring atac) are available, assign to core
          collection = "Core";
        }
      }
      return collection
  },
  //todo fix this being used as row grouping
  renderCell: (params) => params.rowNode.type === "group" ? null : params.value
},
  { field: "dnase_experiment_accession", headerName: "DNase Exp. ID", sortable: false },
  { field: "h3k4me3_experiment_accession", headerName: "H3K4me3 Exp. ID", sortable: false },
  { field: "h3k27ac_experiment_accession", headerName: "H3K27ac Exp. ID", sortable: false },
  { field: "ctcf_experiment_accession", headerName: "CTCF Exp. ID", sortable: false },
  { field: "atac_experiment_accession", headerName: "ATAC Exp. ID", sortable: false },
  { field: "dnase_file_accession", headerName: "DNase File ID", sortable: false },
  { field: "h3k4me3_file_accession", headerName: "H3K4me3 File ID", sortable: false },
  { field: "h3k27ac_file_accession", headerName: "H3K27ac File ID", sortable: false },
  { field: "ctcf_file_accession", headerName: "CTCF File ID", sortable: false },
  { field: "atac_file_accession", headerName: "ATAC File ID", sortable: false },
  {field: "chromhmm", headerName: "ChromHMM"}
];

const INITIAL_STATE = {
  rowGrouping: { model: ["ontology"] },
  sorting: { sortModel: [{ field: "assays", sort: "desc" } as const] },
  columns: {
    columnVisibilityModel: {
      dnase_experiment_accession: false,
      atac_experiment_accession: false,
      h3k4me3_experiment_accession: false,
      h3k27ac_experiment_accession: false,
      ctcf_experiment_accession: false,
      dnase_file_accession: false,
      atac_file_accession: false,
      h3k4me3_file_accession: false,
      h3k27ac_file_accession: false,
      ctcf_file_accession: false,
    },
  },
}

// Function overloads
export function BiosampleTable(props: BiosampleTablePropsEncode): JSX.Element;
export function BiosampleTable<T extends UnknownRow>(props: BiosampleTablePropsMixed<T>): JSX.Element;
export function BiosampleTable<T extends UnknownRow>(props: BiosampleTablePropsCustom<T>): JSX.Element;

// Implementation
export function BiosampleTable<T extends UnknownRow>(
  props: BiosampleTablePropsEncode | BiosampleTablePropsMixed<T> | BiosampleTablePropsCustom<T>
): JSX.Element {
  const { sources, extraRows, loading, error, assembly, preFilterBiosamples } = props;
  const {data: encodeSamples, loading: encodeLoading, error: encodeError} = useEncodeBiosampleData({assembly})

  const samples: (T | EncodeBiosample)[] = extraRows ? [...extraRows] : []
  if (sources){
    for (const source of sources) {
      switch (source) {
        case "encode": encodeSamples && samples.push(...encodeSamples)
      }
    }
  }
  const rows = preFilterBiosamples ? samples.filter((x) => (preFilterBiosamples as (biosample: T | EncodeBiosample) => boolean)(x)) : samples

  return (
    <Table
      label={"Biosamples"} // props but with default value of this
      rows={rows}
      columns={encodeColumns}
      loading={loading || encodeLoading}
      error={error || encodeError}
      divHeight={{ height: "900px" }} // props
      initialState={INITIAL_STATE}
      checkboxSelection //props
      rowSelectionPropagation={{ descendants: true }} // built in not in props
    />
  );
}

/**
 * <BiosampleTables data={biosampleData} label={} loading={} error={} checkboxSelection divHeight={} />
 */


/**
 * Standup:
 * - Properly setup all the typing for combining two different row types
 * - preFilterBiosample function (oddly difficult to type properly given different encode/non-encode combos)
 * - wrote data-fetching utilities
 * - Also figured out dark mode for storybook
 *  - May want to utilize https://storybook.js.org/addons/storybook-dark-mode instead though to unify the storybook ui and the story theme
 * Todo:
 * - Pass through checkboxSelection
 * - Export the columns, expose initial state in such a way to show/hide specific columns, as well as add/subtract columns (necessary for when samples are added that don't conform to EncodeBiosample or more columns are added)
 * - Maybe expose the entire rows object and data fetching utility to allow adding properties to each of the encode samples, maybe unnecessary tho...
 * 
 */