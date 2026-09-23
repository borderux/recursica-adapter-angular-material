import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { DropdownComponent } from "./dropdown.component";
import { FormControlWrapperComponent } from "../form-control-wrapper/form-control-wrapper.component";
import { StackComponent } from "../stack/stack.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * variants in the genesis adapter's own `Dropdown.stories.tsx` /
 * `test/golden/ui-kit-dropdown--*.png`, with one composition difference:
 * every story wraps `<rec-dropdown>` inside `<rec-form-control-wrapper>`
 * explicitly (see `dropdown.component.ts`'s class doc comment for why —
 * Angular has no `React.cloneElement()`-based flattening the way the
 * genesis adapter's own `Dropdown.tsx` uses internally).
 */
const meta: Meta<DropdownComponent> = {
  title: "UI-Kit/Dropdown",
  component: DropdownComponent,
  decorators: [
    moduleMetadata({
      imports: [DropdownComponent, FormControlWrapperComponent, StackComponent],
    }),
  ],
  argTypes: {
    disabled: { control: "boolean" },
    required: { control: "boolean" },
    clearable: { control: "boolean" },
    readOnly: { control: "boolean" },
    error: { control: "boolean" },
    wrapItemText: { control: "boolean" },
  },
  args: {
    placeholder: "Pick value",
    disabled: false,
    required: false,
    clearable: false,
    readOnly: false,
    error: false,
  },
};
export default meta;

type Story = StoryObj<DropdownComponent>;

const COUNTRIES = [
  "United States",
  "Canada",
  "Mexico",
  "United Kingdom",
  "France",
];

/**
 * Angular template attribute values are always double-quoted here
 * (`[data]="..."`) — `JSON.stringify` produces double-quoted string
 * literals too, which prematurely terminates the surrounding HTML
 * attribute the moment the array has more than zero entries (confirmed
 * live: Angular's JIT template parser threw "Opening tag `rec-dropdown`
 * not terminated" the first time this used `JSON.stringify` directly).
 * Single-quoted array-literal source text nests safely inside a
 * double-quoted attribute instead.
 */
function toNgStringArrayLiteral(items: readonly string[]): string {
  return `[${items.map((item) => `'${item.replace(/'/g, "\\'")}'`).join(", ")}]`;
}

const COUNTRIES_NG_LIST = toNgStringArrayLiteral(COUNTRIES);

export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `
      <rec-stack style="width: 320px;">
        <rec-form-control-wrapper label="Country Selection" assistiveText="Select your country of origin.">
          <rec-dropdown
            [data]="${COUNTRIES_NG_LIST}"
            [placeholder]="placeholder"
            [disabled]="disabled"
            [required]="required"
            [error]="error"
          ></rec-dropdown>
        </rec-form-control-wrapper>
      </rec-stack>
    `,
  }),
};

export const Clearable: Story = {
  render: (args) => ({
    props: args,
    template: `
      <rec-stack style="width: 320px;">
        <rec-form-control-wrapper label="Clearable Options" assistiveText="Select your country of origin.">
          <rec-dropdown
            [data]="${COUNTRIES_NG_LIST}"
            value="Canada"
            [placeholder]="placeholder"
            [clearable]="true"
          ></rec-dropdown>
        </rec-form-control-wrapper>
      </rec-stack>
    `,
  }),
};

const pinIconTemplate = `
  <ng-template #pinIcon>
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  </ng-template>
`;

