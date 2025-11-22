import * as React from "react";
import { Meta, StoryObj } from "@storybook/react-vite";
import { LicenseInfo } from "@mui/x-license";
import { BiosampleTable, initialTableState } from "./BiosampleTable";
import { rnaSeqCheckCol } from "./columns";

const meta = {
  title: "ui-components/BiosampleTable",
  component: BiosampleTable,
  tags: ["autodocs"],
  parameters: {
    controls: { expanded: true },
  },
  decorators: [
    (Story) => {
      LicenseInfo.setLicenseKey(process.env.NEXT_PUBLIC_MUI_X_LICENSE_KEY as string);
      return <Story />;
    },
  ],
} satisfies Meta<typeof BiosampleTable>;

export default meta;
type Story = StoryObj<typeof BiosampleTable>

export const Human: Story = {render: () => {
 return <BiosampleTable assembly="GRCh38" divHeight={{height: 600}} />
}};

export const Mouse: Story = {render: () => {
 return <BiosampleTable assembly="mm10" divHeight={{height: 600}} />
}};

export const ByCellAndTissueDownloads: Story = {render: () => {
 return (
   <BiosampleTable
     assembly="GRCh38"
     divHeight={{ height: 600 }}
     initialState={{
       ...initialTableState,
       columns: {
         columnVisibilityModel: {
           displayname: false,
           assays: true,
           ontology: true,
           sampleType: true,
           lifeStage: true,
           bedurl: true,
           bigbedurl: false,
           dnase_experiment_accession: false,
           dnase_file_accession: false,
           dnaseZ: true,
           dnase_signal_url: false,
           atac_experiment_accession: false,
           atac_file_accession: false,
           atacZ: true,
           atac_signal_url: false,
           h3k4me3_experiment_accession: false,
           h3k4me3_file_accession: false,
           h3k4me3Z: true,
           h3k4me3_signal_url: false,
           h3k27ac_experiment_accession: false,
           h3k27ac_file_accession: false,
           h3k27acZ: true,
           h3k27ac_signal_url: false,
           ctcf_experiment_accession: false,
           ctcf_file_accession: false,
           ctcfZ: true,
           ctcf_signal_url: false,
           chromhmm_url: false,
         },
       },
     }}
   />
 );
}};

export const ShowRnaSeq: Story = {render: () => {
 return (
   <BiosampleTable
     assembly="GRCh38"
     divHeight={{ height: 600 }}
     initialState={{
       ...initialTableState,
       columns: {
         columnVisibilityModel: { ...initialTableState.columns.columnVisibilityModel, [rnaSeqCheckCol.field]: true },
       },
     }}
   />
 );
}};