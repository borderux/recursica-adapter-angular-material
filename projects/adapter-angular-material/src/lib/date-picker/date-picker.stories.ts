import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { DatePickerComponent } from "./date-picker.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * genesis adapter's own `DatePicker.stories.tsx` /
 * `test/golden/ui-kit-datepicker--*.png`. Same composition shape as
 * `TextArea`/`NumberInput` — `rec-date-picker` composes
 * `rec-with-read-only-wrapper` internally.
 *
 * Range-selection stories from the reference are not mirrored — see
 * `date-picker-overlay.css`'s own header comment: range mode isn't
 * reachable through either adapter's public API.
 */
const meta: Meta<DatePickerComponent> = {
  title: "UI-Kit/DatePicker",
  component: DatePickerComponent,
  decorators: [
    moduleMetadata({
      imports: [DatePickerComponent],
    }),
  ],
  argTypes: {
    disabled: { control: "boolean" },
    required: { control: "boolean" },
    readOnly: { control: "boolean" },
  },
  args: {
    label: "Project Deadline",
    assistiveText: "Specify the absolute cutoff for code submission.",
    disabled: false,
    required: false,
    readOnly: false,
  },
};
export default meta;

type Story = StoryObj<DatePickerComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <div style="width: 320px;">
        <rec-date-picker
          label="Project Deadline"
          assistiveText="Specify the absolute cutoff for code submission."
        ></rec-date-picker>
      </div>
    `,
  }),
};

export const FormsSideBySide: Story = {
  render: () => ({
    template: `
      <div style="width: 480px;">
        <rec-date-picker
          formLayout="side-by-side"
          label="Incident Start Date"
          assistiveText="When did the incident originally occur?"
        ></rec-date-picker>
      </div>
    `,
  }),
};

const boxIconTemplate = `
  <ng-template #boxIcon>
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  </ng-template>
`;

export const WithLeadingIcon: Story = {
  render: () => ({
    template: `
      ${boxIconTemplate}
      <div style="width: 320px;">
        <rec-date-picker label="Launch Date" [leftSection]="boxIcon"></rec-date-picker>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    template: `
      <div style="width: 320px;">
        <rec-date-picker label="Disabled Date Range" [disabled]="true"></rec-date-picker>
      </div>
    `,
  }),
};

export const ErrorState: Story = {
  render: () => ({
    template: `
      <div style="width: 320px;">
        <rec-date-picker
          label="Execution Date"
          error="The chosen date conflicts with an existing deployment freeze."
          [required]="true"
        ></rec-date-picker>
      </div>
    `,
  }),
};

export const OpenedCalendar: Story = {
  render: () => ({
    template: `
      <div style="width: 320px; height: 420px;">
        <rec-date-picker
          label="Meeting Date"
          assistiveText="Calendar rendered open by default for styling review."
          [defaultValue]="meetingDate"
          [opened]="true"
        ></rec-date-picker>
      </div>
    `,
    props: {
      meetingDate: new Date(2026, 7, 26),
    },
  }),
};

export const StaticReadOnly: Story = {
  render: () => ({
    template: `
      <div style="width: 320px;">
        <rec-date-picker label="Static ReadOnly Review" [value]="reviewDate" [readOnly]="true"></rec-date-picker>
      </div>
    `,
    props: {
      reviewDate: new Date(2026, 4, 21),
    },
  }),
};

export const EditableReadOnly: Story = {
  render: () => ({
    template: `
      <div style="width: 320px;">
        <rec-date-picker
          label="Editable ReadOnly Review"
          [defaultValue]="reviewDate"
          [readOnly]="true"
          [labelWithEditIcon]="true"
        ></rec-date-picker>
      </div>
    `,
    props: {
      reviewDate: new Date(2026, 5, 1),
    },
  }),
};
