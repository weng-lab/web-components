import { Meta, StoryObj } from "@storybook/react-vite";
import GenomeSearch from "./GenomeSearch";
import { Result } from "./types";
import { Button, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import React, { useState } from "react";

const meta = {
  title: "ui-components/GenomeSearch",
  component: GenomeSearch,
  tags: ["autodocs"],
} satisfies Meta<typeof GenomeSearch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    assembly: "GRCh38",
    geneVersion: [29, 40],
    onSearchSubmit: (r: Result) => console.log("Going to", r),
    queries: ["Gene", "SNP", "iCRE", "cCRE", "Coordinate", "Study", "Legacy cCRE"],
    ccreLimit: 3,
    geneLimit: 3,
    icreLimit: 3,
    snpLimit: 3,
    style: {},
    sx: { width: 300 },
    slots: {},
    slotProps: {},
  },
};
export const InputSlot: Story = {
  args: {
    assembly: "GRCh38",
    onSearchSubmit: (r: Result) => console.log("Going to", r.title),
    queries: ["Gene", "SNP", "iCRE", "cCRE", "Coordinate"],
    ccreLimit: 3,
    geneLimit: 3,
    icreLimit: 3,
    snpLimit: 3,
    style: {},
    sx: { width: 300 },
    slots: {
      input: <TextField label="Search" variant="standard" color="secondary" />,
    },
  },
};

export const ButtonSlotProps: Story = {
  args: {
    assembly: "GRCh38",
    onSearchSubmit: (r: Result) => console.log("Going to", r.title),
    queries: ["Gene", "SNP", "iCRE", "cCRE", "Coordinate"],
    ccreLimit: 3,
    geneLimit: 3,
    icreLimit: 3,
    snpLimit: 3,
    style: {},
    sx: { width: 400 },
    slots: {},
    slotProps: {
      button: {
        variant: "contained",
        startIcon: <SearchIcon />,
        color: "secondary",
        children: "Search",
        sx: { paddingInline: 3 },
      },
    },
  },
};

export const ButtonAndInputSlot: Story = {
  args: {
    assembly: "GRCh38",
    onSearchSubmit: (r: Result) => console.log("Going to", r.title),
    queries: ["Gene", "SNP", "iCRE", "cCRE", "Coordinate"],
    ccreLimit: 3,
    geneLimit: 3,
    icreLimit: 3,
    snpLimit: 3,
    style: {},
    sx: { width: 400 },
    slots: {
      button: (
        <Button variant="contained" color="secondary" startIcon={<SearchIcon />} sx={{ paddingInline: 3 }}>
          Search
        </Button>
      ),
      input: <TextField label="Search" variant="standard" color="secondary" />,
    },
    slotProps: {},
  },
};

export const ClearOnAssemblyChange: Story = {
  args: {
    assembly: "GRCh38",
    onSearchSubmit: (r: Result) => console.log("Going to", r.title),
    queries: ["Gene", "SNP", "iCRE", "cCRE", "Coordinate"],
    ccreLimit: 3,
    geneLimit: 3,
    icreLimit: 3,
    snpLimit: 3,
    style: {},
    sx: { width: 400 },
    slots: {},
    slotProps: {
      button: {
        variant: "contained",
        startIcon: <SearchIcon />,
        color: "secondary",
        children: "Search",
        sx: { paddingInline: 3 },
      },
    },
  },
  render: (args) => {
    const [assembly, setAssembly] = useState<"GRCh38" | "mm10">("GRCh38");

    const { assembly: unused, ...Autocompleteprops } = args;

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
        <GenomeSearch assembly={assembly} {...Autocompleteprops} />
      </Stack>
    );
  },
};

export const GencodeVersions: Story = {
  args: {
    assembly: "GRCh38",
    onSearchSubmit: (r: Result) => console.log("Going to", r),
    queries: ["Gene"],
    ccreLimit: 3,
    geneLimit: 3,
    icreLimit: 3,
    snpLimit: 3,
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
