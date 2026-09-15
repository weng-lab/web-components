import type { TabOwnProps } from "@mui/material";
import type React from "react";

// Direction types now live with the ResizablePanes primitive; re-exported here
// so TwoPaneLayout's public API is unchanged.
export type { Direction, ResponsiveDirection } from "../ResizablePanes";
import type { ResponsiveDirection } from "../ResizablePanes";

export type DataDownloadLink = {
  title: string;
  link: string;
};

export type TwoPanePlotConfig = {
  tabTitle: string;
  icon?: TabOwnProps["icon"];
  plotComponent: React.ReactNode;
  // May return a Promise: DownloadModal awaits it to keep the download icon showing a loading
  // spinner for as long as the export actually takes (large exports can take a noticeable beat).
  onDownloadSVG?: () => void | Promise<void>;
  onDownloadPNG?: () => void | Promise<void>;
  dataDownloadLinks?: DataDownloadLink[];
};

export type TwoPaneLayoutProps = {
  TableComponent: React.ReactNode;
  plots: readonly TwoPanePlotConfig[];
  direction?: ResponsiveDirection;
  columnHeight?: string;
  rowHeight?: string;
  /**
   * Initial width of the table pane as a percentage of the container.
   * @default 50
   */
  initialPct?: number;
  /**
   * Minimum width (%) the table pane can be dragged to.
   * @default 20
   */
  min?: number;
  /**
   * Maximum width (%) the table pane can be dragged to.
   * @default 80
   */
  max?: number;
};
