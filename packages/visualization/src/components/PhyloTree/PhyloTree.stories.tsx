import { useState } from "react";
import { Meta, StoryObj } from "@storybook/react-vite";
import PhyloTree from "./PhyloTree";
import { data } from "./example-data/241_mammals_treedata";
import { getColor, getLabel, getOrder } from "./example-data/utils";
import { TreeItem } from "./types";

const meta = {
  title: "visualization/PhyloTree",
  component: PhyloTree,
  tags: ["autodocs"],
  argTypes: {},
  parameters: {
    controls: { expanded: true },
  },
  decorators: [(Story) => <Story />],
} satisfies Meta<typeof PhyloTree>;

export default meta;
type Story = StoryObj<typeof meta>;

type TestDataNode = { name: string; branch_length: number | null; children?: TestDataNode[] };

const formatNode = (node: TestDataNode): TreeItem => {
  const newNode: TreeItem = { id: node.name, branch_length: node.branch_length };

  if (node.children) {
    const newChildren = node.children.map((child) => formatNode(child));
    newNode.children = newChildren
  }

  return newNode;
};

const highlighted = [
  "Acinonyx_jubatus",
  "Ailuropoda_melanoleuca",
  "Alouatta_palliata",
  "Aotus_nancymaae",
  "Aplodontia_rufa",
  "Ateles_geoffroyi",
  "Balaenoptera_acutorostrata",
  "Callicebus_donacophilus",
  "Callithrix_jacchus",
  "Canis_lupus_familiaris",
  "Catagonus_wagneri",
  "Cebus_albifrons",
  "Cebus_capucinus",
  "Ceratotherium_simum",
  "Ceratotherium_simum_cottoni",
  "Cercocebus_atys",
  "Cercopithecus_neglectus",
  "Chaetophractus_vellerosus",
  "Cheirogaleus_medius",
  "Chlorocebus_sabaeus",
  "Choloepus_didactylus",
  "Choloepus_hoffmanni",
  "Colobus_angolensis",
  "Craseonycteris_thonglongyai",
  "Daubentonia_madagascariensis",
  "Delphinapterus_leucas",
  "Dicerorhinus_sumatrensis",
  "Diceros_bicornis",
  "Dolichotis_patagonum",
  "Eidolon_helvum",
  "Erinaceus_europaeus",
  "Erythrocebus_patas",
  "Eschrichtius_robustus",
  "Eubalaena_japonica",
  "Eulemur_flavifrons",
  "Eulemur_fulvus",
  "Felis_catus",
  "Felis_nigripes",
  "Galeopterus_variegatus",
  "Gorilla_gorilla",
  "Homo_sapiens",
  "Indri_indri",
  "Inia_geoffrensis",
  "Kogia_breviceps",
  "Lemur_catta",
  "Leptonychotes_weddellii",
  "Lepus_americanus",
  "Lipotes_vexillifer",
  "Macaca_fascicularis",
  "Macaca_mulatta",
  "Macaca_nemestrina",
  "Mandrillus_leucophaeus",
  "Megaderma_lyra",
  "Mellivora_capensis",
  "Mesoplodon_bidens",
  "Microcebus_murinus",
  "Mirounga_angustirostris",
  "Mirza_coquereli",
  "Monodon_monoceros",
  "Mustela_putorius",
  "Myrmecophaga_tridactyla",
  "Nasalis_larvatus",
  "Neomonachus_schauinslandi",
  "Neophocaena_asiaeorientalis",
  "Nomascus_leucogenys",
  "Nycticebus_coucang",
  "Odobenus_rosmarus",
  "Orcinus_orca",
  "Orycteropus_afer",
  "Oryctolagus_cuniculus",
  "Otolemur_garnettii",
  "Panthera_onca",
  "Panthera_pardus",
  "Panthera_tigris",
  "Papio_anubis",
  "Phocoena_phocoena",
  "Piliocolobus_tephrosceles",
  "Pithecia_pithecia",
  "Platanista_gangetica",
  "Pongo_abelii",
  "Propithecus_coquereli",
  "Pteropus_alecto",
  "Puma_concolor",
  "Pygathrix_nemaeus",
  "Rhinolophus_sinicus",
  "Rhinopithecus_bieti",
  "Rhinopithecus_roxellana",
  "Rousettus_aegyptiacus",
  "Saguinus_imperator",
  "Saimiri_boliviensis",
  "Scalopus_aquaticus",
  "Semnopithecus_entellus",
  "Solenodon_paradoxus",
  "Spermophilus_dauricus",
  "Spilogale_gracilis",
  "Sus_scrofa",
  "Tamandua_tetradactyla",
  "Tolypeutes_matacus",
  "Tursiops_truncatus",
  "Uropsilus_gracilis",
  "Ursus_maritimus",
  "Xerus_inauris",
  "Zalophus_californianus"
]



export const Mammals241: Story = {
  args: {
    data: formatNode(data),
    width: 600,
    height: 600,
    getColor,
    getLabel,
    tooltipContents: (item) => (
      <div style={{ fontSize: 12 }}>
        <div style={{ fontWeight: 600 }}>{getLabel(item)}</div>
        <div style={{ opacity: 0.8 }}>{getOrder(item)}</div>
      </div>
    ),
  },
};

export const HighlightLeaves: Story = {
  args: {
    data: formatNode(data),
    highlighted: ["Homo_sapiens", "Pan_paniscus", "Pan_troglodytes", "Gorilla_gorilla", "Sorex_araneus"],
    width: 600,
    height: 600,
    getColor,
    getLabel,
    tooltipContents: (item) => (
      <div style={{ fontSize: 12 }}>
        <div style={{ fontWeight: 600 }}>{getLabel(item)}</div>
        <div style={{ opacity: 0.8 }}>{getOrder(item)}</div>
      </div>
    ),
  },
};

export const OnLeafHoverChange: Story = {
  args: {
    data: formatNode(data),
    highlighted: highlighted,
    width: 600,
    height: 600,
    getColor,
    getLabel,
    onLeafClick: (id) => window.alert("Clicked: " + id),
    tooltipContents: (item) => (
      <div style={{ fontSize: 12 }}>
        <div style={{ fontWeight: 600 }}>{getLabel(item)}</div>
        <div style={{ opacity: 0.8 }}>{getOrder(item)}</div>
      </div>
    ),
  },
  render: (args) => {
    const [hovered, setHovered] = useState<string[]>([])

    return (
      <>
        <PhyloTree {...args} onLeafHoverChange={setHovered} />
        <p>hovered: {hovered.join(", ")}</p>
      </>
    );
  }
};

