import { useState } from "react";
import { Meta, StoryObj } from "@storybook/react-vite";
import HomeIcon from "@mui/icons-material/Home";
import BarChartIcon from "@mui/icons-material/BarChart";
import SettingsIcon from "@mui/icons-material/Settings";
import BiotechIcon from "@mui/icons-material/Biotech";
import ViewTimelineIcon from "@mui/icons-material/ViewTimeline";
import { DetailsTabs } from "../..";

const meta = {
  title: "ui-components/DetailsTabs",
  component: DetailsTabs,
  tags: ["autodocs"],
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof DetailsTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

const iconTabs = [
  { value: "overview", label: "Overview", icon: <HomeIcon /> },
  { value: "data", label: "Data", icon: <BarChartIcon /> },
  { value: "biotech", label: "Biotech", icon: <BiotechIcon /> },
  { value: "settings", label: "Settings", icon: <SettingsIcon />, disabled: true, disabledMessage: "Coming soon" },
];

const mixedTabs = [
  { value: "overview", label: "Overview", icon: <HomeIcon /> },
  { value: "data", label: "Data", icon: <BarChartIcon /> },
  { value: "details", label: "Details" },
  { value: "history", label: "History" },
  { value: "exports", label: "Exports" },
];

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState("overview");
    return <DetailsTabs tabs={iconTabs} value={value} onChange={setValue} />;
  },
  args: { tabs: iconTabs, value: "overview", onChange: () => {} },
};

export const Vertical: Story = {
  render: () => {
    const [value, setValue] = useState("overview");
    return (
      <div style={{ display: "flex", height: 300 }}>
        <DetailsTabs
          tabs={iconTabs}
          value={value}
          onChange={setValue}
          orientation="vertical"
          selectedBackgroundColor="rgba(25, 210, 127, 0.15)"
          sx={{
            width: 100,
            "& .MuiTabs-indicator": { backgroundColor: "rgb(3, 58, 33)" },
          }}
        />
      </div>
    );
  },
  args: { tabs: iconTabs, value: "overview", onChange: () => {}, orientation: "vertical" },
};

export const WithMoreTabs: Story = {
  render: () => {
    const [value, setValue] = useState("overview");
    return <DetailsTabs tabs={mixedTabs} value={value} onChange={setValue} />;
  },
  args: { tabs: mixedTabs, value: "overview", onChange: () => {} },
};

const phoneTabs = [
  { value: "overview", label: "Overview", icon: <HomeIcon /> },
  { value: "data", label: "Data", icon: <BarChartIcon /> },
  { value: "browser", label: "Genome Browser", icon: <ViewTimelineIcon /> },
  { value: "biotech", label: "Biotech", icon: <BiotechIcon /> },
  { value: "settings", label: "Settings", icon: <SettingsIcon /> },
];

/** On a phone, where the tabs scroll and a long label wraps onto a second line, making its tab the tallest. */
export const Phone: Story = {
  tags: ["mobile", "!autodocs"],
  globals: { viewport: { value: "iphone14", isRotated: false } },
  render: () => {
    const [value, setValue] = useState("overview");
    return (
      <DetailsTabs tabs={phoneTabs} value={value} onChange={setValue} selectedBackgroundColor="rgba(73, 77, 107, .15)" />
    );
  },
  args: { tabs: phoneTabs, value: "overview", onChange: () => {} },
};
