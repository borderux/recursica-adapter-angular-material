import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { RadioGroupComponent } from "./radio-group.component";
import { RadioComponent } from "./radio.component";
import { StackComponent } from "../stack/stack.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * variants in the React reference's own `RadioGroup.stories.tsx` /
 * `test/golden/ui-kit-radiogroup--*.png`.
 */
const meta: Meta<RadioGroupComponent> = {
  title: "UI-Kit/RadioGroup",
  component: RadioGroupComponent,
  decorators: [
    moduleMetadata({
      imports: [RadioGroupComponent, RadioComponent, StackComponent],
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

type Story = StoryObj<RadioGroupComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <rec-radio-group formLayout="stacked" label="Standard Group" [value]="value" (valueChange)="value = $event">
        <rec-radio value="1" label="Option 1"></rec-radio>
        <rec-radio value="2" label="Option 2"></rec-radio>
      </rec-radio-group>
    `,
    props: { value: "" as string },
  }),
};

export const StackedLayout: Story = {
  render: () => ({
    template: `
      <rec-radio-group formLayout="stacked" [required]="true" label="Hosting Provider" error="You must select a deployment provider." [value]="value" (valueChange)="value = $event">
        <rec-radio value="aws" label="Amazon Web Services"></rec-radio>
        <rec-radio value="gcp" label="Google Cloud Platform (with completely distributed edge computing environments bridging local runtime boundaries seamlessly.)"></rec-radio>
        <rec-radio value="azure" label="Microsoft Azure"></rec-radio>
      </rec-radio-group>
    `,
    props: { value: "aws" as string },
  }),
};

export const SideBySideLayout: Story = {
  render: () => ({
    template: `
      <rec-radio-group
        formLayout="side-by-side"
        labelOptionalText="Recommended"
        [labelWithEditIcon]="true"
        label="Deployment Region"
        assistiveText="Select the data center closest to your user base."
        [value]="value"
        (valueChange)="value = $event"
      >
        <rec-radio value="us-east" label="US East (N. Virginia)"></rec-radio>
        <rec-radio value="us-west" label="US West (Oregon)"></rec-radio>
        <rec-radio value="eu-central" label="EU Central (Frankfurt)"></rec-radio>
      </rec-radio-group>
    `,
    props: { value: "us-east" as string },
  }),
};

export const ReadOnly: Story = {
  render: () => ({
    template: `
      <rec-radio-group
        [readOnly]="true"
        formLayout="stacked"
        [required]="true"
        label="Selected Framework"
        assistiveText="This selection cannot be changed after initialization."
        [value]="value"
        (valueChange)="value = $event"
      >
        <rec-radio value="react" label="React"></rec-radio>
        <rec-radio value="vue" label="Vue"></rec-radio>
      </rec-radio-group>
    `,
    props: { value: "react" as string },
  }),
};

// Verification-only story (not part of the golden regression set) — a real,
// fully-wired multi-radio group so exclusive selection across multiple
// items (and native arrow-key navigation between siblings) can be
// exercised with real Playwright interaction. See
// IMPLEMENTATION_NOTES.md's Verification section.
export const InteractiveExclusiveSelect: Story = {
  render: () => ({
    template: `
      <rec-stack>
        <rec-radio-group formLayout="stacked" label="Pick one" [value]="value" (valueChange)="value = $event">
          <rec-radio value="a" label="Option A"></rec-radio>
          <rec-radio value="b" label="Option B"></rec-radio>
          <rec-radio value="c" label="Option C"></rec-radio>
        </rec-radio-group>
        <p data-testid="selected-value">{{ value }}</p>
      </rec-stack>
    `,
    props: { value: "" as string },
  }),
};

// Verification-only story — two disabled radios (one preselected) inside an
// otherwise-active group, confirming disabled members can't be selected by
// click even while sitting next to selectable siblings.
export const InteractiveDisabledMember: Story = {
  render: () => ({
    template: `
      <rec-stack>
        <rec-radio-group formLayout="stacked" label="Pick an available option" [value]="value" (valueChange)="value = $event">
          <rec-radio value="a" label="Option A"></rec-radio>
          <rec-radio value="b" label="Option B (disabled)" [disabled]="true"></rec-radio>
        </rec-radio-group>
        <p data-testid="selected-value">{{ value }}</p>
      </rec-stack>
    `,
    props: { value: "a" as string },
  }),
};

/**
 * `ControlValueAccessor` regression coverage (`docs/COMPONENT_DEV_GUIDE.md`'s
 * "Forms integration" section) — `[formControl]` bound directly onto
 * `<rec-radio-group>`, not just `[value]`/`(valueChange)`.
 */
export const ReactiveForms: Story = {
  decorators: [moduleMetadata({ imports: [ReactiveFormsModule] })],
  render: () => ({
    props: { ctrl: new FormControl("b") },
    template: `
      <rec-stack>
        <rec-radio-group formLayout="stacked" label="Reactive Forms RadioGroup" [formControl]="ctrl">
          <rec-radio value="a" label="Option A"></rec-radio>
          <rec-radio value="b" label="Option B"></rec-radio>
        </rec-radio-group>
      </rec-stack>
    `,
  }),
};
