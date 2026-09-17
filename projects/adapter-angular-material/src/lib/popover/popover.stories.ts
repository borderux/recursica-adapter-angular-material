import type { Meta, StoryObj } from "@storybook/angular";
import { PopoverComponent } from "./popover.component";

/**
 * STUB story (docs/CREATING_AN_ADAPTER.md step 9). The "🚧 " title prefix
 * is what makes in-development components visually distinct in Storybook's
 * sidebar — remove it (and rename the title to "UI-Kit/Popover") only
 * once this component is implemented for real, per step 9 item 7 / step 10
 * item 3.
 */
const meta: Meta<PopoverComponent> = {
  title: "Components/🚧 Popover",
  component: PopoverComponent,
};
export default meta;

type Story = StoryObj<PopoverComponent>;

export const Default: Story = {};
