import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { StackComponent } from "./stack.component";
import { ButtonComponent } from "../button/button.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * genesis adapter's own `Stack.stories.tsx` / `test/golden/ui-kit-stack--*.png`.
 */
const meta: Meta<StackComponent> = {
  title: "UI-Kit/Stack",
  component: StackComponent,
  decorators: [
    moduleMetadata({
      imports: [StackComponent, ButtonComponent],
    }),
  ],
};
export default meta;

type Story = StoryObj<StackComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <rec-stack>
        <rec-button variant="solid">Primary Block</rec-button>
        <rec-button variant="outline">Secondary Block</rec-button>
        <span>Text element within Stack</span>
      </rec-stack>
    `,
  }),
};

export const StaticGapSmall: Story = {
  render: () => ({
    template: `
      <rec-stack gap="rec-sm">
        <rec-button variant="solid">Item 1</rec-button>
        <rec-button variant="solid">Item 2</rec-button>
        <rec-button variant="solid">Item 3</rec-button>
      </rec-stack>
    `,
  }),
};

export const StaticGapLarge: Story = {
  render: () => ({
    template: `
      <rec-stack gap="rec-xl">
        <rec-button variant="solid">Item 1</rec-button>
        <rec-button variant="solid">Item 2</rec-button>
        <rec-button variant="solid">Item 3</rec-button>
      </rec-stack>
    `,
  }),
};
