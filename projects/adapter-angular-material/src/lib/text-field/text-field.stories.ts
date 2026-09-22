import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { TextFieldComponent } from "./text-field.component";
import { FormControlWrapperComponent } from "../form-control-wrapper/form-control-wrapper.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * variants in the genesis adapter's own `TextField.stories.tsx` /
 * `test/golden/ui-kit-textfield--*.png`, with one composition difference:
 * every story wraps `<rec-text-field>` inside `<rec-form-control-wrapper>`
 * explicitly (see `text-field.component.ts`'s class doc comment for why —
 * Angular has no `React.cloneElement()`-based flattening the way the
 * genesis adapter's own `TextField.tsx` uses internally via
 * `WithReadOnlyWrapper`). This is the first real (non-demo-directive)
 * consumer of `RECURSICA_FORM_CONTROL`/`FormControlWrapper` — see
 * IMPLEMENTATION_NOTES.md for the live composition verification.
 */
const meta: Meta<TextFieldComponent> = {
  title: "UI-Kit/TextField",
  component: TextFieldComponent,
  decorators: [
    moduleMetadata({
      imports: [TextFieldComponent, FormControlWrapperComponent],
    }),
  ],
  argTypes: {
    disabled: { control: "boolean" },
    required: { control: "boolean" },
    readOnly: { control: "boolean" },
    error: { control: "boolean" },
  },
  args: {
    placeholder: "Enter validation hash...",
    disabled: false,
    required: false,
    readOnly: false,
    error: false,
  },
};
export default meta;

type Story = StoryObj<TextFieldComponent>;

export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 320px;">
        <rec-form-control-wrapper
          label="Authentication Token"
          assistiveText="Tokens are stored identically locally and strictly ephemeral."
        >
          <rec-text-field [placeholder]="placeholder" [disabled]="disabled" [required]="required" [error]="error"></rec-text-field>
        </rec-form-control-wrapper>
      </div>
    `,
  }),
};

export const FormsSideBySide: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 480px;">
        <rec-form-control-wrapper
          formLayout="side-by-side"
          label="Distributed Access Control"
          assistiveText="Specify the exact cluster administrative credentials enforcing strict domain policies. This violently long string tests native textual wrapping safely mapping alongside inputs."
        >
          <rec-text-field placeholder="admin@node.local"></rec-text-field>
        </rec-form-control-wrapper>
      </div>
    `,
  }),
};

const searchIconTemplate = `
  <ng-template #searchIcon>
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  </ng-template>
`;

export const WithLeadingIcon: Story = {
  render: (args) => ({
    props: args,
    template: `
      ${searchIconTemplate}
      <div style="width: 320px;">
        <rec-form-control-wrapper label="Search Global Context">
          <rec-text-field placeholder="Search for repositories..." [leftSection]="searchIcon"></rec-text-field>
        </rec-form-control-wrapper>
      </div>
    `,
  }),
};

const checkIconTemplate = `
  <ng-template #checkIcon>
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  </ng-template>
`;

export const WithTrailingIcon: Story = {
  render: (args) => ({
    props: args,
    template: `
      ${checkIconTemplate}
      <div style="width: 320px;">
        <rec-form-control-wrapper label="Validation URL">
          <rec-text-field placeholder="https://recursica.dev" [rightSection]="checkIcon"></rec-text-field>
        </rec-form-control-wrapper>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 320px;">
        <rec-form-control-wrapper label="Disabled Deployment Node">
          <rec-text-field placeholder="Disabled primitive map..." [disabled]="true"></rec-text-field>
        </rec-form-control-wrapper>
      </div>
    `,
  }),
};

export const ErrorState: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 320px;">
        <rec-form-control-wrapper label="Cluster Failure" error="Critical runtime node disconnect detected traversing DOM architecture." [required]="true">
          <rec-text-field placeholder="Failing component instance..." value="Invalid Execution Plan" [error]="true" [required]="true"></rec-text-field>
        </rec-form-control-wrapper>
      </div>
    `,
  }),
};

/**
 * `readOnly: true` — approximated, not real `ReadOnlyField`/
 * `WithReadOnlyWrapper` parity. See IMPLEMENTATION_NOTES.md's "ReadOnlyField
 * gap" section: in the real genesis-adapter reference, *both*
 * `StaticReadOnly` and `EditableReadOnly` route through `ReadOnlyField`'s
 * plain-text rendering (neither story passes a `readOnlyComponent`) — this
 * adapter ships a real native HTML `readonly` `<input>` instead (via
 * `matInput`), which is genuinely functional but will not pixel-match
 * either golden screenshot's chrome-free text rendering.
 */
export const StaticReadOnly: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 320px;">
        <rec-form-control-wrapper label="Static ReadOnly Review">
          <rec-text-field placeholder="Ignored..." value="Explicitly Uneditable Bound Output" [readOnly]="true"></rec-text-field>
        </rec-form-control-wrapper>
      </div>
    `,
  }),
};

/**
 * Same `readOnly` approximation as `StaticReadOnly` above, differentiated
 * visually the same way the genesis reference differentiates the two
 * stories in its own props (`labelWithEditIcon: true`) — a real, already-
 * implemented `Label` feature (see `label.component.ts`), composed here on
 * `FormControlWrapper`'s own `labelWithEditIcon` input.
 */
export const EditableReadOnly: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="width: 320px;">
        <rec-form-control-wrapper label="Editable ReadOnly Review" [labelWithEditIcon]="true">
          <rec-text-field placeholder="Ignored until active..." value="Waiting for Edit Execution" [readOnly]="true"></rec-text-field>
        </rec-form-control-wrapper>
      </div>
    `,
  }),
};
