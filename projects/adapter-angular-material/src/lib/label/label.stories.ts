import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { LabelComponent } from "./label.component";
import { ButtonComponent } from "../button/button.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention.
 */
const meta: Meta<LabelComponent> = {
  title: "UI-Kit/Label",
  component: LabelComponent,
  decorators: [
    moduleMetadata({
      imports: [LabelComponent, ButtonComponent],
    }),
  ],
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
    template: `<rec-label [labelSize]="labelSize" [labelAlignment]="labelAlignment">Label</rec-label>`,
  }),
};

export const Required: Story = {
  args: { required: true },
  render: (args) => ({
    props: args,
    template: `<rec-label [required]="required">Required Field</rec-label>`,
  }),
};

export const RequiredSuppressesOptionalText: Story = {
  args: { required: true, labelOptionalText: "This should not render" },
  render: (args) => ({
    props: args,
    template: `<rec-label [required]="required" [labelOptionalText]="labelOptionalText">Full Name</rec-label>`,
  }),
};

export const BooleanOptionalText: Story = {
  render: (args) => ({
    props: args,
    template: `<rec-label [labelOptionalText]="true">Middle Initial</rec-label>`,
  }),
};

/**
 * `labelOptionalText` also accepts a custom string, not just `true` for the
 * default "(optional)" text — see `BooleanOptionalText` for the boolean form.
 */
export const WithOptionalText: Story = {
  args: { labelOptionalText: "Max 100 characters" },
  render: (args) => ({
    props: args,
    template: `<rec-label [labelOptionalText]="labelOptionalText">Bio</rec-label>`,
  }),
};

export const WithEditIcon: Story = {
  args: { labelWithEditIcon: true },
  render: (args) => ({
    props: args,
    template: `<rec-label [labelWithEditIcon]="labelWithEditIcon">Shipping Address</rec-label>`,
  }),
};

export const RequiredWithEditIcon: Story = {
  args: { required: true, labelWithEditIcon: true },
  render: (args) => ({
    props: args,
    template: `<rec-label [required]="required" [labelWithEditIcon]="labelWithEditIcon">Primary Network Node</rec-label>`,
  }),
};

export const RightAligned: Story = {
  args: { labelAlignment: "right" },
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 224px;">
        <rec-label [labelAlignment]="labelAlignment">Status</rec-label>
      </div>
    `,
  }),
};

/**
 * `labelActionArea`: `TemplateRef`, not a plain `@Input()` value — bound via
 * a local `<ng-template #actionAreaTpl>` reference, same pattern as
 * `Tabs.stories.ts`'s `leftSection`. Takes precedence over `labelWithEditIcon`.
 */
export const WithActionArea: Story = {
  render: (args) => ({
    props: args,
    template: `
      <rec-label [labelActionArea]="actionAreaTpl">Configuration</rec-label>
      <ng-template #actionAreaTpl>
        <rec-button variant="text" size="small">Edit</rec-button>
      </ng-template>
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
