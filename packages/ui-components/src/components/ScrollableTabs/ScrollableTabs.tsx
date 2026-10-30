import { Tabs, type TabsProps } from "@mui/material";
import { useForkRef } from "@mui/material/utils";
import React, { forwardRef, useEffect, useRef } from "react";

/** How far the tabs fade out at an end with more past it, in px. */
const FADE = 18;
const mask = (direction: "right" | "bottom") =>
  `linear-gradient(to ${direction}, transparent 0, #000 var(--fade-start, 0px), #000 calc(100% - var(--fade-end, 0px)), transparent 100%)`;

export type ScrollableTabsProps = TabsProps & {
  /** Rendered in place of MUI's Tabs, such as MUI Lab's TabList, which takes the same props. */
  TabsComponent?: React.ElementType;
  /**
   * Whether the tabs fade out at an end with more past it. Off while a tab is dragged, say, as the fade would
   * hide it past the ends.
   * @default true
   */
  fade?: boolean;
};

/**
 * MUI's Tabs, scrolling when they overflow, with their scroll buttons on phones too, and the tabs fading out at an
 * end with more past it, as visualization's HorizontalScroller. Takes Tabs' props, which override these defaults.
 */
export const ScrollableTabs = forwardRef<HTMLDivElement, ScrollableTabsProps>(function ScrollableTabs(
  { TabsComponent = Tabs, orientation = "horizontal", fade = true, sx, ...props },
  ref
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const forkedRef = useForkRef(ref, rootRef);
  const vertical = orientation === "vertical";

  useEffect(() => {
    const scroller = rootRef.current?.querySelector<HTMLElement>(".MuiTabs-scroller");
    if (!scroller) return;
    const update = () => {
      const before = vertical ? scroller.scrollTop : scroller.scrollLeft;
      const after = vertical
        ? scroller.scrollHeight - scroller.clientHeight - before
        : scroller.scrollWidth - scroller.clientWidth - before;
      // Each fade deepens over the first FADE px scrolled from its end, rather than appearing at once. Set straight
      // on the element, so scrolling doesn't re-render the tabs.
      scroller.style.setProperty("--fade-start", `${Math.min(Math.max(before, 0), FADE)}px`);
      scroller.style.setProperty("--fade-end", `${Math.min(Math.max(after, 0), FADE)}px`);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    // The list of tabs, which grows as tabs are added.
    if (scroller.firstElementChild) observer.observe(scroller.firstElementChild);
    scroller.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      scroller.removeEventListener("scroll", update);
    };
  }, [vertical]);

  const maskImage = fade ? mask(vertical ? "bottom" : "right") : "none";
  return (
    <TabsComponent
      ref={forkedRef}
      orientation={orientation}
      variant="scrollable"
      scrollButtons="auto"
      allowScrollButtonsMobile
      {...props}
      sx={[
        {
          "& .MuiTabs-scrollButtons.Mui-disabled": { opacity: 0.3 },
          // A mask rather than a gradient painted over the tabs, so they fade over whatever background they sit on.
          "& .MuiTabs-scroller": { maskImage, WebkitMaskImage: maskImage },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
});
