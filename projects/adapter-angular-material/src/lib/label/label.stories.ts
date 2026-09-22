import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { LabelComponent } from "./label.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention.
 */
const meta: Meta<LabelComponent> = {
  title: "UI-Kit/Label",
  component: LabelComponent,
  decorators: [moduleMetadata({ imports: [LabelComponent] })],
  argTypes: {
    labelSize: { control: "radio", options: ["default", "small"] },
    labelAlignment: { control: "radio", options: ["left", "right"] },
    required: { control: "boolean" },
    labelWithEditIcon: { control: "boolean" },
  },
  args: {
    labelSize: "default",
    labelAlignment: "left",
    required: false,
    labelWithEditIcon: false,
  },
};
export default meta;

type Story = StoryObj<LabelComponent>;

export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `<rec-label [labelSize]="labelSize" [labelAlignment]="labelAlignment">Email address</rec-label>`,
  }),
};

export const Required: Story = {
  args: { required: true },
  render: (args) => ({
    props: args,
    template: `<rec-label [required]="required">Email address</rec-label>`,
  }),
};

export const Optional: Story = {
  render: (args) => ({
    props: args,
    template: `<rec-label [labelOptionalText]="true">Email address</rec-label>`,
  }),
};

export const WithEditIcon: Story = {
  args: { labelWithEditIcon: true },
  render: (args) => ({
    props: args,
    template: `<rec-label [labelWithEditIcon]="labelWithEditIcon">Email address</rec-label>`,
  }),
};

export const RightAligned: Story = {
  args: { labelAlignment: "right" },
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 224px;">
        <rec-label [labelAlignment]="labelAlignment">Email address</rec-label>
      </div>
    `,
  }),
};

/**
 * `overStyled` escape hatch: `overClass`/`overStyle` are only forwarded
 * onto this component's own root `<label>` when `overStyled` is `true` —
 * see `docs/STYLING_SYSTEM.md` §6.
 */
export const OverStyledEscapeHatch: Story = {
  args: {
    overStyled: true,
    overStyle: { color: "#2962ff" },
  },
  render: (args) => ({
    props: args,
    template: `<rec-label [overStyled]="overStyled" [overStyle]="overStyle">Over-styled label</rec-label>`,
  }),
};
