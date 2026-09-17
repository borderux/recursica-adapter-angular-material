import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { LayoutGridsDemoComponent } from "./layout-grids-demo.component";

/**
 * Ported from `@recursica/storybook-template`'s
 * `theme/LayoutGrids.stories.tsx` — see `../sizes/sizes-demo.stories.ts`
 * for the full rationale shared by every demo under
 * `src/storybook-demos/`.
 */
const meta: Meta<LayoutGridsDemoComponent> = {
  title: "Theme/Layout Grids",
  component: LayoutGridsDemoComponent,
  decorators: [moduleMetadata({ imports: [LayoutGridsDemoComponent] })],
  parameters: {
    layout: "padded",
  },
};
export default meta;

type Story = StoryObj<LayoutGridsDemoComponent>;

export const Default: Story = {
  render: () => ({
    template: `<storybook-demo-layout-grids />`,
  }),
};
