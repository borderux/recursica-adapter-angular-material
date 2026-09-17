import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { TypeDemoComponent } from "./type-demo.component";

/**
 * Ported from `@recursica/storybook-template`'s `theme/Type.stories.tsx` —
 * see `../sizes/sizes-demo.stories.ts` for the full rationale shared by
 * every demo under `src/storybook-demos/`.
 */
const meta: Meta<TypeDemoComponent> = {
  title: "Theme/Type",
  component: TypeDemoComponent,
  decorators: [moduleMetadata({ imports: [TypeDemoComponent] })],
  parameters: {
    layout: "padded",
  },
};
export default meta;

type Story = StoryObj<TypeDemoComponent>;

export const Default: Story = {
  render: () => ({
    template: `<storybook-demo-type />`,
  }),
};
