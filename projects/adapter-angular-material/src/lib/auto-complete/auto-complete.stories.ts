import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { AutoCompleteComponent } from "./auto-complete.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * genesis adapter's own `AutoComplete.stories.tsx` /
 * `test/golden/ui-kit-autocomplete--*.png`. Same composition shape as
 * `TextArea`/`NumberInput`/`DatePicker`/`TimePicker` — `rec-auto-complete`
 * composes `rec-with-read-only-wrapper` internally.
 *
 * The reference's `RichOptionRowPreview`/`RichOptionRowPreviewWrapped`
 * stories render option rows directly (bypassing the real portal) purely
 * for style-review stability — not mirrored here; `WithRichOptions`/
 * `WithRichOptionsWrapped` below exercise the same rich-option rendering
 * through the real component instead.
 */
const meta: Meta<AutoCompleteComponent> = {
  title: "UI-Kit/AutoComplete",
  component: AutoCompleteComponent,
  decorators: [
    moduleMetadata({
      imports: [AutoCompleteComponent],
    }),
  ],
  argTypes: {
    disabled: { control: "boolean" },
    required: { control: "boolean" },
    readOnly: { control: "boolean" },
    wrapItemText: { control: "boolean" },
  },
  args: {
    label: "Country Selection",
    placeholder: "Start typing...",
    assistiveText: "Search from a predefined list of countries.",
    disabled: false,
    required: false,
    readOnly: false,
    wrapItemText: false,
  },
};
export default meta;

type Story = StoryObj<AutoCompleteComponent>;

const COUNTRY_DATA = [
  "United States",
  "Canada",
  "Mexico",
  "United Kingdom",
  "France",
  "Germany",
  "Japan",
  "Brazil",
  "India",
  "Australia",
];

export const Default: Story = {
  render: () => ({
    template: `
      <div style="width: 320px;">
        <rec-auto-complete
          label="Country Selection"
          placeholder="Start typing..."
          assistiveText="Search from a predefined list of countries."
          [data]="data"
        ></rec-auto-complete>
      </div>
    `,
    props: { data: COUNTRY_DATA },
  }),
};

export const FormsSideBySide: Story = {
  render: () => ({
    template: `
      <div style="width: 480px;">
        <rec-auto-complete
          formLayout="side-by-side"
          label="Primary Region"
          placeholder="Select region..."
          assistiveText="Select the primary region for the deployment. This violently long string tests native textual wrapping safely mapping alongside inputs."
          [data]="data"
        ></rec-auto-complete>
      </div>
    `,
    props: {
      data: ["US-East", "US-West", "EU-Central", "AP-South", "SA-East"],
    },
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
  render: () => ({
    template: `
      ${searchIconTemplate}
      <div style="width: 320px;">
        <rec-auto-complete
          label="Search Projects"
          placeholder="Project name..."
          [data]="data"
          [leftSection]="searchIcon"
        ></rec-auto-complete>
      </div>
    `,
    props: { data: ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"] },
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
  render: () => ({
    template: `
      ${checkIconTemplate}
      <div style="width: 320px;">
        <rec-auto-complete
          label="Validation URL"
          placeholder="https://recursica.dev"
          [data]="data"
          [rightSection]="checkIcon"
        ></rec-auto-complete>
      </div>
    `,
    props: {
      data: [
        "https://recursica.dev",
        "https://beta.recursica.dev",
        "https://api.recursica.dev",
      ],
    },
  }),
};

const userIconTemplate = `
  <ng-template #userIcon>
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  </ng-template>
`;

const richOptionsData = `[
  { value: 'jdoe', label: 'Jane Doe', leadingIcon: userIcon, supportingText: 'jane.doe@example.com' },
  { value: 'asmith', label: 'Alex Smith', leadingIcon: userIcon, supportingText: 'alex.smith@example.com' },
  { value: 'unassigned', label: 'Unassigned' }
]`;

export const WithRichOptions: Story = {
  render: () => ({
    template: `
      ${userIconTemplate}
      <div style="width: 320px;">
        <rec-auto-complete
          label="Assignee"
          placeholder="Search team members..."
          [data]="${richOptionsData}"
          assistiveText="Each option can show a leading icon and supporting text."
        ></rec-auto-complete>
      </div>
    `,
  }),
};

const wrappedRichOptionsData = `[
  { value: 'jdoe', label: 'Jane Doe, Senior Staff Engineer, Platform Infrastructure', leadingIcon: userIcon, supportingText: 'jane.doe@example.com — Platform Infrastructure team, on-call rotation lead' },
  { value: 'unassigned', label: 'Unassigned' }
]`;

export const WithRichOptionsWrapped: Story = {
  render: () => ({
    template: `
      ${userIconTemplate}
      <div style="width: 320px;">
        <rec-auto-complete
          label="Assignee"
          placeholder="Search team members..."
          [data]="${wrappedRichOptionsData}"
          [wrapItemText]="true"
          assistiveText="wrapItemText=true — long label/supportingText wrap instead of truncating."
        ></rec-auto-complete>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    template: `
      <div style="width: 320px;">
        <rec-auto-complete
          label="Disabled Deployment Node"
          placeholder="Disabled primitive map..."
          [data]="data"
          [disabled]="true"
        ></rec-auto-complete>
      </div>
    `,
    props: { data: ["Node 1", "Node 2", "Node 3"] },
  }),
};

export const ErrorState: Story = {
  render: () => ({
    template: `
      <div style="width: 320px;">
        <rec-auto-complete
          label="Cluster Failure"
          placeholder="Failing component instance..."
          [data]="data"
          [defaultValue]="'Invalid Cluster'"
          error="Critical runtime node disconnect detected traversing DOM architecture."
          [required]="true"
        ></rec-auto-complete>
      </div>
    `,
    props: { data: ["Cluster A", "Cluster B", "Cluster C"] },
  }),
};

export const StaticReadOnly: Story = {
  render: () => ({
    template: `
      <div style="width: 320px;">
        <rec-auto-complete
          label="Static ReadOnly Review"
          placeholder="Ignored..."
          [data]="data"
          [value]="'Explicitly Uneditable Bound Output'"
          [readOnly]="true"
        ></rec-auto-complete>
      </div>
    `,
    props: { data: ["Option 1", "Option 2"] },
  }),
};

export const EditableReadOnly: Story = {
  render: () => ({
    template: `
      <div style="width: 320px;">
        <rec-auto-complete
          label="Editable ReadOnly Review"
          placeholder="Ignored until active..."
          [data]="data"
          [defaultValue]="'Waiting for Edit Execution'"
          [readOnly]="true"
          [labelWithEditIcon]="true"
        ></rec-auto-complete>
      </div>
    `,
    props: { data: ["Option 1", "Option 2"] },
  }),
};
