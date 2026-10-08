import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { TooltipComponent } from "./tooltip.component";
import { ButtonComponent } from "../button/button.component";
import { GroupComponent } from "../group/group.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Every story runs
 * inside the global `ThemeProviderComponent`/layer-0 decorator
 * (`.storybook/preview.ts`), so `data-recursica-theme` is real for every
 * story — load-bearing here, since `tooltip-overlay.css`'s token rules are
 * gated on it (see tooltip.component.ts's class doc comment).
 */
const meta: Meta<TooltipComponent> = {
  title: "UI-Kit/Tooltip",
  // Matches the reference story's Storybook layout.
  parameters: { layout: "centered" },
  component: TooltipComponent,
  decorators: [
    moduleMetadata({
      imports: [TooltipComponent, ButtonComponent, GroupComponent],
    }),
  ],
  argTypes: {
    position: { control: "radio", options: ["top", "bottom", "left", "right"] },
    disabled: { control: "boolean" },
    withBeak: { control: "boolean" },
    openDelay: { control: "number" },
    closeDelay: { control: "number" },
    overStyled: { control: "boolean" },
    overClass: { control: "text" },
  },
  args: {
    label: "This is a helpful tooltip",
    position: "top",
    disabled: false,
    withBeak: true,
  },
};
export default meta;

type Story = StoryObj<TooltipComponent>;

const template = `
  <rec-group justify="center" wrap="nowrap" style="padding: 64px;">
    <rec-tooltip
      [label]="label"
      [position]="position"
      [disabled]="disabled"
      [withBeak]="withBeak"
    >
      <rec-button variant="solid">Hover me</rec-button>
    </rec-tooltip>
  </rec-group>
`;

export const Default: Story = {
  render: (args) => ({ props: args, template }),
};

export const WithoutBeak: Story = {
  args: {
    label: "Tooltip without a beak indicator",
    withBeak: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <rec-group justify="center" wrap="nowrap" style="padding: 64px;">
        <rec-tooltip
          [label]="label"
          [position]="position"
          [disabled]="disabled"
          [withBeak]="withBeak"
        >
          <rec-button variant="outline">Without Beak</rec-button>
        </rec-tooltip>
      </rec-group>
    `,
  }),
};

/**
 * Rendered open by default (`[opened]="true"`) so the wrapped-text layout is
 * screenshot-testable without simulating a real hover — mirrors the
 * reference's own `LongContent` story, which uses the same `opened` escape
 * hatch for the same reason.
 */
export const LongContent: Story = {
  args: {
    label:
      "This is a longer tooltip message that demonstrates how text wraps within the maximum width defined by the design system.",
  },
  render: (args) => ({
    props: args,
    template: `
      <rec-group justify="center" wrap="nowrap" style="padding: 64px;">
        <rec-tooltip
          [label]="label"
          [position]="position"
          [withBeak]="withBeak"
          [opened]="true"
        >
          <rec-button variant="solid">Long Content</rec-button>
        </rec-tooltip>
      </rec-group>
    `,
  }),
};

/** Uses the `openDelay`/`closeDelay` inputs (`showDelay`/`hideDelay` are deprecated aliases). Tab to the button to open it by keyboard. */
export const WithDelays: Story = {
  render: (args) => ({
    props: args,
    template: `
      <rec-group justify="center" wrap="nowrap" style="padding: 64px;">
        <rec-tooltip
          label="Opens after 500ms, closes after 300ms"
          [position]="position"
          [openDelay]="500"
          [closeDelay]="300"
        >
          <rec-button variant="solid">Hover or focus me</rec-button>
        </rec-tooltip>
      </rec-group>
    `,
  }),
};