export const WithLeadingIcon: Story = {
  render: (args) => ({
    props: args,
    template: `
      ${pinIconTemplate}
      <rec-stack style="width: 320px;">
        <rec-form-control-wrapper label="Destination" assistiveText="Select your country of origin.">
          <rec-dropdown
            [data]="${COUNTRIES_NG_LIST}"
            [placeholder]="placeholder"
            [leftSection]="pinIcon"
          ></rec-dropdown>
        </rec-form-control-wrapper>
      </rec-stack>
    `,
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
  render: (args) => ({
    props: args,
    template: `
      ${userIconTemplate}
      <rec-stack style="width: 320px;">
        <rec-form-control-wrapper
          label="Assignee"
          assistiveText="Each option can show a leading icon and supporting text — see MANTINE_ADAPTER_RICH_OPTION_DATA.md."
        >
          <rec-dropdown [data]="${richOptionsData}" placeholder="Pick a team member"></rec-dropdown>
        </rec-form-control-wrapper>
      </rec-stack>
    `,
  }),
};

const wrappedRichOptionsData = `[
  { value: 'jdoe', label: 'Jane Doe, Senior Staff Engineer, Platform Infrastructure', leadingIcon: userIcon, supportingText: 'jane.doe@example.com — Platform Infrastructure team, on-call rotation lead' },
  { value: 'unassigned', label: 'Unassigned' }
]`;

export const WithRichOptionsWrapped: Story = {
  render: (args) => ({
    props: args,
    template: `
      ${userIconTemplate}
      <rec-stack style="width: 320px;">
        <rec-form-control-wrapper
          label="Assignee"
          assistiveText="wrapItemText=true — long label/supportingText wrap instead of truncating."
        >
          <rec-dropdown
            [data]="${wrappedRichOptionsData}"
            placeholder="Pick a team member"
            [wrapItemText]="true"
          ></rec-dropdown>
        </rec-form-control-wrapper>
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
 * Default: `wrapItemText` is false — label/supportingText truncate to a
 * single line with an ellipsis instead of wrapping. Uses `debugForceOpen`
 * (see `dropdown.component.ts`) to render the real overlay panel open for
 * a stable golden screenshot, rather than duplicating the option-row
 * markup outside the real component the way the genesis adapter's own
 * `RichOptionRowPreview` story does.
 */
export const RichOptionRowPreview: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => ({
    props: args,
    template: `
      ${userIconTemplate}
      <rec-stack style="width: 320px; padding-bottom: 260px;">
        <rec-form-control-wrapper label="Assignee">
          <rec-dropdown [data]="${previewRowsData}" placeholder="Pick a team member" [debugForceOpen]="true"></rec-dropdown>
        </rec-form-control-wrapper>
      </rec-stack>
    `,
  }),
};

/** `wrapItemText: true` — label/supportingText wrap onto additional lines instead of truncating. */
export const RichOptionRowPreviewWrapped: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => ({
    props: args,
    template: `
      ${userIconTemplate}
      <rec-stack style="width: 320px; padding-bottom: 320px;">
        <rec-form-control-wrapper label="Assignee">
          <rec-dropdown
            [data]="${previewRowsData}"
            placeholder="Pick a team member"
            [wrapItemText]="true"
            [debugForceOpen]="true"
          ></rec-dropdown>
        </rec-form-control-wrapper>
      </rec-stack>
    `,
  }),
};

/**
 * `static-*` variants — approximated, not real `ReadOnlyField`/
 * `WithReadOnlyWrapper` parity. See IMPLEMENTATION_NOTES.md's
 * "ReadOnlyField gap" section for the full explanation.
 */
export const StaticError: Story = {
  render: (args) => ({
    props: args,
    template: `
      <rec-stack style="width: 320px;">
        <rec-form-control-wrapper label="Country Selection" assistiveText="Select your country of origin." error="You must choose a valid destination.">
          <rec-dropdown [data]="${COUNTRIES_NG_LIST}" value="Invalid Island" [error]="true"></rec-dropdown>
        </rec-form-control-wrapper>
      </rec-stack>
    `,
  }),
};

export const StaticDisabled: Story = {
  render: (args) => ({
    props: args,
    template: `
      <rec-stack style="width: 320px;">
        <rec-form-control-wrapper label="Country Selection" assistiveText="Select your country of origin.">
          <rec-dropdown [data]="${COUNTRIES_NG_LIST}" value="United States" [disabled]="true"></rec-dropdown>
        </rec-form-control-wrapper>
      </rec-stack>
    `,
  }),
};

export const StaticReadOnly: Story = {
  render: (args) => ({
    props: args,
    template: `
      <rec-stack style="width: 320px;">
        <rec-form-control-wrapper label="Read Only View" assistiveText="Select your country of origin.">
          <rec-dropdown [data]="${COUNTRIES_NG_LIST}" value="Canada" [readOnly]="true"></rec-dropdown>
        </rec-form-control-wrapper>
      </rec-stack>
    `,
  }),
};
