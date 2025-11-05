import { Meta, StoryObj } from "@storybook/react-vite";
import { ProportionsBar } from "./ProportionsBar";
import { getProportionsFromArray } from "./helpers";

const meta = {
  title: "visualization/ProportionsBar",
  component: ProportionsBar,
  tags: ["autodocs"],
} satisfies Meta<typeof ProportionsBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const FRUITS = ["apple", "banana", "orange", "grape", "pear"] as const
type Fruit = typeof FRUITS[number]

const FRUIT_COLORS: Record<Fruit, string> = {
  apple: "#ff0000",
  banana: "#ffeb3b",
  orange: "#ff9800",
  grape: "#9c27b0",
  pear: "#4caf50",
};

// Create mock data
const dataArray: { fruit: Fruit }[] = []
for (let i = 0; i < 10; i++) {
  dataArray.push({fruit: "apple"})
}
for (let i = 0; i < 3; i++) {
  dataArray.push({fruit: "banana"})
}
for (let i = 0; i < 5; i++) {
  dataArray.push({fruit: "orange"})
}
for (let i = 0; i < 7; i++) {
  dataArray.push({fruit: "grape"})
}

export const Default: Story = {
  args: {
    data: getProportionsFromArray(dataArray, "fruit", FRUITS),
    tooltipTitle: "Fruit Counts",
    label: "Fruit Counts",
    getColor: (key) => {
      // ordinarily the type of key should be inferred by TS and the type assertion for key is unnecessary
      // TS can't properly handle the generics in this case with props being declared like this
      return FRUIT_COLORS[key as Fruit] || "#000000";
    },
    formatLabel: (key) => {
      return key.charAt(0).toUpperCase() + key.slice(1)
    },
    sortDescending: true,
  }
};

export const Loading: Story = {
  args: {
    ...Default.args,
    loading: true
  }
};
