import React, { useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import Box from '@mui/material/Box';
import {PhyloTree, PhyloTreeProps} from './packages/visualization/src/components/PhyloTree'
import {ParentSize} from '@visx/responsive'

function TestingPage() {

  return (
    <Box width={1000} height={1000} sx={{ position: "relative", border: "1px solid black", overflow: "auto" }}>
      <ParentSize>{(parent) => <PhyloTree width={parent.width} height={parent.height} />}</ParentSize>
    </Box>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<TestingPage />);
