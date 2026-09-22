import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { ReadOnlyFieldComponent } from "./read-only-field.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * genesis adapter's `ReadOnlyField.stories.tsx` variants (golden screenshots
 * at `recursica-adapter-mantine-v8/test/golden/ui-kit-readonlyfield--*.png`).
 */
const meta: Meta<ReadOnlyFieldComponent> = {
  title: "UI-Kit/ReadOnlyField",
  component: ReadOnlyFieldComponent,
  decorators: [moduleMetadata({ imports: [ReadOnlyFieldComponent] })],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "number", "date", "boolean", "switch"],
    },
    formLayout: { control: "radio", options: ["stacked", "side-by-side"] },
    labelWithEditIcon: { control: "boolean" },
  },
  args: {
    label: "Read Only Label",
    value: "Fixed Data Set Value",
    assistiveText: "Helper description text beneath the node.",
    type: "text",
    formLayout: "stacked",
  },
};
export default meta;

type Story = StoryObj<ReadOnlyFieldComponent>;

const template = `
  <rec-read-only-field
    [label]="label"
    [value]="value"
    [assistiveText]="assistiveText"
    [type]="type"
    [formLayout]="formLayout"
    [labelWithEditIcon]="labelWithEditIcon"
    [required]="required"
    [emptyText]="emptyText"
  ></rec-read-only-field>
`;

/** Golden: `ui-kit-readonlyfield--default.png`. */
export const Default: Story = {
  render: (args) => ({ props: args, template }),
};

/**
 * Empty string hits the default `EmptyValueRenderer`-equivalent check
 * (`defaultReadOnlyEmptyCheck`) and renders the default `"N/A"` fallback.
 * Golden: `ui-kit-readonlyfield--empty-value.png`.
 */
export const EmptyValue: Story = {
  args: {
    value: "",
    label: "Empty String Evaluated Automatically (Default 'N/A')",
  },
  render: (args) => ({ props: args, template }),
};

/**
 * `emptyText` overrides just the fallback string — Angular's translation of
 * the reference's `emptyValueComponent`-wrapping-`EmptyValueRenderer`
 * pattern (no Angular equivalent for passing an arbitrary polymorphic
 * component type as a prop; a plain string input covers the common case).
 * Golden: `ui-kit-readonlyfield--custom-empty-text.png`.
 */
export const CustomEmptyText: Story = {
  args: {
    value: null,
    label: "Custom Empty Text Default",
    emptyText: "No Data Found",
  },
  render: (args) => ({ props: args, template }),
};

/**
 * Full override: `emptyValueCheck` replaces which values count as "empty"
 * (`val === "EMPTY_MOCK"`, matching the reference's `CustomEmptyCheckRenderer.check`)
 * and `emptyValueTemplate` replaces the fallback markup entirely (an
 * `<ng-template>`, since Angular has no equivalent for handing over an
 * un-instantiated arbitrary component type the way `emptyValueComponent`
 * does in React). Golden: `ui-kit-readonlyfield--custom-empty-renderer.png`.
 */
export const CustomEmptyRenderer: Story = {
  args: {
    value: "EMPTY_MOCK",
    label: "Custom Logic Evaluation Binding",
    assistiveText: "Helper description text beneath the node.",
  },
  render: (args) => ({
    // `emptyValueCheck` is created here, inside `render()`, rather than in
    // `args` — Storybook's manager/preview iframes communicate over a
    // postMessage channel that cannot carry live function references
    // through `args` (confirmed live: a function placed in `args` arrives
    // in the preview iframe as `undefined`, even though non-function args
    // on the same story bind correctly). Functions assigned directly here
    // stay real, in-iframe references.
    props: {
      ...args,
      emptyValueCheck: (value: unknown) => value === "EMPTY_MOCK",
    },
    template: `
      <ng-template #emptyTpl><i>Custom HTML Markup Provided</i></ng-template>
      <rec-read-only-field
        [label]="label"
        [value]="value"
        [assistiveText]="assistiveText"
        [emptyValueCheck]="emptyValueCheck"
        [emptyValueTemplate]="emptyTpl"
      ></rec-read-only-field>
    `,
  }),
};

/** Golden: `ui-kit-readonlyfield--stacked-default.png`. */
export const StackedDefault: Story = {
  args: {
    formLayout: "stacked",
    value: "Some fixed readable text",
  },
  render: (args) => ({ props: args, template }),
};

/** Golden: `ui-kit-readonlyfield--side-by-side.png`. */
export const SideBySide: Story = {
  args: {
    formLayout: "side-by-side",
    value: "Some fixed readable text mapping horizontally",
  },
  render: (args) => ({ props: args, template }),
};

/**
 * `labelWithEditIcon` (an already-implemented, real `Label` feature, not a
 * stub here either — see `label/label.component.ts`) is the affordance a
 * consuming app would use to let a user switch a field out of read-only
 * mode; `ReadOnlyField` itself has no opinion on what that click does
 * (`(labelEditClick)` is forwarded straight through to the caller, same as
 * `FormControlWrapper`'s own output). Golden:
 * `ui-kit-readonlyfield--with-edit-icon.png`.
 */
export const WithEditIcon: Story = {
  args: {
    labelWithEditIcon: true,
    required: true,
    value: "Editable fixed structure",
  },
  render: (args) => ({ props: args, template }),
};

/**
 * `type` only changes rendering for `"boolean"`/`"switch"` — `"number"`/
 * `"date"` render whatever pre-formatted string the caller passes,
 * identical to `"text"`. Golden: `ui-kit-readonlyfield--data-types.png`.
 */
export const DataTypes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 24px;">
        <rec-read-only-field label="Text Mapping" type="text" value="Standard string output"></rec-read-only-field>
        <rec-read-only-field label="Number Mapping" type="number" [value]="1234567.89"></rec-read-only-field>
        <rec-read-only-field label="Date Mapping" type="date" value="4/28/2026"></rec-read-only-field>
        <rec-read-only-field label="Boolean Mapping (True)" type="boolean" [value]="true"></rec-read-only-field>
        <rec-read-only-field label="Boolean Mapping (False)" type="boolean" [value]="false"></rec-read-only-field>
        <rec-read-only-field label="Switch Mapping (True -> On)" type="switch" [value]="true"></rec-read-only-field>
        <rec-read-only-field label="Switch Mapping (False -> Off)" type="switch" [value]="false"></rec-read-only-field>
      </div>
    `,
  }),
};
