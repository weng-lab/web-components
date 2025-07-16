import React from 'react';
import ReactDOM from 'react-dom/client';
import { BarData } from './packages/visualization/src/components/BarPlot/types.ts'
import BarPlot from './packages/visualization/src/components/BarPlot/barplot'

//Testing page for looking at components outside of storybook if needed (pnpm dev)

function TestingPage() {
  type MyMetadata = {
    description: string;
    source: string;
  };

  const sampleData: BarData<MyMetadata>[] = [
    {
      category: "Group A",
      label: "Apples",
      value: 30,
      id: "apples-a",
      color: "#FF6384",
      metadata: {
        description: "Red apples from Group A",
        source: "Orchard 1"
      }
    },
    {
      category: "Group A",
      label: "Oranges",
      value: 45,
      id: "oranges-a",
      color: "#FF9F40",
      metadata: {
        description: "Juicy oranges from Group A",
        source: "Orchard 2"
      }
    },
    {
      category: "Group B",
      label: "Bananas",
      value: 25,
      id: "bananas-b",
      color: "#FFCD56",
      metadata: {
        description: "Sweet bananas from Group B",
        source: "Plantation 3"
      }
    },
    {
      category: "Group B",
      label: "Grapes",
      value: 50,
      id: "grapes-b",
      color: "#4BC0C0",
      metadata: {
        description: "Seedless grapes from Group B",
        source: "Vineyard 4"
      }
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
    <div style={{ padding: 32, height: "100%", width: "100%" }}>
      <BarPlot
        data={sampleData}
        TooltipContents={TooltipContents}
      />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TestingPage />
  </React.StrictMode>
);
