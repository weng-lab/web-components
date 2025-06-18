import type { Meta, StoryObj } from '@storybook/react-vite';

import { TestComponent } from "./TestComponent";

const meta = {
  component: TestComponent,
  title: 'psychscreen-legacy-components/TestComponent'
} satisfies Meta<typeof TestComponent>;

export default meta

type Story = StoryObj<typeof meta>

export const Text = {
  args: {
    variant: "text"
  }
} satisfies Story