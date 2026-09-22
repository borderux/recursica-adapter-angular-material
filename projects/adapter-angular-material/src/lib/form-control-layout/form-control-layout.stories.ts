import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { FormControlLayoutComponent } from "./form-control-layout.component";
import { LabelComponent } from "../label/label.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention.
 */
const meta: Meta<FormControlLayoutComponent> = {
  title: "UI-Kit/FormControlLayout",
  component: FormControlLayoutComponent,
  decorators: [
    moduleMetadata({ imports: [FormControlLayoutComponent, LabelComponent] }),
  ],
  argTypes: {
    formLayout: { control: "radio", options: ["stacked", "side-by-side"] },
    labelSize: { control: "radio", options: ["default", "small"] },
  },
  args: {
    formLayout: "stacked",
    labelSize: "default",
  },
};
export default meta;

type Story = StoryObj<FormControlLayoutComponent>;

const template = `
  <ng-template #left><rec-label>Email address</rec-label></ng-template>
  <rec-form-control-layout [formLayout]="formLayout" [labelSize]="labelSize" [leftSection]="left">
    <input type="email" placeholder="you@example.com" style="width: 100%; box-sizing: border-box;" />
  </rec-form-control-layout>
`;

export const Stacked: Story = {
  render: (args) => ({ props: args, template }),
};

export const SideBySide: Story = {
  args: { formLayout: "side-by-side" },
  render: (args) => ({ props: args, template }),
};

export const SideBySideSmall: Story = {
  args: { formLayout: "side-by-side", labelSize: "small" },
  render: (args) => ({ props: args, template }),
};

/** No `leftSection` — useful for aligning a standalone control (e.g. a `Switch`/`Checkbox`) to match other fields' spacing. */
export const NoLabel: Story = {
  render: (args) => ({
    props: args,
    template: `
      <rec-form-control-layout [formLayout]="formLayout" [labelSize]="labelSize">
        <input type="email" placeholder="you@example.com" style="width: 100%; box-sizing: border-box;" />
      </rec-form-control-layout>
    `,
  }),
};

/**
 * `overStyled` escape hatch: `overClass`/`overStyle` are only forwarded
 * onto this component's own root `<div>` when `overStyled` is `true` —
 * see `docs/STYLING_SYSTEM.md` §6.
 */
export const OverStyledEscapeHatch: Story = {
  args: {
    overStyled: true,
    overStyle: { "background-color": "#2962ff33", padding: "8px" },
  },
  render: (args) => ({
    props: args,
    template: `
      <ng-template #left><rec-label>Email address</rec-label></ng-template>
      <rec-form-control-layout
        [formLayout]="formLayout"
        [leftSection]="left"
        [overStyled]="overStyled"
        [overStyle]="overStyle"
      >
        <input type="email" placeholder="you@example.com" style="width: 100%; box-sizing: border-box;" />
      </rec-form-control-layout>
    `,
  }),
};
