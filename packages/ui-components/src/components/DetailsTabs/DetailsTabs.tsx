import { Tab, type TabProps, Menu, MenuItem, Tooltip } from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import React, { useState, useMemo } from "react";
import { DetailsTabsProps, TabItem } from "./types";
import { ScrollableTabs } from "../ScrollableTabs";

type TooltipTabProps = TabProps & {
  tooltipTitle?: React.ReactNode;
  vertical: boolean;
};

const TooltipTab = ({ tooltipTitle, vertical, ...tabProps }: TooltipTabProps) => (
  <Tooltip title={tooltipTitle ?? ""} arrow>
    {/* A grid, so the tab fills it both ways: in a row, as tall as the tallest tab, and only as wide as the row
        leaves it, wrapping a long label, though never narrower than its longest word. As a flex box, it would leave
        the tab unshrunk, over the next one. */}
    <span style={{ display: "grid", gridTemplateColumns: vertical ? undefined : "minmax(min-content, auto)" }}>
      <Tab {...tabProps} />
    </span>
  </Tooltip>
);

export const DetailsTabs = ({
  tabs,
  value,
  onChange,
  orientation = "horizontal",
  LinkComponent,
  selectedBackgroundColor,
  iconWidth,
  iconHeight,
  sx,
}: DetailsTabsProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const verticalTabs = orientation === "vertical";

  const iconTabs = useMemo(() => tabs.filter((t) => t.icon !== undefined), [tabs]);
  const moreTabs = useMemo(() => tabs.filter((t) => t.icon === undefined), [tabs]);

  const tabVal = useMemo(
    () => (iconTabs.some((t) => t.value === value) ? value : "more"),
    [iconTabs, value]
  );

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    if (newValue === "more") return;
    onChange?.(newValue);
  };

  const resolveIcon = (tab: TabItem) => {
    const { icon } = tab;
    if (typeof icon !== "string") return icon;
    const w = tab.iconWidth ?? iconWidth ?? 24;
    const h = tab.iconHeight ?? iconHeight ?? 24;
    return <img src={icon} alt="" style={{ width: w, height: h, opacity: tab.disabled ? 0.30 : 1 }} />;
  };

  return (
    <>
      <ScrollableTabs
        value={tabVal}
        onChange={handleTabChange}
        orientation={orientation}
        sx={{
          "& .MuiTab-root.Mui-selected": {
            backgroundColor: (selectedBackgroundColor ?? "initial")
          },
          ...sx,
        }}
      >
        {iconTabs.map((tab) => (
          <TooltipTab
            key={tab.value}
            vertical={verticalTabs}
            value={tab.value}
            label={tab.label}
            icon={resolveIcon(tab) as React.ReactElement}
            disabled={tab.disabled}
            tooltipTitle={tab.disabled ? (tab.disabledMessage ?? "Not Available") : ""}
            {...(tab.href ? { component: LinkComponent ?? "a", href: tab.href } : {})}
            sx={{
              fontSize: "12px",
              width: verticalTabs ? "100%" : undefined,
              // Its icon and label at the top, level with the tallest tab's, rather than centered in its height.
              justifyContent: verticalTabs ? undefined : "flex-start",
            }}
          />
        ))}
        {moreTabs.length > 0 && (
          <Tab
            value="more"
            label="More"
            icon={<MoreHorizIcon />}
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ fontSize: "12px" }}
          />
        )}
      </ScrollableTabs>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: verticalTabs ? "top" : "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        {moreTabs.map((tab) => (
          <MenuItem
            key={tab.value}
            disabled={tab.disabled}
            onClick={() => {
              onChange?.(tab.value);
              setAnchorEl(null);
            }}
            {...(tab.href ? { component: LinkComponent ?? "a", href: tab.href } : {})}
          >
            {tab.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
