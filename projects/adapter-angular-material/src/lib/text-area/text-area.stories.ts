import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { TextAreaComponent } from "./text-area.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * genesis adapter's own `TextArea.stories.tsx` / `test/golden/ui-kit-textarea--*.png`.
 * Unlike `text-field.stories.ts`, no story wraps `<rec-text-area>` in an
 * external `<rec-form-control-wrapper>` — this component composes
 * `rec-with-read-only-wrapper` internally (see `text-area.component.ts`'s
 * class doc comment for why that's a real, deliberate difference from
 * `TextField`, not an oversight).
 */
const meta: Meta<TextAreaComponent> = {
  title: "UI-Kit/TextArea",
  component: TextAreaComponent,
  decorators: [
    moduleMetadata({
      imports: [TextAreaComponent],
    }),
  ],
  argTypes: {
    disabled: { control: "boolean" },
    required: { control: "boolean" },
    readOnly: { control: "boolean" },
    autosize: { control: "boolean" },
    minRows: { control: "number" },
    maxRows: { control: "number" },
  },
  args: {
    label: "Description",
    assistiveText: "Enter your full description here.",
    disabled: false,
    required: false,
    readOnly: false,
    autosize: false,
  },
};
export default meta;

type Story = StoryObj<TextAreaComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <div style="width: 320px;">
        <rec-text-area
          label="Description"
          assistiveText="Enter your full description here."
          placeholder="Type something long..."
        ></rec-text-area>
      </div>
    `,
  }),
};

export const Autosize: Story = {
  render: () => ({
    template: `
      <div style="width: 320px;">
        <rec-text-area
          label="Auto-sizing TextArea"
          placeholder="Type multiple lines here. Watch it grow!"
          [autosize]="true"
          [minRows]="2"
          [maxRows]="6"
        ></rec-text-area>
      </div>
    `,
  }),
};

export const StaticError: Story = {
  render: () => ({
    template: `
      <div style="width: 320px;">
        <rec-text-area
          label="Description"
          error="This field requires a detailed explanation."
          value="Some bad input."
          [required]="true"
        ></rec-text-area>
      </div>
    `,
  }),
};

export const StaticDisabled: Story = {
  render: () => ({
    template: `
      <div style="width: 320px;">
        <rec-text-area
          label="Description"
          value="This content is locked."
          [disabled]="true"
        ></rec-text-area>
      </div>
    `,
  }),
};

/**
 * Genuine `ReadOnlyField` parity, not an approximation — see
 * `text-area.component.ts`'s class doc comment: this is the first
 * component in this adapter built directly on `rec-with-read-only-wrapper`,
 * so `readOnly` renders the real chrome-free text treatment (matching
 * `TextField`'s `StaticReadOnly` golden, minus the gap that story has to
 * carry until it gets retrofitted).
 */
export const StaticReadOnly: Story = {
  render: () => ({
    template: `
      <div style="width: 320px;">
        <rec-text-area
          label="Read Only View"
          value="This text is safely frozen in read-only form."
          [readOnly]="true"
        ></rec-text-area>
      </div>
    `,
  }),
};
