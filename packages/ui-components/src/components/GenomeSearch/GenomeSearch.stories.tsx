import { Meta, StoryObj } from "@storybook/react-vite";
import GenomeSearch from "./GenomeSearch";
import { GenomeSearchProps, Result, ResultType } from "./types";
import { Button, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useState } from "react";
import { http, HttpResponse, delay } from "msw";
import { within, userEvent } from "storybook/test";

const SCREEN_GQL_URL = "https://screen.api.wenglab.org/graphql";

const meta = {
  title: "ui-components/GenomeSearch",
  component: GenomeSearch,
  tags: ["autodocs"],
} satisfies Meta<typeof GenomeSearch>;

export default meta;

type Story = StoryObj<typeof meta>;

const baseArgs = {
  assembly: "GRCh38" as const,
  graphqlUrl: SCREEN_GQL_URL,
  onSearchSubmit: (r: Result) => console.log("Going to", r),
  queries: ["Gene", "SNP", "iCRE", "cCRE", "Coordinate"] as ResultType[],
  sx: { width: 400 },
};

const containedSearchButton: NonNullable<GenomeSearchProps["slotProps"]>["button"] = {
  variant: "contained",
  startIcon: <SearchIcon />,
  color: "secondary",
  children: "Search",
  sx: { paddingInline: 3 },
};

const standardSecondaryInput: NonNullable<GenomeSearchProps["slotProps"]>["input"] = {
  label: "Search",
  variant: "standard",
  color: "secondary",
};

export const Default: Story = {
  args: {
    ...baseArgs,
    queries: ["Gene", "SNP", "iCRE", "cCRE", "Coordinate", "Study", "Legacy cCRE", "Ome"],
    geneVersion: [29, 40],
    sx: { width: 300 },
  },
};

export const InputSlot: Story = {
  args: {
    ...baseArgs,
    sx: { width: 300 },
    slots: { input: TextField },
    slotProps: { input: standardSecondaryInput },
  },
};

export const ButtonSlotProps: Story = {
  args: {
    ...baseArgs,
    slotProps: { button: containedSearchButton },
  },
};

export const ButtonAndInputSlot: Story = {
  args: {
    ...baseArgs,
    slots: { button: Button, input: TextField },
    slotProps: {
      button: containedSearchButton,
      input: standardSecondaryInput,
    },
  },
};

export const ClearOnAssemblyChange: Story = {
  args: {
    ...baseArgs,
    slotProps: { button: containedSearchButton },
  },
  render: (args) => {
    const [assembly, setAssembly] = useState<"GRCh38" | "mm10">("GRCh38");
    const { assembly: _unused, ...rest } = args;

    return (
      <Stack maxWidth={400} spacing={2}>
        <FormControl>
          <InputLabel id="demo-simple-select-label">Assembly</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={assembly}
            label="Assembly"
            onChange={(e) => setAssembly(e.target.value)}
          >
            <MenuItem value={"GRCh38"}>GRCh38</MenuItem>
            <MenuItem value={"mm10"}>mm10</MenuItem>
          </Select>
        </FormControl>
        <Typography>The assembly passed to component is: {assembly}</Typography>
        <GenomeSearch assembly={assembly} {...rest} />
      </Stack>
    );
  },
};

export const Loading: Story = {
  args: { ...Default.args },
  parameters: {
    msw: {
      handlers: [
        http.post(SCREEN_GQL_URL, async () => {
          await delay("infinite");
          return HttpResponse.json({});
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByRole("combobox");
    await userEvent.click(input);
    await userEvent.type(input, "SOX");
  },
};

export const GencodeVersions: Story = {
  args: {
    ...baseArgs,
    queries: ["Gene"],
    sx: { width: 300 },
  },
  render: (args) => {
    return (
      <Stack spacing={1}>
        <Typography>V29</Typography>
        <GenomeSearch {...args} geneVersion={29} />
        <Typography>V40</Typography>
        <GenomeSearch {...args} geneVersion={40} />
        <Typography>V29, V40</Typography>
        <GenomeSearch {...args} geneVersion={[29, 40]} />
      </Stack>
    );
  },
};
