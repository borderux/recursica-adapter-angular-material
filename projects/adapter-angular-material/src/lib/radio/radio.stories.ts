import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { RadioComponent } from "./radio.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * variants in the React reference's own `Radio.stories.tsx` /
 * `test/golden/ui-kit-radio--*.png`.
 */
const meta: Meta<RadioComponent> = {
  title: "UI-Kit/Radio",
  component: RadioComponent,
  decorators: [
    moduleMetadata({
      imports: [RadioComponent],
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

type Story = StoryObj<RadioComponent>;

export const Default: Story = {
  args: {
    disabled: false,
    label: "Standard Radio Primitive",
  },
  render: (args) => ({
    props: args,
    template: `<rec-radio [label]="label" [disabled]="disabled" (checkedChange)="$event"></rec-radio>`,
  }),
};

export const SideBySideLayout: Story = {
  render: () => ({
    template: `<rec-radio label="Opt-in form alignment" formLayout="side-by-side" (checkedChange)="$event"></rec-radio>`,
  }),
};

export const CheckedState: Story = {
  render: () => ({
    template: `<rec-radio label="Standard Radio Primitive" [defaultChecked]="true" (checkedChange)="$event"></rec-radio>`,
  }),
};

export const DisabledUnchecked: Story = {
  render: () => ({
    template: `<rec-radio label="Standard Radio Primitive" [disabled]="true"></rec-radio>`,
  }),
};

export const DisabledChecked: Story = {
  render: () => ({
    template: `<rec-radio label="Standard Radio Primitive" [disabled]="true" [defaultChecked]="true"></rec-radio>`,
  }),
};

export const ReadOnly: Story = {
  render: () => ({
    template: `<rec-radio label="Account Type" [defaultChecked]="true" [readOnly]="true"></rec-radio>`,
  }),
};

// Verification-only story (not part of the golden regression set) — a real,
// standalone radio pair sharing no group, so click/keyboard behavior can be
// exercised with a real Playwright interaction against an ordinary
// uncontrolled input. See IMPLEMENTATION_NOTES.md's Verification section.
export const InteractiveToggle: Story = {
  render: () => ({
    template: `<rec-radio [label]="checked ? 'Selected' : 'Click or press Space to select'" [defaultChecked]="false" (checkedChange)="checked = $event"></rec-radio>`,
    props: { checked: false },
  }),
};

export const Accessibility: Story = {
  render: () => ({
    template: `
      <rec-radio label="Accessible" aria-label="A11Y-LABEL" aria-describedby="a11y-desc" id="a11y-id"></rec-radio>
    `,
  }),
};

/** `description` + `error` (string and TemplateRef); error also sets `aria-invalid`. */
export const WithDescriptionAndError: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 24px">
        <rec-radio label="With description" description="Helper text under the label."></rec-radio>
        <rec-radio label="With error" error="This field is required."></rec-radio>
        <rec-radio label="With both" description="Helper text." error="Something is wrong."></rec-radio>
        <ng-template #tpl><strong>Rich</strong> description</ng-template>
        <rec-radio label="Rich template" [description]="tpl"></rec-radio>
      </div>
    `,
  }),
};
