import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { FormControlLayoutComponent } from "./form-control-layout.component";
import { LabelComponent } from "../label/label.component";
import { SwitchComponent } from "../switch/switch.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention.
 */
const meta: Meta<FormControlLayoutComponent> = {
  title: "UI-Kit/FormControlLayout",
  component: FormControlLayoutComponent,
  decorators: [
    moduleMetadata({
      imports: [FormControlLayoutComponent, LabelComponent, SwitchComponent],
    }),
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

/**
 * Mirrors the source-of-truth's own `Default` story: a standalone primitive
 * (`Switch`, no label of its own) wrapped by a generic, non-`Label`
 * `leftSection` — the raw dashed-border placeholder div is the reference's
 * own literal story content (demonstrating that `leftSection` accepts any
 * renderable node, not just `Label`), not layout chrome, so it's kept as a
 * plain `<div>` rather than translated per the usual overstyling playbook.
 */
export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ng-template #left>
        <div style="padding: 8px; border: 1px dashed #ccc; background: #fafafa;">
          Left Section Boundary
        </div>
      </ng-template>
      <rec-form-control-layout [formLayout]="formLayout" [labelSize]="labelSize" [leftSection]="left">
        <rec-switch label="Input area content"></rec-switch>
      </rec-form-control-layout>
    `,
  }),
};

const withLabelTemplate = `
  <ng-template #left><rec-label [labelSize]="labelSize">A fairly long label to show the stacked-layout width cap in action</rec-label></ng-template>
  <rec-form-control-layout [formLayout]="formLayout" [labelSize]="labelSize" [leftSection]="left">
    <rec-switch label="Input area content"></rec-switch>
  </rec-form-control-layout>
`;

/**
 * A real Label (not a placeholder) in a stacked layout, at `labelSize="default"`. Mirrors
 * the genesis adapter's own `StackedLayoutWithLabelDefault` story.
 */
export const StackedLayoutWithLabelDefault: Story = {
  render: (args) => ({ props: args, template: withLabelTemplate }),
};

/** Same as above, at `labelSize="small"` — mirrors `StackedLayoutWithLabelSmall`. */
export const StackedLayoutWithLabelSmall: Story = {
  args: { labelSize: "small" },
  render: (args) => ({ props: args, template: withLabelTemplate }),
};

/**
 * Demonstrates the side-by-side layout without a left section — mirrors
 * `SideBySideLayout`.
 */
export const SideBySideLayout: Story = {
  args: { formLayout: "side-by-side" },
  render: (args) => ({
    props: args,
    template: `
      <rec-form-control-layout [formLayout]="formLayout" [labelSize]="labelSize">
        <rec-switch label="Input area content"></rec-switch>
      </rec-form-control-layout>
    `,
  }),
};

/** No `leftSection` — useful for aligning a standalone control (e.g. a `Switch`/`Checkbox`) to match other fields' spacing. Mirrors `StackedLayout`. */
export const StackedLayout: Story = {
  render: (args) => ({
    props: args,
    template: `
      <rec-form-control-layout [formLayout]="formLayout" [labelSize]="labelSize">
        <rec-switch label="Input area content"></rec-switch>
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
        <rec-switch label="Input area content"></rec-switch>
      </rec-form-control-layout>
    `,
  }),
};
