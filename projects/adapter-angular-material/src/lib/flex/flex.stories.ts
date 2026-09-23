import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { FlexComponent } from "./flex.component";
import { ButtonComponent } from "../button/button.component";
import { TextComponent } from "../text/text.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * genesis adapter's own `Flex.stories.tsx` / `test/golden/ui-kit-flex--*.png`.
 */
const meta: Meta<FlexComponent> = {
  title: "UI-Kit/Flex",
  component: FlexComponent,
  decorators: [
    moduleMetadata({
      imports: [FlexComponent, ButtonComponent, TextComponent],
    }),
  ],
  argTypes: {
    direction: {
      control: "select",
      options: ["row", "column", "row-reverse", "column-reverse"],
    },
    wrap: { control: "select", options: ["wrap", "nowrap", "wrap-reverse"] },
  },
};
export default meta;

type Story = StoryObj<FlexComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <rec-flex>
        <rec-button variant="solid">Block A</rec-button>
        <rec-button variant="outline">Block B</rec-button>
        <rec-text>Text inside Flex</rec-text>
      </rec-flex>
    `,
  }),
};

export const StaticGapSmallColumn: Story = {
  render: () => ({
    template: `
      <rec-flex gap="rec-sm" direction="column">
        <rec-button variant="solid">Item 1</rec-button>
        <rec-button variant="solid">Item 2</rec-button>
        <rec-button variant="solid">Item 3</rec-button>
      </rec-flex>
    `,
  }),
};

export const StaticGapLargeRow: Story = {
  render: () => ({
    template: `
      <rec-flex gap="rec-xl" direction="row">
        <rec-button variant="solid">Item 1</rec-button>
        <rec-button variant="solid">Item 2</rec-button>
        <rec-button variant="solid">Item 3</rec-button>
      </rec-flex>
    `,
  }),
};
