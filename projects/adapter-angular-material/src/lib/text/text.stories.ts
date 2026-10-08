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

export const Colors: Story = {
  render: () => ({
    template: `
      <rec-stack gap="16px">
        <rec-text color="default">Default (follows the layer's base text color)</rec-text>
        <rec-text color="warning">Warning (cautionary, non-blocking messaging)</rec-text>
        <rec-text color="alert">Alert (errors and destructive states)</rec-text>
        <rec-text color="success">Success (confirmations and positive states)</rec-text>
      </rec-stack>
    `,
  }),
};

export const Emphasis: Story = {
  render: () => ({
    template: `
      <rec-stack gap="16px">
        <rec-text emphasis="high">High emphasis (solid — primary reading content)</rec-text>
        <rec-text emphasis="low">Low emphasis (dimmed — secondary or supporting content)</rec-text>
      </rec-stack>
    `,
  }),
};

/** `component` renders Text as an inline `span`, a `label` or a `div`; `h1` to `h6` throw (use `rec-heading`). */
export const AsElement: Story = {
  render: () => ({
    template: `
      <rec-stack gap="16px">
        <rec-text>Default is a block paragraph.</rec-text>
        <div>Inline text: <rec-text component="span" emphasis="low">a span inside a line</rec-text>.</div>
        <rec-text component="label">A label</rec-text>
      </rec-stack>
    `,
  }),
};

/**
 * `aria-label`, `aria-labelledby`, `aria-describedby` and `id` are forwarded to the rendered
 * element, in either spelling, static or bound. The host `rec-text` keeps none of them.
 */
export const Accessibility: Story = {
  render: () => ({
    template: `
      <rec-stack gap="16px">
        <rec-text id="a11y-id" aria-label="A11Y-LABEL" aria-describedby="a11y-desc">Static attributes</rec-text>
        <rec-text ariaLabel="Camel label" ariaDescribedby="a11y-desc" component="span">Camel case inputs</rec-text>
        <span id="a11y-desc" hidden>Description</span>
      </rec-stack>
    `,
  }),
};
