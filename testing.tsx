import React, { useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { BarData } from './packages/visualization/src/components/BarPlot/types.ts'
import BarPlot from './packages/visualization/src/components/BarPlot/barplot'
import Box from '@mui/material/Box';
import { scaleLog } from '@visx/scale';

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
      lolipopValue: .01,
      metadata: { description: "Fresh raspberries from Group D", source: "Farm 9" }
    }
  ];

  const TooltipContents = (bar: BarData<MyMetadata>) => (
    <div style={{ padding: 2 }}>
      <strong>{bar.label}</strong>
      <div>Value: {bar.value}</div>
      {bar.metadata && (
        <>
          <div>Description: {bar.metadata.description}</div>
          <div>Source: {bar.metadata.source}</div>
        </>
      )}
    </div>
  );

  return (
    <Box height={"70vh"} overflow={"auto"} width={"auto"} padding={1} sx={{ border: '2px solid', borderColor: 'grey.400', borderRadius: '8px'}}>
      <BarPlot
        data={sampleData}
        TooltipContents={TooltipContents}
        fill
        topAxisLabel='TPM'
      />
    </Box>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TestingPage />
  </React.StrictMode>
);
