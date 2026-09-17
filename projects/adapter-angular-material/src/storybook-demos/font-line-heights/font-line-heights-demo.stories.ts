import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { FontLineHeightsDemoComponent } from "./font-line-heights-demo.component";

/**
 * Ported from `@recursica/storybook-template`'s
 * `tokens/Font.lineHeights.stories.tsx` — see
 * `../sizes/sizes-demo.stories.ts` for the full rationale shared by every
 * demo under `src/storybook-demos/`.
 */
const meta: Meta<FontLineHeightsDemoComponent> = {
  title: "Tokens/Font/Line Heights",
  component: FontLineHeightsDemoComponent,
  decorators: [moduleMetadata({ imports: [FontLineHeightsDemoComponent] })],
  parameters: {
    layout: "padded",
  },
};
export default meta;

type Story = StoryObj<FontLineHeightsDemoComponent>;

export const Default: Story = {
  render: () => ({
    template: `<storybook-demo-font-line-heights />`,
  }),
};
