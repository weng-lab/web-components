import React, { useMemo, useRef } from "react";
import { BarStackHorizontal } from "@visx/shape";
import { scaleBand, scaleLinear } from "@visx/scale";
import { useTooltip, defaultStyles, useTooltipInPortal } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { LinearProgress, Table, TableBody, TableCell, TableRow, Typography } from "@mui/material";
import { TooltipInPortalProps } from "@visx/tooltip/lib/hooks/useTooltipInPortal";
import { ProportionsBarProps } from "./types";
import { sortObjectByValueDesc } from "./helpers";

export const ProportionsBar = <K extends string>({
  data,
  tooltipTitle,
  label,
  loading = false,
  sortDescending = false,
  getColor,
  formatLabel,
  style,
}: ProportionsBarProps<K>) => {
  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    scroll: true,
    detectBounds: true,
  });

  const plotData = useMemo(() => {
    if (!data) return null
    return sortDescending ? sortObjectByValueDesc(data) : data
  }, [data, sortDescending]);

  //Fix weird type error on build
  //Type error: 'TooltipInPortal' cannot be used as a JSX component.
  const TooltipComponent = TooltipInPortal as unknown as React.FC<TooltipInPortalProps>;

  const { tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } = useTooltip();

  const totalCount = plotData ? (Object.values(plotData) as number[]).reduce((prev, curr) => prev + curr, 0) : 0;

  const outerDivRef = useRef<HTMLDivElement>(null)

  const width = outerDivRef?.current ? outerDivRef.current.offsetWidth : 0

  const barLengthScale = scaleLinear<number>({
    domain: [0, totalCount],
    range: [0, width],
  });

  //Not actually using since this is only a single bar
  const uselessScale = scaleBand<string>({
    domain: [""],
    range: [0, 0],
  });

  const handleMouseOver = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const coords = localPoint(event, event);
    if (!coords) return
    showTooltip({
      tooltipLeft: coords.x,
      tooltipTop: coords.y,
    });
  };

  const sharedProps = useMemo(
    () => ({
      data: plotData ? [plotData] : [],
      keys: plotData ? (Object.keys(plotData) as K[]) : [],
      color: getColor,
    }),
    [plotData, getColor]
  );

  const hitboxPadding = 10;

  return (
    <div style={{ ...style }} ref={outerDivRef}>
      {label && <Typography variant="caption">{label}</Typography>}
      {loading ? (
        <LinearProgress />
      ) : (
        <div style={{ position: "relative" }}>
          <svg width={width} height={4} style={{ display: "block" }}>
            <BarStackHorizontal
              {...sharedProps}
              xScale={barLengthScale}
              yScale={uselessScale}
              y={() => ""}
              height={4}
            />
          </svg>
          <div
            ref={containerRef}
            style={{
              position: "absolute",
              left: -hitboxPadding,
              top: -hitboxPadding,
              width: width + hitboxPadding * 2,
              height: 4 + hitboxPadding * 2,
              zIndex: 2,
              background: "transparent",
            }}
            onMouseMove={(e) => handleMouseOver(e)}
            onMouseLeave={hideTooltip}
          />
        </div>
      )}
      {tooltipOpen && plotData && (
        <TooltipComponent top={tooltipTop} left={tooltipLeft} style={{ zIndex: 1000, ...defaultStyles }}>
          <Typography>{tooltipTitle}</Typography>
          <Table size="small">
            <TableBody
              sx={{
                "& tr:last-of-type td, & tr:last-of-type th": {
                  border: 0,
                },
              }}
            >
              {(Object.keys(plotData) as K[]).map((key, i) => {
                const value = plotData[key];
                return (
                  <TableRow key={i}>
                    <TableCell>
                      <span
                        style={{
                          display: "inline-block",
                          width: 12,
                          height: 12,
                          marginRight: 6,
                          borderRadius: "50%",
                          backgroundColor: getColor(key),
                        }}
                      />
                      {formatLabel ? formatLabel(key) : key}
                    </TableCell>
                    <TableCell align="right">{value}</TableCell>
                    <TableCell align="right">{((value / totalCount) * 100).toFixed(2)}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TooltipComponent>
      )}
    </div>
  );
};
