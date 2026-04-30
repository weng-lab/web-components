import React from "react";
import type { YGridlinesProps } from "./types";

const linearScale = (d: number[], r: number[]) => (v: number) =>
  r[0] + (r[1] - r[0]) * ((v - d[0]) / (d[1] - d[0]));

export const YGridlines: React.FC<YGridlinesProps> = ({
  minrange,
  maxrange,
  xstart,
  width,
  height,
  xaxis_y,
  numberofgridlines,
  stroke,
}) => {
  const xls = linearScale([minrange, maxrange], [xstart, width]);
  const xRange = maxrange - minrange;
  const h = xaxis_y + height;
  const deltaX = Math.ceil(xRange) / numberofgridlines;
  const nbins = Math.ceil(xRange / deltaX);
  const bins = Array.from(Array(nbins).keys());

  return (
    <g stroke={stroke || "#000000"}>
      {bins.map((i) => {
        const v = minrange + deltaX * i;
        return <line key={i} x1={xls(v)} x2={xls(v)} y1={xaxis_y} y2={h} />;
      })}
      <line x1={xls(maxrange)} x2={xls(maxrange)} y1={xaxis_y} y2={h} />;
    </g>
  );
};
