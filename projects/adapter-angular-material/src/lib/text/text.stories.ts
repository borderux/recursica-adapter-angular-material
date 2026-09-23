import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { TextComponent } from "./text.component";
import { StackComponent } from "../stack/stack.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * genesis adapter's own `Text.stories.tsx` / `test/golden/ui-kit-text--*.png`.
 */
const meta: Meta<TextComponent> = {
  title: "UI-Kit/Text",
  component: TextComponent,
  decorators: [
    moduleMetadata({
      imports: [TextComponent, StackComponent],
    }),
  ],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "body",
        "body-small",
        "caption",
        "overline",
        "subtitle",
        "subtitle-small",
      ],
    },
  },
};
export default meta;

type Story = StoryObj<TextComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <rec-text variant="body">This is standard body typography controlled by the central UI-kit boundaries exclusively.</rec-text>
    `,
  }),
};

export const StaticVariations: Story = {
  render: () => ({
    template: `
      <rec-stack gap="16px">
        <rec-text variant="body">Body (Base paragraph and generic information flow)</rec-text>
        <rec-text variant="body-small">Body Small (Compacted list items and helper blocks)</rec-text>
        <rec-text variant="caption">Caption (Data table descriptions or micro-labels)</rec-text>
        <rec-text variant="overline">Overline (Card contextual pre-headers and categorical tags)</rec-text>
        <rec-text variant="subtitle">Subtitle (Minor sub-headers avoiding heavy display weights)</rec-text>
        <rec-text variant="subtitle-small">Subtitle Small (Section anchors deep in hierarchy)</rec-text>
      </rec-stack>
    `,
  }),
};
