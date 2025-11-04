import React, { useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import Box from '@mui/material/Box';
import { Treemap } from './packages/visualization/src/components/TreeMap'
import { TreemapNode } from './packages/visualization/src/components/TreeMap'
import { Button } from '@mui/material';
import { DownloadPlotHandle } from './packages/visualization/src/utility';
import { getSeededRandom } from '@visx/mock-data';
import { Heatmap } from './packages/visualization/src/components/Heatmap'
import { ColumnDatum, BinDatums } from './packages/visualization/src/components/Heatmap/types';

//Testing page for looking at components outside of storybook if needed (pnpm dev)

function TestingPage() {
//   type MyMetadata = {
//     description: string;
//     source: string;
//   };

//   const data: TreemapNode<MyMetadata>[] = [
//   { label: "Other Measurment", value: 2764, color: "#046798" },
//   { label: "Hematological measurement", value: 11555, color: "#398e80" },
//   { label: "lipid or lipoprotein measurement", value: 4772, color: "#699123" },
//   { label: "Body weights and measures", value: 3984, color: "#0288c9" },
//   { label: "Other diseases", value: 3004, color: "#7f79b4" },
//   { label: "Other traits", value: 2822, color: "#f75745" },
//   { label: "Other traits", value: 2822, color: "#f75745" },
//   { label: "Cancer", value: 2713, color: "#a760aa" },
//   { label: "Biological process", value: 2523, color: "#7f79b4" },
//   { label: "Cardiovascular disease", value: 1607, color: "#b13434" },
//   { label: "Imuune system disease", value: 2380, color: "#a79100" },
//   { label: "Biological process", value: 2523, color: "#7f79b4" },
//   { label: "Biological process", value: 2523, color: "#7f79b4" },
//   { label: "Biological process", value: 2523, color: "#7f79b4" },
//   { label: "Lorem ipsum", value: 2523, color: "#7f79b4" },
//   { label: "Respitory", value: 446, color: "#7f79b4" },
// ];

//   const ref = useRef<DownloadPlotHandle>(null)

//   return (
//     <Box height={"700px"} width={"auto"} padding={0} sx={{position: "relative" }}>
//       <Treemap 
//         data={data}
//         treemapStyle={{padding: 8, borderRadius: 5, paddingOuter: 1}}
//         labelPlacement='topLeft'
//         tooltipBody={(node) => (
//           <Box maxWidth={300}>
//             <div><strong>Label:</strong> {node.label}</div>
//             <div><strong>Value:</strong> {node.value}</div>
//           </Box>
//         )}
//         tileMethod='treemapDice'
//         ref={ref}
//       />
//       <Button onClick={() => ref.current?.downloadSVG()}>Download</Button>
//     </Box>
//   );

  function randomString(maxLength: number) {
    const length = Math.floor(Math.random() * maxLength) + 1; // 1 to maxLength
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
      return result;
  }
  
  const heatmapData: ColumnDatum[] = Array.from({ length: 16 }, (_, colIndex) => ({
    columnNum: colIndex + 1,
    columnName: randomString(40), 
    rows: Array.from({ length: 16 }, (_, rowIndex) => ({
      rowNum: rowIndex + 1,
      rowName: randomString(40), 
      count: Math.floor(Math.random() * 100),
    })),
  }));

  return (
    <Box height={"700px"} width={"700px"} padding={0} sx={{position: "relative" }}>
      <Heatmap 
        data={heatmapData}
        onHover={(hovered) => console.log("hovered:", hovered)}
        xLabel='xlabel'
        yLabel='ylabel'
        isRect={true}
        tooltipBody={(row, column, bin) => (
        <Box maxWidth={300}>
          <div><strong>Row:</strong> {row}</div>
          <div><strong>Column:</strong> {column}</div>
          <div><strong>Bin:</strong> {bin}</div>
        </Box>)}
        onClick={(row, column, bin) => { alert(JSON.stringify({ row, column, bin })); }}
        color1="#122549"
        color2="#6daedb"
      />
    </Box>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <TestingPage />
);
