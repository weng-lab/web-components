import { GridColDef } from "@mui/x-data-grid-premium";
import { AssayWheel } from "./AssayWheel/AssayWheel";
import { EncodeBiosample, UnknownRow } from "./types";

const capitalize = (v: unknown) => {
  const s = String(v ?? "").trim();
  return s ? s[0].toUpperCase() + s.slice(1) : "";
};

const ontologyCol: GridColDef<EncodeBiosample> = {
  field: "ontology",
  headerName: "Organ/Tissue",
  valueFormatter: (value) => capitalize(value),
};

const displayNameCol: GridColDef<EncodeBiosample> = {
  field: "displayname",
  headerName: "Biosample",
  valueFormatter: (value) => capitalize(value),
  maxWidth: 300,
};

const sampleTypeCol: GridColDef<EncodeBiosample> = {
  field: "sampleType",
  headerName: "Sample Type",
  valueFormatter: (value) => capitalize(value),
};

const lifeStageCol: GridColDef<EncodeBiosample> = {
  field: "lifeStage",
  headerName: "Life Stage",
  valueFormatter: (value) => capitalize(value),
};

const assaysCol: GridColDef<EncodeBiosample> = {
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
};

const collectionCol: GridColDef<EncodeBiosample> = {
  field: "collection",
  headerName: "Collection",
  valueGetter: (params, row) => {
    let collection = "Ancillary";
    if (row.dnase_experiment_accession) {
      collection = "Partial";
      if (row.ctcf_experiment_accession && row.h3k4me3_experiment_accession && row.h3k27ac_experiment_accession) {
        collection = "Core";
      }
    }
    return collection;
  },
  renderCell: (params) => (params.rowNode.type === "group" ? null : params.value),
};

const dnaseExpCol = { field: "dnase_experiment_accession", headerName: "DNase Exp. ID", sortable: false };
const h3k4me3ExpCol = { field: "h3k4me3_experiment_accession", headerName: "H3K4me3 Exp. ID", sortable: false };
const h3k27acExpCol = { field: "h3k27ac_experiment_accession", headerName: "H3K27ac Exp. ID", sortable: false };
const ctcfExpCol = { field: "ctcf_experiment_accession", headerName: "CTCF Exp. ID", sortable: false };
const atacExpCol = { field: "atac_experiment_accession", headerName: "ATAC Exp. ID", sortable: false };

const dnaseFileIdCol = { field: "dnase_file_accession", headerName: "DNase File ID", sortable: false };
const h3k4me3FileIdCol = { field: "h3k4me3_file_accession", headerName: "H3K4me3 File ID", sortable: false };
const h3k27acFileIdCol = { field: "h3k27ac_file_accession", headerName: "H3K27ac File ID", sortable: false };
const ctcfFileIdCol = { field: "ctcf_file_accession", headerName: "CTCF File ID", sortable: false };
const atacFileIdCol = { field: "atac_file_accession", headerName: "ATAC File ID", sortable: false };
/**
 * @todo add this signal url files here but hide them in initial state
 */

const chromHmmCol = { field: "chromhmm", headerName: "ChromHMM" };
const chromHmmUrlCol = { field: "chromhmm_url", headerName: "ChromHMM File" };

// It feels like all of my problems are stemming from these union types not working how I want them to.
// I feel like maybe the GridColDef is really just not meant to take in types like this, after all it makes very little sense
// to have a table that consumes two completely different types of objects
// Maybe just keep rows exposed and allow overriding via manual override of cols using data fetch?
// Or do I make them provide some merge function which takes the 

// Export the array for normal DataGrid consumption
export const encodeColumns: GridColDef<EncodeBiosample & UnknownRow>[] = [
  ontologyCol,
  displayNameCol,
  sampleTypeCol,
  lifeStageCol,
  assaysCol,
  collectionCol,
  dnaseExpCol,
  h3k4me3ExpCol,
  h3k27acExpCol,
  ctcfExpCol,
  atacExpCol,
  dnaseFileIdCol,
  h3k4me3FileIdCol,
  h3k27acFileIdCol,
  ctcfFileIdCol,
  atacFileIdCol,
  chromHmmCol,
  chromHmmUrlCol
  
];

export const initialTableState = {
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
};