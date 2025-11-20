import React, { useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import Box from '@mui/material/Box';
import { Treemap } from './packages/visualization/src/components/TreeMap';

function TestingPage() {
  type MyMetadata = {
    description?: string;
  };

  const data = [
    {
      label: "Metabolic disorder", displayValue: 294, style: { color: "#FCB467", labelColor: "#9C5A13" },
      children: [
        { label: "Nutritional disorder", value: 93, style: { labelColor: "#9C5A13" } },
        { label: "Gout", value: 41, style: { labelColor: "#9C5A13" } },
        { label: "Diabetic nephropathy", value: 34, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Inborn errors of metabolism", value: 29, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Proteostasis deficiencies", value: 27, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Metabolic syndrome", value: 26, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Diabetic retinopathy", value: 16, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Hyperlipidemia", value: 13, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Glucose metabolism disease", value: 11, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Acquired metabolic disease", value: 10, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Mineral metabolism disease", value: 9, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Disorder of acid-base balance", value: 4, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Hypertriglyceridemia", value: 4, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Hyperlipoproteinemia", value: 3, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Carbohydrate metabolism disease", value: 3, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Amino acid metabolism disease", value: 3, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Bilirubin metabolism disease", value: 2, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Disorder of lipid metabolism", value: 2, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Disorder of purine or pyrimidine metabolism", value: 2, style: { color: "#FC3C99", labelColor: "#9C5A13" } }]
    },
    {
      label: "Metabolic disorder", style: { color: "#FCB467", labelColor: "#9C5A13" },
      children: [
        { label: "Nutritional disorder", value: 93, style: { labelColor: "#9C5A13" } },
        { label: "Gout", value: 41, style: { labelColor: "#9C5A13" } },
        { label: "Diabetic nephropathy", value: 34, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Inborn errors of metabolism", value: 29, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Proteostasis deficiencies", value: 27, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Metabolic syndrome", value: 26, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Diabetic retinopathy", value: 16, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Hyperlipidemia", value: 13, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Glucose metabolism disease", value: 11, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Acquired metabolic disease", value: 10, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Mineral metabolism disease", value: 9, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Disorder of acid-base balance", value: 4, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Hypertriglyceridemia", value: 4, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Hyperlipoproteinemia", value: 3, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Carbohydrate metabolism disease", value: 3, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Amino acid metabolism disease", value: 3, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Bilirubin metabolism disease", value: 2, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Disorder of lipid metabolism", value: 2, style: { color: "#FC3C99", labelColor: "#9C5A13" } },
        { label: "Disorder of purine or pyrimidine metabolism", value: 2, style: { color: "#FC3C99", labelColor: "#9C5A13" } }]
    },
  ]

  const otherData = [
        { label: "Nutritional disorder", value: 0, style: { labelColor: "#9C5A13" } },
        { label: "Nutritional disorder", value: 0, style: { labelColor: "#9C5A13" } },
      ]

  return (
    <Box height="700px" width="auto" padding={0} sx={{ position: "relative" }}>
      <Treemap
        data={data}
        treemapStyle={{ padding: 8, borderRadius: 5, paddingOuter: 1 }}
        labelPlacement='topLeft'
        tooltipBody={(node) => (
          <Box maxWidth={300}>
            <div><strong>Label:</strong> {node.label}</div>
            <div><strong>Value:</strong> {node.value}</div>
          </Box>
        )}
        tileMethod='treemapBinary'
        animation="slideRight"
      />
    </Box>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<TestingPage />);
