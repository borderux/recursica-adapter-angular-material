import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { BadgeComponent } from "./badge.component";
import { LayerComponent } from "../layer/layer.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * genesis adapter's own `Badge.stories.tsx` / `test/golden/ui-kit-badge--*.png`.
 */
const meta: Meta<BadgeComponent> = {
  title: "UI-Kit/Badge",
  component: BadgeComponent,
  decorators: [
    moduleMetadata({
      imports: [BadgeComponent, LayerComponent],
    }),
  ],
  argTypes: {
    variant: {
      control: "select",
      options: ["alert", "primary-color", "success", "warning"],
    },
  },
};
export default meta;

type Story = StoryObj<BadgeComponent>;

export const Default: Story = {
  render: () => ({
    template: `<rec-badge variant="primary-color">Badge Label</rec-badge>`,
  }),
};

export const StaticAlert: Story = {
  render: () => ({
    template: `<rec-badge variant="alert">Alert Badge</rec-badge>`,
  }),
};

export const StaticPrimary: Story = {
  render: () => ({
    template: `<rec-badge variant="primary-color">Primary Badge</rec-badge>`,
  }),
};

export const StaticSuccess: Story = {
  render: () => ({
    template: `<rec-badge variant="success">Success Badge</rec-badge>`,
  }),
};

export const StaticWarning: Story = {
  render: () => ({
    template: `<rec-badge variant="warning">Warning Badge</rec-badge>`,
  }),
};

export const LayerOneAlert: Story = {
  render: () => ({
    template: `
      <rec-layer [layer]="1" style="padding: 24px; display: block;">
        <rec-badge variant="alert">Layer 1 Alert</rec-badge>
      </rec-layer>
    `,
  }),
};
