import React, { useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {PhyloTree} from './packages/visualization/src/components/PhyloTree'

function TestingPage() {
    const [useBranchLengths, setUseBranchLengths] = useState<boolean>(true);

    return (
      <div>
        <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <input type="checkbox" checked={useBranchLengths} onChange={(e) => setUseBranchLengths(e.target.checked)} />
          Use Branch Lengths
        </label>
        <PhyloTree width={1000} height={1000} useBranchLengths={useBranchLengths} />
      </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<TestingPage />);
