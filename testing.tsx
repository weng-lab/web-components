import ReactDOM from 'react-dom/client';
import {PhyloTree, TreeItem} from './packages/visualization/src/components/PhyloTree'
import metadataRaw from "./packages/visualization/src/components/PhyloTree/example-data/241-mammals-metadata-w-human.txt?raw";
import { data } from "./packages/visualization/src/components/PhyloTree/example-data/241_mammals_treedata";
import { ParentSize } from '@visx/responsive';
import { getColor, getLabel, getOrder } from './packages/visualization/src/components/PhyloTree/example-data/utils';
import { useState } from 'react';

type TestDataNode = { name: string; branch_length: number | null; children?: TestDataNode[] };

const formatNode = (node: TestDataNode): TreeItem => {
  const newNode: TreeItem = { id: node.name, branch_length: node.branch_length };

  if (node.children) {
    const newChildren = node.children.map((child) => formatNode(child));
    newNode.children = newChildren
  }

  return newNode;
};

const args = {
  data: formatNode(data),
  getColor,
  getLabel,
  tooltipContents: (id: string) => (
    <div style={{ fontSize: 12 }}>
      <div style={{ fontWeight: 600 }}>{getLabel(id)}</div>
      <div style={{ opacity: 0.8 }}>{getOrder(id)}</div>
    </div>
  ),
};

const highlightedOpts = [["Homo_sapiens"], ["Homo_sapiens", "Pan_paniscus", "Pan_troglodytes", "Gorilla_gorilla", "Sorex_araneus"]]

function TestingPage() {
  const [highlighted, setHighlighted] = useState<0 | 1>(0)

  return (
    <div>
      <button onClick={() => setHighlighted(prev => prev === 1 ? 0 : 1)}>toggle</button>
      <PhyloTree {...args} width={700} height={700} highlighted={highlightedOpts[highlighted]} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<TestingPage />);
