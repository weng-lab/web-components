import React, { useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import Box from '@mui/material/Box';
import { Treemap } from './packages/visualization/src/components/TreeMap'
import { TreemapNode } from './packages/visualization/src/components/TreeMap'
import { Button } from '@mui/material';
import { DownloadPlotHandle } from './packages/visualization/src/utility';

//Testing page for looking at components outside of storybook if needed (pnpm dev)

function TestingPage() {
  type MyMetadata = {
    description: string;
    source: string;
  };

  const data: TreemapNode<MyMetadata>[] = [
    {
      label: "Cancer", value: 1000, style: { color: "#046798" },
      children: [
        { label: "Lung Cancer", value: 100,
         },
        { label: "Breast Cancer", value: 200},
        { label: "Lung Cancer", value: 200 },
        { label: "Breast Cancer", value: 300},
        { label: "Lung Cancer", value: 200 },
      ]
    },
    {
      label: "Cardiovascular Disease", value: 200, style: { color: "#398e80" },
    }
  ];

  const ref = useRef<DownloadPlotHandle>(null)

  return (
    <Box height={"700px"} width={"auto"} padding={0} sx={{position: "relative" }}>
      <Treemap 
        data={data}
        treemapStyle={{padding: 8, borderRadius: 5, paddingOuter: 1, strokeWidth: 2}}
        tooltipBody={(node) => (
          <Box maxWidth={300}>
            <div><strong>Label:</strong> {node.label}</div>
            <div><strong>Value:</strong> {node.value}</div>
          </Box>
        )}
        animation='slideRight'
        ref={ref}
      />
      <Button onClick={() => ref.current?.downloadSVG()}>Download</Button>
    </Box>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <TestingPage />
);
