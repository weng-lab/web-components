import * as React from "react";
import { Meta, StoryObj } from "@storybook/react-vite";
import { LicenseInfo } from "@mui/x-license";
import { BiosampleTable, initialTableState } from "./BiosampleTable";
import { rnaSeqCheckCol } from "./columns";
import { EncodeBiosample } from "./types";
import { Stack } from "@mui/material";
import { DataGridPremiumProps } from "@mui/x-data-grid-premium";

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
type Story = StoryObj<typeof BiosampleTable>;

export const Human: Story = {
  render: () => {
    return <BiosampleTable assembly="GRCh38" divHeight={{ height: 600 }} />;
  },
};

export const Mouse: Story = {
  render: () => {
    return <BiosampleTable assembly="mm10" divHeight={{ height: 600 }} />;
  },
};

export const ByCellAndTissueDownloads: Story = {
  render: () => {
    return (
      <BiosampleTable
        assembly="GRCh38"
        divHeight={{ height: 600 }}
        initialState={{
          ...initialTableState,
          columns: {
            columnVisibilityModel: {
              ...initialTableState.columns.columnVisibilityModel,
              bedurl: true,
              dnaseZ: true,
              atacZ: true,
              h3k4me3Z: true,
              h3k27acZ: true,
              ctcfZ: true,
            },
          },
        }}
      />
    );
  },
};

export const ShowRnaSeq: Story = {
  render: () => {
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
  },
};

export const MultiSelectWithCheckboxes: Story = {
  render: () => {
    const [selected, setSelected] = React.useState<EncodeBiosample[]>([]);

    return (
      <Stack>
        <BiosampleTable
          assembly="GRCh38"
          divHeight={{ height: 600 }}
          checkboxSelection
          onSelectionChange={(newSelected) => setSelected(newSelected)}
        />
        Selected:
        {selected.map((x) => <span>{x.name}</span>)}
      </Stack>
    );
  },
};

export const SingleSelectWithoutCheckboxes: Story = {
  render: () => {
    const [selected, setSelected] = React.useState<EncodeBiosample[]>([]);

    return (
      <Stack>
        <BiosampleTable
          assembly="GRCh38"
          divHeight={{ height: 600 }}
          disableRowSelectionOnClick={false}
          disableMultipleRowSelection
          onSelectionChange={(newSelected) => setSelected(newSelected)}
          // potentially unstable solution. Not sure if the ids of grouped rows are public api
          isRowSelectable={(params) => !String(params.id).includes('auto-generated-row')}
        />
        Selected:
        {selected.map((x) => <span>{x.name}</span>)}
      </Stack>
    );
  },
};