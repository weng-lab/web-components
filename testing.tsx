import React, { useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import Box from '@mui/material/Box';
import { Treemap } from './packages/visualization/src/components/TreeMap';
import { TreemapNode } from './packages/visualization/src/components/TreeMap';
import { Button } from '@mui/material';
import { DownloadPlotHandle } from './packages/visualization/src/utility';

function TestingPage() {
  type MyMetadata = {
    description?: string;
    source?: string;
  };

  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

const data: TreemapNode<MyMetadata>[] = useMemo(() => {
  return [
    {
      label: "Cancer",
      value: 1000,
      style: { color: "#046798" },
      children: [
        { label: "Lung Cancer", value: 100, style: { color: "#69b3a2" } },
        { label: "Breast Cancer", value: 200, style: { color: "#e08e79" } },
        { label: "Liver Cancer", value: 200, style: { color: "#b39ddb" } },
        { label: "Brain Cancer", value: 300, style: { color: "#ffcc80" } },
        { label: "Pancreatic Cancer", value: 200, style: { color: "#ef9a9a" } },
      ],
    },
    {
      label: "Cardiovascular Disease",
      value: 200,
      style: { color: "#398e80", strokeWidth: selectedLabel === "Cardiovascular Disease" ? 4 : 0 },
    },
  ];
}, [selectedLabel]);

  
  const ref = useRef<DownloadPlotHandle>(null);

  return (
    <Box height="700px" width="auto" padding={0} sx={{ position: "relative" }}>
      <Treemap
        data={data}
        treemapStyle={{ padding: 8, borderRadius: 5, paddingOuter: 1 }}
        tooltipBody={(node) => (
          <Box maxWidth={300}>
            <div><strong>Label:</strong> {node.label}</div>
            <div><strong>Value:</strong> {node.value}</div>
          </Box>
        )}
        animation="slideRight"
        onNodeClicked={(node) =>
          setSelectedLabel((prev) => (prev === node.label ? null : node.label))
        }
        ref={ref}
      />
      <Button onClick={() => ref.current?.downloadSVG()}>Download</Button>
    </Box>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<TestingPage />);
