import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { FontDecorationsDemoComponent } from "./font-decorations-demo.component";

/**
 * Ported from `@recursica/storybook-template`'s
 * `tokens/Font.decorations.stories.tsx` — see
 * `../sizes/sizes-demo.stories.ts` for the full rationale shared by every
 * demo under `src/storybook-demos/`.
 */
const meta: Meta<FontDecorationsDemoComponent> = {
  title: "Tokens/Font/Decorations",
  component: FontDecorationsDemoComponent,
  decorators: [moduleMetadata({ imports: [FontDecorationsDemoComponent] })],
  parameters: {
    layout: "padded",
  },
};
export default meta;

type Story = StoryObj<FontDecorationsDemoComponent>;

export const Default: Story = {
  render: () => ({
    template: `<storybook-demo-font-decorations />`,
  }),
};
