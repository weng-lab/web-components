import React, { useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import Box from '@mui/material/Box';
import {  ScatterPlot } from './packages/visualization/src/components/ScatterPlot';
import { Button } from '@mui/material';
import { DownloadPlotHandle } from './packages/visualization/src/utility';

function TestingPage() {
  type MyMetadata = {
    description?: string;
  };

  type Point = {
    x: number;
    y: number;
    color: string;
    shape?: "circle" | "triangle";
};

  // Example data for the scatter plot
  const scatterData: Point[] = [
    { x: 1, y: 2, color: 'red' },
    { x: 3, y: 4, color: 'blue' },
    { x: 5, y: 6, color: 'green' },
  ];

      const ref = useRef<DownloadPlotHandle>(null)

  return (
    <Box height="700px" width="auto" padding={0} sx={{ position: "relative" }}>
      <ScatterPlot
        pointData={scatterData}
        loading={false}
        ref={ref}
      />
      <Button onClick={() => ref.current?.downloadPNG()}>Download</Button>
    </Box>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<TestingPage />);
