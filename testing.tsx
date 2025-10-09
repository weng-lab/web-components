import React, { useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { BarData, BarPlotHandle } from './packages/visualization/src/components/BarPlot/types.ts'
import BarPlot from './packages/visualization/src/components/BarPlot/barplot'
import Box from '@mui/material/Box';
import { scaleLog } from '@visx/scale';
import ViolinPlot from './packages/visualization/src/components/ViolinPlot/violinPlot';
import { ViolinPlotHandle } from './packages/visualization/src/components/ViolinPlot/types.ts';
import { Button } from '@mui/material';
import { Point, ScatterPlotHandle } from './packages/visualization/src/components/ScatterPlot/types.ts';
import ScatterPlot from './packages/visualization/src/components/ScatterPlot/scatterplot.tsx';

//Testing page for looking at components outside of storybook if needed (pnpm dev)

function TestingPage() {
  type MyMetadata = {
    description: string;
    source: string;
  };

  const sampleData: BarData<MyMetadata>[] = [
    // Group A
    {
      category: "adrenal gland",
      label: "Apples",
      value: 30,
      id: "apples-a1",
      color: "#FF6384",
      metadata: { description: "Red apples from Group A", source: "Orchard 1" }
    },
    {
      category: "liver",
      label: "Oranges",
      value: 45,
      id: "oranges-a1",
      color: "#FF9F40",
      metadata: { description: "Juicy oranges from Group A", source: "Orchard 2" }
    },
    {
      category: "large intestine",
      label: "Pears",
      value: 38,
      id: "pears-a1",
      color: "#9CCC65",
      metadata: { description: "Crisp pears from Group A", source: "Orchard 3" }
    },
    {
      category: "embryo",
      label: "Cherries",
      value: 28,
      id: "cherries-a1",
      color: "#E57373",
      metadata: { description: "Sweet cherries from Group A", source: "Orchard 4" }
    },

    // Group B
    {
      category: "connective tissue",
      label: "Grapes",
      value: 50,
      id: "grapes-b1",
      color: "#4BC0C0",
      metadata: { description: "Seedless grapes from Group B", source: "Vineyard 1" }
    },
    {
      category: "Group B",
      label: "Grapes",
      value: 55,
      id: "grapes-b2",
      color: "#4BC0C0",
      metadata: { description: "Sweet green grapes from Group B", source: "Vineyard 2" }
    },
    {
      category: "Group B",
      label: "Bananas",
      value: 25,
      id: "bananas-b1",
      color: "#FFCD56",
      metadata: { description: "Sweet bananas from Group B", source: "Plantation 1" }
    },
    {
      category: "Group B",
      label: "Strawberries",
      value: 42,
      id: "strawberries-b1",
      color: "#EC407A",
      metadata: { description: "Fresh strawberries from Group B", source: "Farm 2" }
    },
    {
      category: "Group B",
      label: "Peaches",
      value: 35,
      id: "peaches-b1",
      color: "#FFB74D",
      metadata: { description: "Ripe peaches from Group B", source: "Farm 3" }
    },

    // Group C
    {
      category: "Group C",
      label: "Bananas",
      value: 27,
      id: "bananas-c1",
      color: "#FFCD56",
      metadata: { description: "Sweet bananas from Group C", source: "Plantation 4" }
    },
    {
      category: "Group C",
      label: "Kiwis",
      value: 22,
      id: "kiwis-c1",
      color: "#8BC34A",
      metadata: { description: "Tangy kiwis from Group C", source: "Farm 5" }
    },
    {
      category: "Group C",
      label: "Mangoes",
      value: 46,
      id: "mangoes-c1",
      color: "#FF9800",
      metadata: { description: "Juicy mangoes from Group C", source: "Farm 6" }
    },
    {
      category: "Group C",
      label: "3577.22, Adrenal gland, femal... (ENCSR801MKV)",
      value: 60,
      id: "watermelon-c1",
      color: "#4DB6AC",
      metadata: { description: "Refreshing watermelon from Group C", source: "Farm 7" }
    },

    // Group D
    {
      category: "Group D",
      label: "Pineapples",
      value: 48,
      id: "pineapples-d1",
      color: "#FDD835",
      metadata: { description: "Tropical pineapples from Group D", source: "Plantation 5" }
    },
    {
      category: "Group D",
      label: "Blueberries",
      value: 36,
      id: "blueberries-d1",
      color: "#5C6BC0",
      metadata: { description: "Wild blueberries from Group D", source: "Farm 8" }
    },
    {
      category: "Group D",
      label: "Plums",
      value: 33,
      id: "plums-d1",
      color: "#AB47BC",
      metadata: { description: "Juicy plums from Group D", source: "Orchard 5" }
    },
    {
      category: "Group D",
      label: "Raspberries",
      value: 40,
      id: "raspberries-d1",
      color: "#E91E63",
      lollipopValue: .01,
      metadata: { description: "Fresh raspberries from Group D", source: "Farm 9" }
    }
  ];

  const testData = [
    {"label": "adipose", "data": [4.68, 5.72, 4.81, 10.12, 5.07, 18.83].map(value => ({ value })), violinColor: "blue"},
    {"label": "adrenal gland", "data": [19.86, 23.6, 5.04, 4.09, 23.08, 8.15, 15.44].map(value => ({ value })), violinColor: "red"},
    {"label": "blood", "data": [5.12, 7.42, 18.52, 23.46, 15.41, 47.5, 32.01, 22.78, 12.06, 27.06, 44.23, 39.24, 29.05, 32.5, 68.4, 28.81, 37.65, 32.54, 9.04, 30.29, 31.45, 43.16, 15.51, 27.6, 37.81, 12.44, 39.48, 35.06, 35.31, 39.83, 20.37, 28.68, 18.33, 27.99, 28.04, 53.1, 37.66, 48.59, 35.95, 38.29, 34.55, 28.91, 49.37].map(value => ({ value })), violinColor: "orange"},
    {"label": "testis", "data": [13.88, 9.57].map(value => ({ value })), violinColor: "green"},
  ]

  const violinRef = useRef<ScatterPlotHandle>(null);
  const scatterData: Point<MyMetadata>[] = [
    { x: 1, y: 2, color: 'red' },
    { x: 3, y: 4, color: 'blue' },
    { x: 5, y: 6, color: 'green' },
];

  return (
    <Box height={"700px"} overflow={"auto"} width={"auto"} padding={2} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, position: "relative" }}>
      <Button onClick={() => violinRef.current?.downloadSVG()} variant="contained">
        Download SVG
      </Button>
      {/* <BarPlot
        data={sampleData}
        topAxisLabel='log2(Fold Enrichment)'
        legendTitle='FDR'
        barSize={3}
        barSpacing={20}
        cutoffNegativeValues
        plotRef={violinRef}
      /> */}
      <ScatterPlot
        pointData={scatterData}
        loading={false}
        leftAxisLabel='UMAP1'
        bottomAxisLabel='UMAP2'
        plotRef={violinRef}
      />

      
      {/* <ViolinPlot
          plotRef={violinRef}
          distributions={testData}
          loading={false}
          axisLabel="SCREEN Gene Expression (SP1)"
          labelOrientation="leftDiagonal"
          violinProps={{
            bandwidth: "scott",
            showAllPoints: true,
            jitter: 10,
          }}
          crossProps={{
            outliers: "all"
          }}
        /> */}
    </Box>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <TestingPage />
);
