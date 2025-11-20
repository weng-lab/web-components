import * as React from "react";
import { Meta, StoryObj } from "@storybook/react-vite";
import { LicenseInfo } from "@mui/x-license";
import { BiosampleTable } from "./BiosampleTable";
import { Box } from "@mui/material";
import { encodeColumnMap } from "./consts";

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
      return (
        <Box sx={{ maxHeight: 600, height: 600, minHeight: 580, width: "100%" }}>
          <Story />
        </Box>
      );
    },
  ],
} satisfies Meta<typeof BiosampleTable>;

export default meta;
type Story = StoryObj<typeof BiosampleTable>

export const Human: Story = {render: () => {
 return <BiosampleTable assembly="GRCh38" prefilterBiosamples={(sample) => !!sample?.rna_seq_tracks?.length} />
}};

export const Mouse: Story = {render: () => {
 return <BiosampleTable assembly="mm10" />
}};

export const CustomRowsCols: Story = {
  render: () => {
    //  return <BiosampleTable assembly="GRCh38" sources={['encode']} extraRows={[{testCol: "hello", type: "extraRow"} as const]} columns={[encodeColumnMap.ontology]} />
    return (
      <BiosampleTable
        assembly="GRCh38"
        sources={["encode"]}
        columns={[encodeColumnMap.displayname]}
        extraRows={[{ testCol: "hello", type: "extraRow" } as const]}
      />
    );
  },
};
