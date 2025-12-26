import React, { useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import Box from '@mui/material/Box';
import {  ScatterPlot } from './packages/visualization/src/components/ScatterPlot';
import { Button } from '@mui/material';
import { DownloadPlotHandle } from './packages/visualization/src/utility';
import { BarData } from './packages/visualization/src/components/BarPlot/types';
import BarPlot from './packages/visualization/src/components/BarPlot/barplot';

function TestingPage() {
  type MyMetadata = {
    description?: string;
    source?: string;
  };

  const sampleData: BarData<MyMetadata>[] = [
      {
          category: "Group A",
          label: "Apples",
          value: 30,
          id: "apples-a1",
          color: "#FF6384",
          metadata: { description: "Red apples from Group A", source: "Orchard 1" }
      },
      {
          category: "Group B",
          label: "Grapes",
          value: 50,
          id: "grapes-b1",
          color: "#4BC0C0",
          metadata: { description: "Seedless grapes from Group B", source: "Vineyard 1" }
      },
      {
          category: "Group C",
          label: "Bananas",
          value: 27,
          id: "bananas-c1",
          color: "#FFCD56",
          metadata: { description: "Sweet bananas from Group C", source: "Plantation 4" }
      },
      {
          category: "Group A",
          label: "Apples",
          value: 30,
          id: "apples-a2",
          color: "#FF6384",
          metadata: { description: "Red apples from Group A", source: "Orchard 1" }
      },
      {
          category: "Group B",
          label: "Grapes",
          value: 50,
          id: "grapes-b2",
          color: "#4BC0C0",
          metadata: { description: "Seedless grapes from Group B", source: "Vineyard 1" }
      },
      {
          category: "Group C",
          label: "Bananas",
          value: 27,
          id: "bananas-c2",
          color: "#FFCD56",
          metadata: { description: "Sweet bananas from Group C", source: "Plantation 4" }
      },
      {
          category: "Group A",
          label: "Apples",
          value: 30,
          id: "apples-a3",
          color: "#FF6384",
          metadata: { description: "Red apples from Group A", source: "Orchard 1" }
      },
      {
          category: "Group B",
          label: "Grapes",
          value: 50,
          id: "grapes-b3",
          color: "#4BC0C0",
          metadata: { description: "Seedless grapes from Group B", source: "Vineyard 1" }
      },
      {
          category: "Group C",
          label: "Bananas",
          value: 27,
          id: "bananas-c3",
          color: "#FFCD56",
          metadata: { description: "Sweet bananas from Group C", source: "Plantation 4" }
      },
      {
          category: "Group A",
          label: "Apples",
          value: 30,
          id: "apples-a4",
          color: "#FF6384",
          metadata: { description: "Red apples from Group A", source: "Orchard 1" }
      },
      {
          category: "Group B",
          label: "Grapes",
          value: 50,
          id: "grapes-b4",
          color: "#4BC0C0",
          metadata: { description: "Seedless grapes from Group B", source: "Vineyard 1" }
      },
      {
          category: "Group C",
          label: "Bananas",
          value: 27,
          id: "bananas-c4",
          color: "#FFCD56",
          metadata: { description: "Sweet bananas from Group C", source: "Plantation 4" }
      },
  ]

  return (
    <Box height="250px" width="auto" padding={0} sx={{ position: "relative", border: "1px solid black", overflow: "auto" }}>
      <BarPlot
        data={sampleData}
        animation="scale"
        barSize={25}
      />
    </Box>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<TestingPage />);
