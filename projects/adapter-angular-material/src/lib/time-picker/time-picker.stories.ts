import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { TimePickerComponent } from "./time-picker.component";
import { StackComponent } from "../stack/stack.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * genesis adapter's own `TimePicker.stories.tsx` /
 * `test/golden/ui-kit-timepicker--*.png`. Same composition shape as
 * `TextArea`/`NumberInput`/`DatePicker` — `rec-time-picker` composes
 * `rec-with-read-only-wrapper` internally.
 */
const meta: Meta<TimePickerComponent> = {
  title: "UI-Kit/TimePicker",
  component: TimePickerComponent,
  decorators: [
    moduleMetadata({
      imports: [TimePickerComponent, StackComponent],
    }),
  ],
  argTypes: {
    disabled: { control: "boolean" },
    required: { control: "boolean" },
    readOnly: { control: "boolean" },
    withSeconds: { control: "boolean" },
  },
  args: {
    label: "Meeting Time",
    assistiveText: "Choose the start time in your local timezone.",
    disabled: false,
    required: false,
    readOnly: false,
    withSeconds: false,
  },
};
export default meta;

type Story = StoryObj<TimePickerComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <rec-stack style="width: 320px;">
        <rec-time-picker
          label="Meeting Time"
          assistiveText="Choose the start time in your local timezone."
        ></rec-time-picker>
      </rec-stack>
    `,
  }),
};

export const FormsSideBySide: Story = {
  render: () => ({
    template: `
      <rec-stack style="width: 480px;">
        <rec-time-picker
          formLayout="side-by-side"
          label="Incident Start Time"
          assistiveText="When did the incident originally occur?"
        ></rec-time-picker>
      </rec-stack>
    `,
  }),
};

export const WithSeconds: Story = {
  render: () => ({
    template: `
      <rec-stack style="width: 320px;">
        <rec-time-picker
          label="Precise Execution Time"
          assistiveText="Includes a seconds segment for exact scheduling."
          [withSeconds]="true"
        ></rec-time-picker>
      </rec-stack>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    template: `
      <rec-stack style="width: 320px;">
        <rec-time-picker label="Disabled Time Slot" [disabled]="true"></rec-time-picker>
      </rec-stack>
    `,
  }),
};

export const ErrorState: Story = {
  render: () => ({
    template: `
      <rec-stack style="width: 320px;">
        <rec-time-picker
          label="Deployment Window"
          error="The chosen time falls outside the allowed deployment window."
          [required]="true"
        ></rec-time-picker>
      </rec-stack>
    `,
  }),
};

const clockIconTemplate = `
  <ng-template #clockIcon>
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  </ng-template>
`;

export const WithLeadingIcon: Story = {
  render: () => ({
    template: `
      ${clockIconTemplate}
      <rec-stack style="width: 320px;">
        <rec-time-picker
          label="Meeting Time"
          assistiveText="Choose the start time in your local timezone."
          [leftSection]="clockIcon"
        ></rec-time-picker>
      </rec-stack>
    `,
  }),
};

export const StaticReadOnly: Story = {
  render: () => ({
    template: `
      <rec-stack style="width: 320px;">
        <rec-time-picker label="Static ReadOnly Review" value="14:30" [readOnly]="true"></rec-time-picker>
      </rec-stack>
    `,
  }),
};

export const EditableReadOnly: Story = {
  render: () => ({
    template: `
      <rec-stack style="width: 320px;">
        <rec-time-picker
          label="Editable ReadOnly Review"
          [defaultValue]="'09:00'"
          [readOnly]="true"
          [labelWithEditIcon]="true"
        ></rec-time-picker>
      </rec-stack>
    `,
  }),
};
