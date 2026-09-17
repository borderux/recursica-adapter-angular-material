import type { Meta, StoryObj } from "@storybook/angular";
import { AssistiveElementComponent } from "./assistive-element.component";

/**
 * STUB story (docs/CREATING_AN_ADAPTER.md step 9). The "🚧 " title prefix
 * is what makes in-development components visually distinct in Storybook's
 * sidebar — remove it (and rename the title to "UI-Kit/AssistiveElement") only
 * once this component is implemented for real, per step 9 item 7 / step 10
 * item 3.
 */
const meta: Meta<AssistiveElementComponent> = {
  title: "Components/🚧 AssistiveElement",
  component: AssistiveElementComponent,
};
export default meta;

type Story = StoryObj<AssistiveElementComponent>;

export const Default: Story = {};
