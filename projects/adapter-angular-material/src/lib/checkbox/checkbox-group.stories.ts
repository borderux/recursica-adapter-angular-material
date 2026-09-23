import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { CheckboxGroupComponent } from "./checkbox-group.component";
import { CheckboxComponent } from "./checkbox.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * variants in the React reference's own `CheckboxGroup.stories.tsx` /
 * `test/golden/ui-kit-checkboxgroup--*.png`.
 */
const meta: Meta<CheckboxGroupComponent> = {
  title: "UI-Kit/CheckboxGroup",
  component: CheckboxGroupComponent,
  decorators: [
    moduleMetadata({
      imports: [CheckboxGroupComponent, CheckboxComponent],
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

type Story = StoryObj<CheckboxGroupComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <rec-checkbox-group formLayout="stacked" label="Standard Group" [value]="value" (valueChange)="value = $event">
        <rec-checkbox value="1" label="Option 1"></rec-checkbox>
        <rec-checkbox value="2" label="Option 2"></rec-checkbox>
      </rec-checkbox-group>
    `,
    props: { value: [] as string[] },
  }),
};

export const SideBySideLayout: Story = {
  render: () => ({
    template: `
      <rec-checkbox-group
        formLayout="side-by-side"
        labelOptionalText="Recommended"
        [labelWithEditIcon]="true"
        label="Frontend Frameworks"
        assistiveText="Select all libraries currently in use for this specific workspace configuration."
        [value]="value"
        (valueChange)="value = $event"
      >
        <rec-checkbox value="react" label="React (Standard Build)"></rec-checkbox>
        <rec-checkbox
          value="svelte"
          label="The Svelte architecture which provides a highly optimized, completely compiler-driven framework avoiding virtual DOM boundaries. This massively extended text explicitly guarantees accurate wrapper constraint checking and multi-line flex alignment."
        ></rec-checkbox>
        <rec-checkbox value="vue" label="Vue Configuration Map"></rec-checkbox>
      </rec-checkbox-group>
    `,
    props: { value: ["react"] as string[] },
  }),
};

export const StackedLayout: Story = {
  render: () => ({
    template: `
      <rec-checkbox-group
        formLayout="stacked"
        [required]="true"
        label="Execution Targets"
        error="You must select at least one deployment target to compile."
        [value]="value"
        (valueChange)="value = $event"
      >
        <rec-checkbox value="react" label="Browser Execution Context"></rec-checkbox>
        <rec-checkbox
          value="svelte"
          label="Highly distributed Edge computing environments seamlessly bridging local runtime boundaries."
        ></rec-checkbox>
        <rec-checkbox value="vue" label="Serverless Cloud Providers"></rec-checkbox>
      </rec-checkbox-group>
    `,
    props: { value: ["react"] as string[] },
  }),
};

export const ReadOnly: Story = {
  render: () => ({
    template: `
      <rec-checkbox-group
        [readOnly]="true"
        formLayout="stacked"
        [required]="true"
        label="Static ReadOnly Execution Locks"
        assistiveText="This structure explicitly validates native component-level DOM preservation natively mapping lock bounds safely over interaction."
        [value]="value"
        (valueChange)="value = $event"
      >
        <rec-checkbox value="disabledNode" label="Structurally Checked Node natively"></rec-checkbox>
        <rec-checkbox value="disabledNodeEmpty" label="Unchecked Configuration Limit"></rec-checkbox>
      </rec-checkbox-group>
    `,
    props: { value: ["disabledNode"] as string[] },
  }),
};
