import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { OpacitiesDemoComponent } from "./opacities-demo.component";

/**
 * Ported from `@recursica/storybook-template`'s
 * `tokens/Opacities.stories.tsx` — see `../sizes/sizes-demo.stories.ts` for
 * the full rationale shared by every demo under `src/storybook-demos/`.
 */
const meta: Meta<OpacitiesDemoComponent> = {
  title: "Tokens/Opacities",
  component: OpacitiesDemoComponent,
  decorators: [moduleMetadata({ imports: [OpacitiesDemoComponent] })],
  parameters: {
    layout: "padded",
  },
};
export default meta;

type Story = StoryObj<OpacitiesDemoComponent>;

export const Default: Story = {
  render: () => ({
    template: `<storybook-demo-opacities />`,
  }),
};
