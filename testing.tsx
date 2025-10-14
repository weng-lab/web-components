import React, { useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import Box from '@mui/material/Box';
import { Treemap } from './packages/visualization/src/components/TreeMap'
import { TreemapNode } from './packages/visualization/src/components/TreeMap'

//Testing page for looking at components outside of storybook if needed (pnpm dev)

function TestingPage() {
  type MyMetadata = {
    description: string;
    source: string;
  };

  const data: TreemapNode[] = [
  { label: "A", value: 50, color: "#5B8FF9" },
  { label: "B", value: 100 },
  { label: "D1", value: 10 },
  { label: "D2", value: 70, color: "#2bb665ff" },
  { label: "D3", value: 40, color: "#bb1ad1ff" },
  {
    label: "C",
    value: 0,
    children: [
      { label: "C1", value: 20 },
      { label: "C2", value: 40, color: "#FF7875" },
    ],
  },
];

  return (
    <Box height={"700px"} width={"auto"} padding={0} sx={{position: "relative" }}>
      <Treemap 
        data={data}
        sx={{padding: 5, borderRadius: 5, strokeWidth: 0, paddingOuter: 0}}
      />
    </Box>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <TestingPage />
);
