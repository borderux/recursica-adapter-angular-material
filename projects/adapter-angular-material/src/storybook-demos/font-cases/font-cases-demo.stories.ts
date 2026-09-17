import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { FontCasesDemoComponent } from "./font-cases-demo.component";

/**
 * Ported from `@recursica/storybook-template`'s
 * `tokens/Font.cases.stories.tsx` — see `../sizes/sizes-demo.stories.ts` for
 * the full rationale shared by every demo under `src/storybook-demos/`.
 */
const meta: Meta<FontCasesDemoComponent> = {
  title: "Tokens/Font/Cases",
  component: FontCasesDemoComponent,
  decorators: [moduleMetadata({ imports: [FontCasesDemoComponent] })],
  parameters: {
    layout: "padded",
  },
};
export default meta;

type Story = StoryObj<FontCasesDemoComponent>;

export const Default: Story = {
  render: () => ({
    template: `<storybook-demo-font-cases />`,
  }),
};
