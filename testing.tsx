import React, { useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {PhyloTree} from './packages/visualization/src/components/PhyloTree'
import {Heatmap, Nucleotide} from './packages/visualization/src/components/ConservationPlot'


const NUCLEOTIDES: Nucleotide[] = ["A", "C", "G", "T", "-"] as const;

const makeConservationData = (basePairs: number): Nucleotide[][] => {
    let data = []
    for (let i = 0; i < 241; i++) {
        let speciesRow: Nucleotide[] = []
        for (let j = 0; j < basePairs; j++) {
            speciesRow.push(NUCLEOTIDES[Math.floor(Math.random() * NUCLEOTIDES.length)])
        }
        data.push(speciesRow)
    }
    return data
}

function TestingPage() {
    const [useBranchLengths, setUseBranchLengths] = useState<boolean>(true);

    return (
      <div>
        <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <input type="checkbox" checked={useBranchLengths} onChange={(e) => setUseBranchLengths(e.target.checked)} />
          Use Branch Lengths
        </label>
        <PhyloTree width={1000} height={1000} useBranchLengths={useBranchLengths} />
        <Heatmap height={241*2} width={500*2} data={makeConservationData(500)}/>
      </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<TestingPage />);
