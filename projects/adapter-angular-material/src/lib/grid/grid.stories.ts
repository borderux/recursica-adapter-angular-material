import type { Meta, StoryObj } from "@storybook/angular";
import { GridComponent } from "./grid.component";

/**
 * STUB story (docs/CREATING_AN_ADAPTER.md step 9). The "🚧 " title prefix
 * is what makes in-development components visually distinct in Storybook's
 * sidebar — remove it (and rename the title to "UI-Kit/Grid") only
 * once this component is implemented for real, per step 9 item 7 / step 10
 * item 3.
 */
const meta: Meta<GridComponent> = {
  title: "Components/🚧 Grid",
  component: GridComponent,
};
export default meta;

type Story = StoryObj<GridComponent>;

export const Default: Story = {};
