import type { TabOwnProps } from "@mui/material";
import type React from "react";

export type Direction = "row" | "column";
export type ResponsiveDirection = Direction | Partial<Record<"xs" | "sm" | "md" | "lg" | "xl", Direction>>;

export type TwoPanePlotConfig = {
  tabTitle: string;
  icon?: TabOwnProps["icon"];
  plotComponent: React.ReactNode;
  onDownloadSVG?: () => void;
  onDownloadPNG?: () => void;
};

export type TwoPaneLayoutProps = {
  TableComponent: React.ReactNode;
  plots: readonly TwoPanePlotConfig[];
  direction?: ResponsiveDirection;
  columnHeight?: string;
  rowHeight?: string;
};
