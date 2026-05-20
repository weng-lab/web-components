import { Tabs, Tab, type TabProps, Menu, MenuItem, Tooltip } from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import React, { useState, useMemo } from "react";
import { DetailsTabsProps, TabItem } from "./types";

type TooltipTabProps = TabProps & {
  tooltipTitle?: React.ReactNode;
};

const TooltipTab = ({ tooltipTitle, ...tabProps }: TooltipTabProps) => (
  <Tooltip title={tooltipTitle ?? ""} arrow>
    <span>
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

  const resolveIcon = (icon: TabItem["icon"]) =>
    typeof icon === "string" ? <img src={icon} alt="" style={{ width: 24, height: 24 }} /> : icon;

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
        sx={{
          "& .MuiTab-root.Mui-selected": {
            backgroundColor: verticalTabs
              ? (selectedBackgroundColor ?? "rgba(73, 77, 107, .15)")
              : "initial",
          },
          "& .MuiTabs-scrollButtons.Mui-disabled": {
            opacity: 0.3,
          },
          "&.MuiTabs-root:has(.MuiTabScrollButton-root:not(.Mui-disabled) .start-scroll-icon) .MuiTabs-scroller": {
            "&::before": {
              content: '""',
              position: "fixed",
              zIndex: 1,
              pointerEvents: "none",
              ...(orientation === "horizontal"
                ? { top: 0, bottom: 0, left: 40, width: 15, background: "linear-gradient(to right, #fff 0%, rgba(255,255,255,0.8) 25%, transparent 100%)" }
                : { left: 0, right: 0, top: 40, height: 15, background: "linear-gradient(to bottom, #F2F2F2 0%, rgba(255,255,255,0.8) 25%, transparent 100%)" }),
            },
          },
          "&.MuiTabs-root:has(.MuiTabScrollButton-root:not(.Mui-disabled) .end-scroll-icon) .MuiTabs-scroller": {
            "&::after": {
              content: '""',
              position: "fixed",
              zIndex: 1,
              pointerEvents: "none",
              ...(orientation === "horizontal"
                ? { top: 0, bottom: 0, right: 40, width: 15, background: "linear-gradient(to left, #fff 0%, rgba(255,255,255,0.8) 25%, transparent 100%)" }
                : { left: 0, right: 0, bottom: 40, height: 15, background: "linear-gradient(to top, #F2F2F2 0%, rgba(255,255,255,0.8) 25%, transparent 100%)" }),
            },
          },
          contain: "layout",
          width: "100%",
          height: "100%",
          ...sx,
        }}
      >
        {iconTabs.map((tab) => (
          <TooltipTab
            key={tab.value}
            value={tab.value}
            label={tab.label}
            icon={resolveIcon(tab.icon) as React.ReactElement}
            disabled={tab.disabled}
            tooltipTitle={tab.disabled ? (tab.disabledMessage ?? "Not Available") : ""}
            {...(tab.href ? { component: LinkComponent ?? "a", href: tab.href } : {})}
            sx={{ fontSize: "12px", width: verticalTabs ? "100%" : undefined }}
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
            {...(tab.href ? { component: LinkComponent ?? "a", href: tab.href } : {})}
          >
            {tab.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
