import type { SxProps, TabsOwnProps, Theme } from "@mui/material";
import React from "react";

export type TabItem = {
  value: string;
  label: string;
  icon?: React.ReactNode | string;
  iconWidth?: number;
  iconHeight?: number;
  href?: string;
  disabled?: boolean;
  disabledMessage?: string;
};

export type DetailsTabsProps = {
  tabs: TabItem[];
  value: string;
  onChange?: (value: string) => void;
  orientation?: TabsOwnProps["orientation"];
  LinkComponent?: React.ElementType;
  /** Background color of the selected tab highlight (vertical orientation only). */
  selectedBackgroundColor?: string;
  iconWidth?: number;
  iconHeight?: number;
  sx?: SxProps<Theme>;
};
