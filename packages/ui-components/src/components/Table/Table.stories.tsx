import { Meta, StoryObj } from "@storybook/react-vite";
import { Table } from "../..";
import { LicenseInfo } from "@mui/x-license";
import { GridColDef } from "@mui/x-data-grid-pro";

const meta = {
  title: "ui-components/Table",
  component: Table,
  tags: ["autodocs"],
  argTypes: {},
  parameters: {
    controls: { expanded: true },
  },
  decorators: [
    (Story) => {
      LicenseInfo.setLicenseKey(
        process.env.NEXT_PUBLIC_MUI_X_LICENSE_KEY as string
      );
      return <Story />;
    },
  ],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

const columns: GridColDef<(typeof rows)[number]>[] = [
  { field: "id", headerName: "ID", width: 90 },
  {
    field: "firstName",
    headerName: "First name",
    width: 150,
    editable: true,
  },
  {
    field: "lastName",
    headerName: "Last name",
    width: 150,
    editable: true,
  },
  {
    field: "age",
    headerName: "Age",
    // type: 'number',
    width: 110,
    editable: true,
  },
  {
    field: "fullName",
    headerName: "Full name",
    description: "This column has a value getter and is not sortable.",
    sortable: false,
    width: 160,
    valueGetter: (value, row) => `${row.firstName || ""} ${row.lastName || ""}`,
  },
];

const rows = [
  { id: 1, lastName: "Snow", firstName: "Jon", age: 14 },
  { id: 2, lastName: "Lannister", firstName: "Cersei", age: 31 },
  { id: 3, lastName: "Lannister", firstName: "Jaime", age: 31 },
  { id: 4, lastName: "Stark", firstName: "Arya", age: 11 },
  { id: 5, lastName: "Targaryen", firstName: "Daenerys", age: null },
  { id: 6, lastName: "Melisandre", firstName: null, age: 150 },
  { id: 7, lastName: "Clifford", firstName: "Ferrara", age: 44 },
  { id: 8, lastName: "Frances", firstName: "Rossini", age: 36 },
  { id: 9, lastName: "Roxie", firstName: "Harvey", age: 65 },
];

export const Default: Story = {
  args: {
    columns,
    rows,
    label: "Table Title",
  },
};

export const EmptyTableFallback: Story = {
  args: {
    columns,
    rows: [],
    label: "Table Title",
    emptyTableFallback: "No Rows",
  },
};

export const ErrorFallback: Story = {
  args: {
    columns,
    rows,
    label: "Intact Hi-C Loops",
    divHeight: {
      height: '350px'
    },
    error: true,
  }
}

export const FlexWrapper: Story = {
  args: {
    columns,
    rows,
    label: "This table fills container",
  }
}

export const FixedHeightWrapper: Story = {
  args: {
    columns,
    rows,
    label: "This table has a fixed 350px height",
    divHeight: {
      height: '350px'
    }
  }
}
