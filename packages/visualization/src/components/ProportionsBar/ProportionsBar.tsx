import { useMemo, useRef } from "react";
import { useParentSize } from "@visx/responsive";
import { BarStackHorizontal } from "@visx/shape";
import { scaleBand, scaleLinear } from "@visx/scale";
import { LinearProgress, Table, TableBody, TableCell, TableRow, Typography, useTheme } from "@mui/material";
import { ProportionsBarProps } from "./types";
import { sortObjectByValueDesc } from "./helpers";
import { PlotTooltip, type PlotTooltipHandle } from "../../tooltip";
import { isTouchScreen } from "../../utility";

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
  const theme = useTheme();
  const tooltipRef = useRef<PlotTooltipHandle<Record<K, number>>>(null);

  const plotData = useMemo(() => {
    if (!data) return null
    return sortDescending ? sortObjectByValueDesc(data) : data
  }, [data, sortDescending]);

  const totalCount = plotData ? (Object.values(plotData) as number[]).reduce((prev, curr) => prev + curr, 0) : 0;

  const { parentRef, width } = useParentSize<HTMLDivElement>();

  const barLengthScale = scaleLinear<number>({
    domain: [0, totalCount],
    range: [0, width],
  });

  //Not actually using since this is only a single bar
  const uselessScale = scaleBand<string>({
    domain: [""],
    range: [0, 0],
  });

  const sharedProps = useMemo(
    () => ({
      data: plotData ? [plotData] : [],
      keys: plotData ? (Object.keys(plotData) as K[]) : [],
      color: getColor,
    }),
    [plotData, getColor]
  );

  // Fingertip-sized above and below the 4px bar on touch; not past its ends, which could run off the screen.
  const hitboxPadding = isTouchScreen() ? 20 : 10;

  return (
    <div style={{ ...style }} ref={parentRef}>
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
            style={{
              position: "absolute",
              left: 0,
              top: -hitboxPadding,
              width,
              height: 4 + hitboxPadding * 2,
              zIndex: 2,
              background: "transparent",
            }}
            onMouseMove={(event) => plotData && tooltipRef.current?.show(plotData, event)}
            onMouseLeave={() => tooltipRef.current?.hide()}
          />
        </div>
      )}
      <PlotTooltip ref={tooltipRef} zIndex={theme.zIndex.tooltip}>
        {(proportions) => (
          <>
            <Typography>{tooltipTitle}</Typography>
            <Table size="small">
              <TableBody
                sx={{
                  "& tr:last-of-type td, & tr:last-of-type th": {
                    border: 0,
                  },
                }}
              >
                {(Object.keys(proportions) as K[]).map((key, i) => {
                  const value = proportions[key];
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
          </>
        )}
      </PlotTooltip>
    </div>
  );
};
