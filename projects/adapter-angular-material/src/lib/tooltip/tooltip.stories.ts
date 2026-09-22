import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { TooltipComponent } from "./tooltip.component";
import { ButtonComponent } from "../button/button.component";

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
  component: TooltipComponent,
  decorators: [
    moduleMetadata({ imports: [TooltipComponent, ButtonComponent] }),
  ],
  argTypes: {
    position: { control: "radio", options: ["top", "bottom", "left", "right"] },
    disabled: { control: "boolean" },
    withBeak: { control: "boolean" },
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
  <div style="padding: 64px; display: flex; justify-content: center;">
    <rec-tooltip
      [label]="label"
      [position]="position"
      [disabled]="disabled"
      [withBeak]="withBeak"
    >
      <rec-button variant="solid">Hover me</rec-button>
    </rec-tooltip>
  </div>
`;

export const Default: Story = {
  render: (args) => ({ props: args, template }),
};

export const Bottom: Story = {
  args: { position: "bottom" },
  render: (args) => ({ props: args, template }),
};

export const Left: Story = {
  args: { position: "left" },
  render: (args) => ({ props: args, template }),
};

export const Right: Story = {
  args: { position: "right" },
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
      <div style="padding: 64px; display: flex; justify-content: center;">
        <rec-tooltip
          [label]="label"
          [position]="position"
          [disabled]="disabled"
          [withBeak]="withBeak"
        >
          <rec-button variant="outline">Without Beak</rec-button>
        </rec-tooltip>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => ({ props: args, template }),
};

/**
 * `overStyled` escape hatch: `overClass` is only forwarded onto the real
 * overlay panel (via `matTooltipClass`) when `overStyled` is `true` —
 * see tooltip.component.ts's class doc comment for why there's no
 * `overStyle` (inline style) counterpart for this component specifically.
 *
 * The override rule below is injected straight into `document.head` via
 * plain DOM APIs, not written as a `<style>` tag in this story's own
 * template — a `<style>` tag inside an Angular component template gets
 * scoped by `ViewEncapsulation.Emulated` just like any other template
 * content (confirmed live: Angular rewrites its selectors to append its own
 * `[_ngcontent-*]` attribute, which the overlay-rendered tooltip panel
 * never carries — see tooltip.component.ts's class doc comment for why),
 * so it silently never matched. This is demo-only plumbing for the story;
 * real consuming apps hit this the normal way, via their own already-global
 * stylesheet.
 */
if (
  typeof document !== "undefined" &&
  !document.getElementById("rec-tooltip-overstyled-demo-style")
) {
  const style = document.createElement("style");
  style.id = "rec-tooltip-overstyled-demo-style";
  style.textContent = `
    .rec-tooltip-overstyled-demo.mat-mdc-tooltip .mat-mdc-tooltip-surface {
      background-color: #2962ff !important;
      color: white !important;
    }
  `;
  document.head.appendChild(style);
}

export const OverStyledEscapeHatch: Story = {
  args: {
    overStyled: true,
    overClass: "rec-tooltip-overstyled-demo",
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="padding: 64px; display: flex; justify-content: center;">
        <rec-tooltip
          [label]="label"
          [overStyled]="overStyled"
          [overClass]="overClass"
        >
          <rec-button variant="solid">Hover me</rec-button>
        </rec-tooltip>
      </div>
    `,
  }),
};
