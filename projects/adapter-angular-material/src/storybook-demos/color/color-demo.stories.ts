import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { ColorDemoComponent } from "./color-demo.component";

/**
 * Ported from `@recursica/storybook-template`'s `tokens/Color.stories.tsx`
 * — see `../sizes/sizes-demo.stories.ts` for the full rationale shared by
 * every demo under `src/storybook-demos/`.
 */
const meta: Meta<ColorDemoComponent> = {
  title: "Tokens/Color",
  component: ColorDemoComponent,
  decorators: [moduleMetadata({ imports: [ColorDemoComponent] })],
  parameters: {
    layout: "padded",
  },
};
export default meta;

type Story = StoryObj<ColorDemoComponent>;

export const Default: Story = {
  render: () => ({
    template: `<storybook-demo-color />`,
  }),
};
