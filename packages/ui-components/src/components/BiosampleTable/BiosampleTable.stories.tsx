import { Meta, StoryObj } from "@storybook/react-vite";
import { LicenseInfo } from "@mui/x-license";
import { BiosampleTable } from "./BiosampleTable";
import { useEncodeBiosampleData } from "./useEncodeBiosampleData";

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

 return <BiosampleTable assembly="GRCh38" preFilterBiosamples={(x) => true} />
}};

export const Mouse: Story = {render: () => {

 return <BiosampleTable assembly="mm10" />
}};

export const ExtraRow: Story = {render: () => {
 return <BiosampleTable assembly="GRCh38" extraRows={[{testCol: "hello", type: "extraRow"}]} preFilterBiosamples={(x) => x.type === "ENCODE" ? true : false} />
}};