import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { DimensionsDemoComponent } from "./dimensions-demo.component";

/**
 * Ported from `@recursica/storybook-template`'s
 * `theme/Dimensions.stories.tsx` — see `../sizes/sizes-demo.stories.ts` for
 * the full rationale shared by every demo under `src/storybook-demos/`.
 */
const meta: Meta<DimensionsDemoComponent> = {
  title: "Theme/Dimensions",
  component: DimensionsDemoComponent,
  decorators: [moduleMetadata({ imports: [DimensionsDemoComponent] })],
  parameters: {
    layout: "padded",
  },
};
export default meta;

type Story = StoryObj<DimensionsDemoComponent>;

export const Default: Story = {
  render: () => ({
    template: `<storybook-demo-dimensions />`,
  }),
};
