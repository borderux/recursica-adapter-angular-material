import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { SwitchComponent } from "./switch.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * variants in the React reference's own `Switch.stories.tsx` /
 * `test/golden/ui-kit-switch--*.png`, minus `CustomReadOnly` (the
 * `readOnlyComponent` render-prop override isn't implemented here — see
 * `switch.component.ts`'s class doc comment and IMPLEMENTATION_NOTES.md's
 * "Known gap" section).
 */
const meta: Meta<SwitchComponent> = {
  title: "UI-Kit/Switch",
  component: SwitchComponent,
  decorators: [
    moduleMetadata({
      imports: [SwitchComponent],
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

type Story = StoryObj<SwitchComponent>;

export const Default: Story = {
  args: {
    disabled: false,
    label: "Standard Switch",
  },
  render: (args) => ({
    props: args,
    template: `<rec-switch [label]="label" [disabled]="disabled" (checkedChange)="$event"></rec-switch>`,
  }),
};

export const SideBySideLayout: Story = {
  render: () => ({
    template: `<rec-switch label="Opt-in form alignment" formLayout="side-by-side" (checkedChange)="$event"></rec-switch>`,
  }),
};

export const StaticVariations: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 24px;">
        <rec-switch label="Default Unchecked State" (checkedChange)="$event"></rec-switch>
        <rec-switch label="Checked State" [defaultChecked]="true" (checkedChange)="$event"></rec-switch>
        <rec-switch label="Disabled Unchecked" [disabled]="true"></rec-switch>
        <rec-switch label="Disabled Checked" [defaultChecked]="true" [disabled]="true"></rec-switch>
      </div>
    `,
  }),
};

export const ReadOnly: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 24px;">
        <rec-switch label="Standard Switch" [defaultChecked]="true" [readOnly]="true"></rec-switch>
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
    template: `<rec-switch [label]="checked ? 'On' : 'Click or press Space to turn on'" [defaultChecked]="false" (checkedChange)="checked = $event"></rec-switch>`,
    props: { checked: false },
  }),
};
