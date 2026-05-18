import { TabsOwnProps } from "@mui/material";
import React from "react";

export type TabItem = {
  value: string;
  label: string;
  icon?: React.ReactNode;
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
  /** Sticky top offset. Defaults to 0. */
  top?: string | number;
  /** Background color of the selected tab highlight (vertical orientation only). */
  selectedBackgroundColor?: string;
};
