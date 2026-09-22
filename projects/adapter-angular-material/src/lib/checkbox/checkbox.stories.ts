import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { CheckboxComponent } from "./checkbox.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * variants in the React reference's own `Checkbox.stories.tsx` /
 * `test/golden/ui-kit-checkbox--*.png`.
 */
const meta: Meta<CheckboxComponent> = {
  title: "UI-Kit/Checkbox",
  component: CheckboxComponent,
  decorators: [
    moduleMetadata({
      imports: [CheckboxComponent],
    }),
  ],
  argTypes: {
    disabled: { control: "boolean" },
    readOnly: {
      control: "boolean",
      description:
        "Simplified read-only approximation — see IMPLEMENTATION_NOTES.md's ReadOnlyField gap note.",
    },
    controlMaxWidth: { table: { disable: true } },
    controlMinWidth: { table: { disable: true } },
  },
};
export default meta;

type Story = StoryObj<CheckboxComponent>;

export const Default: Story = {
  args: {
    disabled: false,
    label: "Standard Unchecked Property",
  },
  render: (args) => ({
    props: args,
    template: `<rec-checkbox [label]="label" [disabled]="disabled" (checkedChange)="$event"></rec-checkbox>`,
  }),
};

export const SideBySideLayout: Story = {
  render: () => ({
    template: `<rec-checkbox label="Opt-in form alignment" formLayout="side-by-side" (checkedChange)="$event"></rec-checkbox>`,
  }),
};

export const LongLabelWrap: Story = {
  render: () => ({
    template: `<rec-checkbox label="A meticulously long Checkbox label property demonstrating the absolute maximum 400px wrapper constraints actively snapping the text engine down onto a secondary wrapping line automatically without blowing out the visual boundaries." (checkedChange)="$event"></rec-checkbox>`,
  }),
};

export const StaticVariations: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 24px;">
        <rec-checkbox label="Default Unchecked State" (checkedChange)="$event"></rec-checkbox>
        <rec-checkbox label="Acknowledge Configuration" [defaultChecked]="true" (checkedChange)="$event"></rec-checkbox>
        <rec-checkbox label="Indeterminate Master" [indeterminate]="true" (checkedChange)="$event"></rec-checkbox>
        <rec-checkbox label="Disabled Variant" [disabled]="true"></rec-checkbox>
        <rec-checkbox label="Disabled Checked Variant" [checked]="true" [disabled]="true"></rec-checkbox>
      </div>
    `,
  }),
};

export const ReadOnly: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 24px;">
        <rec-checkbox label="Accept Terms &amp; Conditions" [defaultChecked]="true" [readOnly]="true"></rec-checkbox>
      </div>
    `,
  }),
};

// Verification-only story (not part of the golden regression set) — a real,
// fully-wired uncontrolled toggle so real click/keyboard behavior can be
// exercised with a real Playwright interaction. See IMPLEMENTATION_NOTES.md's
// Verification section.
export const InteractiveToggle: Story = {
  render: () => ({
    template: `<rec-checkbox [label]="checked ? 'Checked' : 'Click or press Space to check'" [defaultChecked]="false" (checkedChange)="checked = $event"></rec-checkbox>`,
    props: { checked: false },
  }),
};
