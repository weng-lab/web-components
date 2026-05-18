import { Tabs, Tab, Menu, MenuItem, Tooltip } from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import React, { useState, useMemo } from "react";
import { DetailsTabsProps, TabItem } from "./types";

function CloneProps(props: { children: (other: object) => React.ReactNode; [key: string]: unknown }) {
  const { children, ...other } = props;
  return children(other);
}

export const DetailsTabs = ({
  tabs,
  value,
  onChange,
  orientation = "horizontal",
  LinkComponent,
  top = 0,
  selectedBackgroundColor,
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

  const linkProps = (tab: TabItem) =>
    tab.href ? { component: LinkComponent ?? "a", href: tab.href } : {};

  return (
    <>
      <Tabs
        value={tabVal}
        onChange={handleTabChange}
        orientation={orientation}
        variant="scrollable"
        allowScrollButtonsMobile
        slotProps={{
          startScrollButtonIcon: { className: "start-scroll-icon" },
          endScrollButtonIcon: { className: "end-scroll-icon" },
        }}
        
      >
        {iconTabs.map((tab) => (
          <CloneProps key={tab.value} value={tab.value}>
            {(tabProps) => (
              <Tooltip title={tab.disabled ? (tab.disabledMessage ?? "Not Available") : ""} arrow>
                <span>
                  <Tab
                    {...(tabProps as object)}
                    label={tab.label}
                    icon={tab.icon as React.ReactElement}
                    disabled={tab.disabled}
                    {...linkProps(tab)}
                    sx={{ fontSize: "12px", width: verticalTabs ? "100%" : undefined }}
                  />
                </span>
              </Tooltip>
            )}
          </CloneProps>
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
      </Tabs>
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
            {...linkProps(tab)}
          >
            {tab.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
