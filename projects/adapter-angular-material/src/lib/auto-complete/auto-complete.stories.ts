import { NgTemplateOutlet } from "@angular/common";
import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { AutoCompleteComponent } from "./auto-complete.component";
import { StackComponent } from "../stack/stack.component";

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
 * for style-review stability. `WithRichOptions`/`WithRichOptionsWrapped`
 * above exercise the same rich-option rendering through the real component
 * instead; `RichOptionRowPreview`/`RichOptionRowPreviewWrapped` below are
 * mirrored too, the same way `dropdown.stories.ts`'s own pair are —
 * `rec-auto-complete-control` has no `debugForceOpen` escape hatch the way
 * `rec-dropdown` does (see `dropdown.component.ts`), so these render the
 * exact option-row markup/CSS classes `auto-complete-control.component.ts`'s
 * own template uses (`.rec-autocomplete-panel`/`.option`/`.optionContent`/
 * `.optionIcon`/`.optionText`/`.optionTextWrap`/`.optionLabel`/
 * `.optionSupportingText`, styled globally by `auto-complete-overlay.css`)
 * directly, rather than inventing a new rendering mechanism — the same
 * "outside the real portal, real classes" approach the reference's own
 * `renderRichOption` preview stories use.
 */
const meta: Meta<AutoCompleteComponent> = {
  title: "UI-Kit/AutoComplete",
  component: AutoCompleteComponent,
  decorators: [
    moduleMetadata({
      imports: [AutoCompleteComponent, NgTemplateOutlet, StackComponent],
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
      <rec-stack style="width: 320px;">
        <rec-auto-complete
          label="Country Selection"
          placeholder="Start typing..."
          assistiveText="Search from a predefined list of countries."
          [data]="data"
        ></rec-auto-complete>
      </rec-stack>
    `,
    props: { data: COUNTRY_DATA },
  }),
};

export const FormsSideBySide: Story = {
  render: () => ({
    template: `
      <rec-stack style="width: 480px;">
        <rec-auto-complete
          formLayout="side-by-side"
          label="Primary Region"
          placeholder="Select region..."
          assistiveText="Select the primary region for the deployment. This violently long string tests native textual wrapping safely mapping alongside inputs."
          [data]="data"
        ></rec-auto-complete>
      </rec-stack>
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
      <rec-stack style="width: 320px;">
        <rec-auto-complete
          label="Search Projects"
          placeholder="Project name..."
          [data]="data"
          [leftSection]="searchIcon"
        ></rec-auto-complete>
      </rec-stack>
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
      <rec-stack style="width: 320px;">
        <rec-auto-complete
          label="Validation URL"
          placeholder="https://recursica.dev"
          [data]="data"
          [rightSection]="checkIcon"
        ></rec-auto-complete>
      </rec-stack>
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
      <rec-stack style="width: 320px;">
        <rec-auto-complete
          label="Assignee"
          placeholder="Search team members..."
          [data]="${richOptionsData}"
          assistiveText="Each option can show a leading icon and supporting text — see MANTINE_ADAPTER_RICH_OPTION_DATA.md."
        ></rec-auto-complete>
      </rec-stack>
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
      <rec-stack style="width: 320px;">
        <rec-auto-complete
          label="Assignee"
          placeholder="Search team members..."
          [data]="${wrappedRichOptionsData}"
          [wrapItemText]="true"
          assistiveText="wrapItemText=true — long label/supportingText wrap instead of truncating."
        ></rec-auto-complete>
      </rec-stack>
    `,
  }),
};

const previewRowsData = `[
  { value: 'icon-and-supporting', label: 'Jane Doe', leadingIcon: userIcon, supportingText: 'jane.doe@example.com' },
  { value: 'no-icon', label: 'Alex Smith', supportingText: 'No leadingIcon — label/supportingText shift left, no reserved icon space' },
  { value: 'no-supporting-text', label: 'Taylor Rivera', leadingIcon: userIcon },
  { value: 'plain', label: 'Plain option — no leadingIcon, no supportingText' },
  { value: 'long-text', label: 'A very long option label that, with wrapItemText, wraps onto a second line instead of overflowing the fixed-width dropdown — otherwise it truncates with an ellipsis', leadingIcon: userIcon, supportingText: 'A similarly long supporting text string, to confirm the same wrap-or-truncate behavior applies to it too' }
]`;

/**
 * Renders the option row content directly — outside the real CDK overlay —
 * inside a `.rec-autocomplete-panel`-classed container sized to
 * `AutoComplete`'s own stacked-layout max-width token, using the exact same
 * `.option`/`.optionContent`/`.optionIcon`/`.optionText`/`.optionLabel`/
 * `.optionSupportingText` markup `auto-complete-control.component.ts`'s own
 * template uses (styled globally by `auto-complete-overlay.css`, wired into
 * Storybook's `styles` array in `angular.json`). Spacing between rows,
 * icon/supportingText presence-or-absence alignment, and long-text
 * wrapping/truncation are all much easier to inspect this way than by
 * opening the real (CDK-overlay-portal-rendered) panel — mirrors the
 * reference's own `RichOptionRowPreview`/`RichOptionRowPreviewWrapped`
 * rationale exactly (see `renderRichOption`/`MANTINE_ADAPTER_RICH_OPTION_DATA.md`).
 */
function optionRowPreviewTemplate(wrapItemText: boolean): string {
  return `
    ${userIconTemplate}
    <div
      class="dropdown rec-autocomplete-panel"
      role="listbox"
      style="width: var(--recursica_ui-kit_components_autocomplete_variants_layouts_stacked_properties_max-width);"
    >
      @for (opt of ${previewRowsData}; track opt.value) {
        <div class="option" role="option" tabindex="-1">
          <span class="optionContent">
            @if (opt.leadingIcon) {
              <span class="optionIcon">
                <ng-container [ngTemplateOutlet]="opt.leadingIcon" />
              </span>
            }
            <span class="optionText" [class.optionTextWrap]="${wrapItemText}">
              <span class="optionLabel">{{ opt.label }}</span>
              @if (opt.supportingText) {
                <span class="optionSupportingText">{{ opt.supportingText }}</span>
              }
            </span>
          </span>
        </div>
      }
    </div>
  `;
}

// Default: `wrapItemText` is false — label/supportingText truncate to a
// single line with an ellipsis instead of wrapping.
export const RichOptionRowPreview: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: optionRowPreviewTemplate(false),
  }),
};

// `wrapItemText: true` — label/supportingText wrap onto additional lines instead of truncating.
export const RichOptionRowPreviewWrapped: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: optionRowPreviewTemplate(true),
  }),
};

export const Disabled: Story = {
  render: () => ({
    template: `
      <rec-stack style="width: 320px;">
        <rec-auto-complete
          label="Disabled Deployment Node"
          placeholder="Disabled primitive map..."
          [data]="data"
          [disabled]="true"
        ></rec-auto-complete>
      </rec-stack>
    `,
    props: { data: ["Node 1", "Node 2", "Node 3"] },
  }),
};

export const ErrorState: Story = {
  render: () => ({
    template: `
      <rec-stack style="width: 320px;">
        <rec-auto-complete
          label="Cluster Failure"
          placeholder="Failing component instance..."
          [data]="data"
          [defaultValue]="'Invalid Cluster'"
          error="Critical runtime node disconnect detected traversing DOM architecture."
          [required]="true"
        ></rec-auto-complete>
      </rec-stack>
    `,
    props: { data: ["Cluster A", "Cluster B", "Cluster C"] },
  }),
};

export const StaticReadOnly: Story = {
  render: () => ({
    template: `
      <rec-stack style="width: 320px;">
        <rec-auto-complete
          label="Static ReadOnly Review"
          placeholder="Ignored..."
          [data]="data"
          [value]="'Explicitly Uneditable Bound Output'"
          [readOnly]="true"
        ></rec-auto-complete>
      </rec-stack>
    `,
    props: { data: ["Option 1", "Option 2"] },
  }),
};

export const EditableReadOnly: Story = {
  render: () => ({
    template: `
      <rec-stack style="width: 320px;">
        <rec-auto-complete
          label="Editable ReadOnly Review"
          placeholder="Ignored until active..."
          [data]="data"
          [defaultValue]="'Waiting for Edit Execution'"
          [readOnly]="true"
          [labelWithEditIcon]="true"
        ></rec-auto-complete>
      </rec-stack>
    `,
    props: { data: ["Option 1", "Option 2"] },
  }),
};
