import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { SwitchGroupComponent } from "./switch-group.component";
import { SwitchComponent } from "./switch.component";
import { StackComponent } from "../stack/stack.component";
import { TextComponent } from "../text/text.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * variants in the React reference's own `SwitchGroup.stories.tsx` /
 * `test/golden/ui-kit-switchgroup--*.png`.
 */
const meta: Meta<SwitchGroupComponent> = {
  title: "UI-Kit/SwitchGroup",
  component: SwitchGroupComponent,
  decorators: [
    moduleMetadata({
      imports: [
        SwitchGroupComponent,
        SwitchComponent,
        StackComponent,
        TextComponent,
      ],
    }),
  ],
  argTypes: {
    readOnly: {
      control: "boolean",
      description:
        "Simplified read-only approximation — see IMPLEMENTATION_NOTES.md's ReadOnlyField gap note.",
    },
  },
};
export default meta;

type Story = StoryObj<SwitchGroupComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <rec-switch-group formLayout="stacked" label="Standard Group" [value]="value" (valueChange)="value = $event">
        <rec-switch value="1" label="Option 1"></rec-switch>
        <rec-switch value="2" label="Option 2"></rec-switch>
      </rec-switch-group>
    `,
    props: { value: [] as string[] },
  }),
};

export const StackedLayout: Story = {
  render: () => ({
    template: `
      <rec-switch-group
        formLayout="stacked"
        [required]="true"
        label="Notification Settings"
        description="Manage your preferences."
        assistiveText="We recommend turning these on."
        [value]="value"
        (valueChange)="value = $event"
      >
        <rec-switch value="email" label="Email Alerts"></rec-switch>
        <rec-switch value="push" label="Push Notifications"></rec-switch>
        <rec-switch value="sms" label="SMS Messages"></rec-switch>
      </rec-switch-group>
    `,
    props: { value: ["email"] as string[] },
  }),
};

export const SideBySideLayout: Story = {
  render: () => ({
    template: `
      <rec-switch-group
        formLayout="side-by-side"
        labelSize="default"
        labelAlignment="left"
        [required]="true"
        label="Notification Settings"
        description="Manage your preferences."
        assistiveText="We recommend turning these on."
        [value]="value"
        (valueChange)="value = $event"
      >
        <rec-switch value="weekly" label="Weekly Digest"></rec-switch>
        <rec-switch value="marketing" label="Marketing Emails"></rec-switch>
      </rec-switch-group>
    `,
    props: { value: [] as string[] },
  }),
};

export const SolitaryFormControl: Story = {
  render: () => ({
    template: `
      <rec-switch-group
        formLayout="side-by-side"
        label="Enable Backups"
        description="Automatically back up your data nightly."
        [value]="value"
        (valueChange)="value = $event"
      >
        <rec-switch value="auto" label="Auto-backup"></rec-switch>
      </rec-switch-group>
    `,
    props: { value: ["auto"] as string[] },
  }),
};

export const ReadOnly: Story = {
  render: () => ({
    template: `
      <rec-switch-group
        [readOnly]="true"
        formLayout="stacked"
        [required]="true"
        label="Notification Settings"
        description="Manage your preferences."
        assistiveText="We recommend turning these on."
        [value]="value"
        (valueChange)="value = $event"
      >
        <rec-switch value="email" label="Email Alerts"></rec-switch>
        <rec-switch value="push" label="Push Notifications"></rec-switch>
        <rec-switch value="sms" label="SMS Messages"></rec-switch>
      </rec-switch-group>
    `,
    props: { value: ["email", "sms"] as string[] },
  }),
};

// Verification-only story (not part of the golden regression set) — a real,
// fully-wired multi-switch group so the array `value` updating across
// clicks on multiple switches can be exercised with real Playwright
// interaction. See IMPLEMENTATION_NOTES.md's Verification section.
export const InteractiveMultiSelect: Story = {
  render: () => ({
    template: `
      <rec-stack>
        <rec-switch-group formLayout="stacked" label="Pick any" [value]="value" (valueChange)="value = $event">
          <rec-switch value="a" label="Option A"></rec-switch>
          <rec-switch value="b" label="Option B"></rec-switch>
          <rec-switch value="c" label="Option C"></rec-switch>
        </rec-switch-group>
        <rec-text data-testid="selected-value">{{ value.join(',') }}</rec-text>
      </rec-stack>
    `,
    props: { value: [] as string[] },
  }),
};
