import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { WithReadOnlyWrapperComponent } from "./with-read-only-wrapper.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub. Demonstrates the `WithReadOnlyWrapper` swap mechanism itself
 * (`readOnly` toggles between a projected interactive control and the real
 * `ReadOnlyField` text rendering), the composable pattern
 * `TextField`/`Dropdown`/`Checkbox`/`Radio`/`Switch` are each meant to
 * retrofit onto (out of scope for this task — see
 * `IMPLEMENTATION_NOTES.md`). No golden screenshot exists for this
 * component specifically (it isn't a top-level entry in the genesis
 * adapter's own Storybook — `WithReadOnlyWrapper.tsx` is a composition
 * helper other components use, not a directly-authored story in the
 * reference either); these stories exist to prove the mechanism live, not
 * to chase a golden pixel match.
 *
 * Uses a plain `<input>` for the "active" branch rather than a real
 * Recursica field component — proving the generic swap mechanism doesn't
 * require any specific control, and deliberately avoids importing
 * `TextFieldComponent`/etc. here even read-only, to keep this story
 * self-contained and unambiguous about what it's demonstrating.
 */
const meta: Meta<WithReadOnlyWrapperComponent> = {
  title: "UI-Kit/WithReadOnlyWrapper",
  component: WithReadOnlyWrapperComponent,
  decorators: [moduleMetadata({ imports: [WithReadOnlyWrapperComponent] })],
  argTypes: {
    readOnly: { control: "boolean" },
  },
  args: {
    label: "Account Email",
    assistiveText: "Used for sign-in and receipts.",
    readOnly: false,
    readOnlyValue: "person@example.com",
  },
};
export default meta;

type Story = StoryObj<WithReadOnlyWrapperComponent>;

const template = `
  <ng-template #active>
    <input type="email" value="person@example.com" style="width: 100%; box-sizing: border-box;" />
  </ng-template>
  <rec-with-read-only-wrapper
    [label]="label"
    [assistiveText]="assistiveText"
    [readOnly]="readOnly"
    [readOnlyValue]="readOnlyValue"
    [activeTemplate]="active"
  ></rec-with-read-only-wrapper>
`;

/** `readOnly` is falsy: renders the projected `activeTemplate` inside `FormControlWrapper`. */
export const Editable: Story = {
  args: { readOnly: false },
  render: (args) => ({ props: args, template }),
};

/** `readOnly` is truthy, no `readOnlyTemplate` override: renders real `rec-read-only-field` text. */
export const ReadOnly: Story = {
  args: { readOnly: true },
  render: (args) => ({ props: args, template }),
};

/**
 * `readOnlyTemplate` fully overrides the read-only display (mirrors the
 * reference's `readOnlyComponent`) — still wrapped in the same
 * `FormControlWrapper` chrome (label/assistive text), but the content is
 * whatever the caller supplies instead of `rec-read-only-field`'s own text
 * rendering.
 */
export const ReadOnlyWithCustomTemplate: Story = {
  args: { readOnly: true },
  render: (args) => ({
    props: args,
    template: `
      <ng-template #active>
        <input type="email" value="person@example.com" style="width: 100%; box-sizing: border-box;" />
      </ng-template>
      <ng-template #readOnlyOverride>
        <strong>person&#64;example.com (verified)</strong>
      </ng-template>
      <rec-with-read-only-wrapper
        [label]="label"
        [assistiveText]="assistiveText"
        [readOnly]="readOnly"
        [activeTemplate]="active"
        [readOnlyTemplate]="readOnlyOverride"
      ></rec-with-read-only-wrapper>
    `,
  }),
};
