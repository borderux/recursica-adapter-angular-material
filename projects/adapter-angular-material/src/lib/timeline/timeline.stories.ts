import type { Meta, StoryObj } from "@storybook/angular";
import { TimelineComponent } from "./timeline.component";

/**
 * STUB story (docs/CREATING_AN_ADAPTER.md step 9). The "🚧 " title prefix
 * is what makes in-development components visually distinct in Storybook's
 * sidebar — remove it (and rename the title to "UI-Kit/Timeline") only
 * once this component is implemented for real, per step 9 item 7 / step 10
 * item 3.
 */
const meta: Meta<TimelineComponent> = {
  title: "Components/🚧 Timeline",
  component: TimelineComponent,
};
export default meta;

type Story = StoryObj<TimelineComponent>;

export const Default: Story = {};
