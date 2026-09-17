import type { Meta, StoryObj } from "@storybook/angular";
import { LoaderComponent } from "./loader.component";

/**
 * STUB story (docs/CREATING_AN_ADAPTER.md step 9). The "🚧 " title prefix
 * is what makes in-development components visually distinct in Storybook's
 * sidebar — remove it (and rename the title to "UI-Kit/Loader") only
 * once this component is implemented for real, per step 9 item 7 / step 10
 * item 3.
 */
const meta: Meta<LoaderComponent> = {
  title: "Components/🚧 Loader",
  component: LoaderComponent,
};
export default meta;

type Story = StoryObj<LoaderComponent>;

export const Default: Story = {};
