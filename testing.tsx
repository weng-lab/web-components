import React, { useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {PhyloTree, TreeItem} from './packages/visualization/src/components/PhyloTree'
import metadataRaw from "./packages/visualization/src/components/PhyloTree/example-data/241-mammals-metadata-w-human.txt?raw";
import { data } from "./packages/visualization/src/components/PhyloTree/example-data/241_mammals_treedata";


type TestDataNode = { name: string; branch_length: number | null; children?: TestDataNode[] };

const formatNode = (node: TestDataNode): TreeItem => {
  const newNode: TreeItem = { id: node.name, branch_length: node.branch_length };

  if (node.children) {
    const newChildren = node.children.map((child) => formatNode(child));
    newNode.children = newChildren
  }

  return newNode;
};

const ORDER_COLORS: Record<string, string> = {
  DERMOPTERA: "#d62728",
  CARNIVORA: "#1f77b4",
  LAGOMORPHA: "#ff7f0e",
  CETARTIODACTYLA: "#2ca02c",
  RODENTIA: "#9467bd",
  PRIMATES: "#d60404",
  HYRACOIDEA: "#17a2b8",
  PERISSODACTYLA: "#e377c2",
  CHIROPTERA: "#7f7f7f",
  EULIPOTYPHLA: "#6b6ecf",
  PHOLIDOTA: "#08519c",
  PILOSA: "#7f3b08",
  AFROSORICIDA: "#b15928",
  SIRENIA: "#800000",
  TUBULIDENTATA: "#006d2c",
  PROBOSCIDEA: "#4d4d4d",
  SCANDENTIA: "#b35806",
  CINGULATA: "#3f007d",
  MACROSCELIDEA: "#525252",
};

const metadataInfo: Record<string, { common_name: string; order?: string }> = {};

const text = metadataRaw;
const lines = text.trim().split(/\r?\n/);
const header = lines[0].split(/\t/).map((h) => h.trim());
const fileIndex = header.indexOf("file_name");
const commonIndex = header.indexOf("common_name");
const orderIndex = header.indexOf("order");
lines.slice(1).forEach((line) => {
  const cols = line.split(/\t/);
  const file = cols[fileIndex]?.trim();
  const common = cols[commonIndex]?.trim();
  const order = cols[orderIndex]?.trim();
  if (file) metadataInfo[file] = { common_name: common ?? file, order: order || undefined };
});

const getLabel = (item: TreeItem): string => {
  const meta = metadataInfo[item.id];
  const label = meta?.common_name ?? item.id;
  return label;
};

const getColor = (item: TreeItem) => {
  const meta = metadataInfo[item.id];
  const order = meta?.order;
  const color = ORDER_COLORS[order ?? ""] ?? null;
  return color;
};

const getOrder = (item: TreeItem) => {
  const meta = metadataInfo[item.id];
  const order = meta?.order;
  return order;
};

const args = {
  data: formatNode(data),
  highlighted: ["Homo_sapiens", "Pan_paniscus", "Pan_troglodytes", "Gorilla_gorilla", "Sorex_araneus"],
  width: 1000,
  height: 1000,
  getColor,
  getLabel,
  tooltipContents: (item: TreeItem) => (
    <div style={{ fontSize: 12 }}>
      <div style={{ fontWeight: 600 }}>{getLabel(item)}</div>
      <div style={{ opacity: 0.8 }}>{getOrder(item)}</div>
    </div>
  ),
};

function TestingPage() {
    const [useBranchLengths, setUseBranchLengths] = useState<boolean>(true);

    return (
      <div>
        <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <input type="checkbox" checked={useBranchLengths} onChange={(e) => setUseBranchLengths(e.target.checked)} />
          Use Branch Lengths
        </label>
        <PhyloTree {...args} width={1000} height={1000} />
      </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<TestingPage />);
