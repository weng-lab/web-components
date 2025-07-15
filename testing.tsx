import React from 'react';
import ReactDOM from 'react-dom/client';
import ViolinPlot from './packages/visualization/src/components/ViolinPlot/violinPlot';

//Testing page for looking at components outside of storybook if needed (pnpm dev)

function TestingPage() {
  return (
    <div style={{ padding: 32, height: "600px", width: "800px" }}>
      <ViolinPlot distributions={[]} loading={false}/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TestingPage />
  </React.StrictMode>
);
