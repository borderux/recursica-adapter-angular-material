import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { FontWeightsDemoComponent } from "./font-weights-demo.component";

/**
 * Ported from `@recursica/storybook-template`'s
 * `tokens/Font.weight.stories.tsx` — see `../sizes/sizes-demo.stories.ts`
 * for the full rationale shared by every demo under `src/storybook-demos/`.
 */
const meta: Meta<FontWeightsDemoComponent> = {
  title: "Tokens/Font/Weights",
  component: FontWeightsDemoComponent,
  decorators: [moduleMetadata({ imports: [FontWeightsDemoComponent] })],
  parameters: {
    layout: "padded",
  },
};
export default meta;

type Story = StoryObj<FontWeightsDemoComponent>;

export const Default: Story = {
  render: () => ({
    template: `<storybook-demo-font-weights />`,
  }),
};
