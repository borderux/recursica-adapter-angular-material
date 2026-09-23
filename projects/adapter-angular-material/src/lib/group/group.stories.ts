import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { GroupComponent } from "./group.component";
import { ButtonComponent } from "../button/button.component";
import { TextComponent } from "../text/text.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * genesis adapter's own `Group.stories.tsx` / `test/golden/ui-kit-group--*.png`.
 */
const meta: Meta<GroupComponent> = {
  title: "UI-Kit/Group",
  component: GroupComponent,
  decorators: [
    moduleMetadata({
      imports: [GroupComponent, ButtonComponent, TextComponent],
    }),
  ],
};
export default meta;

type Story = StoryObj<GroupComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <rec-group>
        <rec-button variant="solid">Primary</rec-button>
        <rec-button variant="outline">Secondary</rec-button>
        <rec-text>Text element within Group</rec-text>
      </rec-group>
    `,
  }),
};

export const StaticGapSmall: Story = {
  render: () => ({
    template: `
      <rec-group gap="rec-sm">
        <rec-button variant="solid">Item 1</rec-button>
        <rec-button variant="solid">Item 2</rec-button>
        <rec-button variant="solid">Item 3</rec-button>
      </rec-group>
    `,
  }),
};

export const StaticGapLarge: Story = {
  render: () => ({
    template: `
      <rec-group gap="rec-xl">
        <rec-button variant="solid">Item 1</rec-button>
        <rec-button variant="solid">Item 2</rec-button>
        <rec-button variant="solid">Item 3</rec-button>
      </rec-group>
    `,
  }),
};
