import React, { useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import Box from '@mui/material/Box';
import { ViolinPlot } from './packages/visualization/src/components/ViolinPlot';

function TestingPage() {
  type MyMetadata = {
    description?: string;
  };

  const distributions = [
    {data: [{value: 5}, {value: 4}, {value: 4}, {value: 3}, {value: 2}, {value: 2.5}, {value: 2.2}, {value: 2.3}, {value: 1}, {value: 1.5}], label: "test 1"},
    {data: [{value: 2}, {value: 1.8}, {value: 1.75}, {value: .89}, {value: .25}, {value: .08}, {value: 2.2}, {value: 2.3}, {value: 1}, {value: -10}], label: "test 2"},
    {data: [{value: 5}, {value: 4}, {value: 4}, {value: 4.2}, {value: 4.62}, {value: 3.5}, {value: 3.82}, {value: 2.3}, {value: 1}, {value: -8}], label: "test 3"},
    {data: [{value: 3}, {value: 3.6}, {value: 4.7}, {value: 3.90}, {value: 2.1}, {value: 2.5}, {value: 2.2}, {value: 2.3}, {value: 4.1}, {value: -1.65}], label: "test 4"},
  ]

  return (
    <Box height="700px" width="auto" padding={0} sx={{ position: "relative" }}>
      <ViolinPlot 
        loading={false}
        distributions={distributions}
        violinProps={{showAllPoints: true, jitter: 10}}
        cutoffValue={.5}
        cutoffLine='none'
        show95thPercentileLine
      />
    </Box>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<TestingPage />);
