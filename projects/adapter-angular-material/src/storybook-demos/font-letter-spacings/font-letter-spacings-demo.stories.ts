import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { FontLetterSpacingsDemoComponent } from "./font-letter-spacings-demo.component";

/**
 * Ported from `@recursica/storybook-template`'s
 * `tokens/Font.letterSpacings.stories.tsx` — see
 * `../sizes/sizes-demo.stories.ts` for the full rationale shared by every
 * demo under `src/storybook-demos/`.
 */
const meta: Meta<FontLetterSpacingsDemoComponent> = {
  title: "Tokens/Font/Letter Spacings",
  component: FontLetterSpacingsDemoComponent,
  decorators: [moduleMetadata({ imports: [FontLetterSpacingsDemoComponent] })],
  parameters: {
    layout: "padded",
  },
};
export default meta;

type Story = StoryObj<FontLetterSpacingsDemoComponent>;

export const Default: Story = {
  render: () => ({
    template: `<storybook-demo-font-letter-spacings />`,
  }),
};
