import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { TransferListComponent } from "./transfer-list.component";
import { RecursicaTransferListData } from "./transfer-list-item";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * reference's own `TransferList.stories.tsx` exactly: Default, Grouped,
 * SideBySide, NoSearch, StaticError, StaticDisabled, Empty, ReadOnly.
 */
const meta: Meta<TransferListComponent> = {
  title: "UI-Kit/TransferList",
  component: TransferListComponent,
  decorators: [
    moduleMetadata({
      imports: [TransferListComponent],
    }),
  ],
  args: {
    label: "Assign users",
    assistiveText: "Move users into the selected list.",
    disabled: false,
    required: false,
  },
};
export default meta;

type Story = StoryObj<TransferListComponent>;

const SAMPLE_DATA: RecursicaTransferListData = [
  [
    { value: "alpha", label: "Alpha" },
    { value: "bravo", label: "Bravo" },
    { value: "charlie", label: "Charlie" },
    { value: "delta", label: "Delta" },
    { value: "echo", label: "Echo" },
  ],
  [{ value: "foxtrot", label: "Foxtrot" }],
];

const GROUPED_DATA: RecursicaTransferListData = [
  [
    { value: "apple", label: "Apple", group: "Fruit" },
    { value: "banana", label: "Banana", group: "Fruit" },
    { value: "carrot", label: "Carrot", group: "Vegetable" },
    { value: "daikon", label: "Daikon", group: "Vegetable" },
    { value: "eagle", label: "Eagle" },
  ],
  [],
];

export const Default: Story = {
  args: {
    defaultData: SAMPLE_DATA,
  },
};

export const Grouped: Story = {
  args: {
    label: "Assign ingredients",
    defaultData: GROUPED_DATA,
  },
};

export const SideBySide: Story = {
  args: {
    defaultData: SAMPLE_DATA,
    formLayout: "side-by-side",
  },
};

export const NoSearch: Story = {
  args: {
    label: "Assign users (no filtering)",
    defaultData: SAMPLE_DATA,
    searchable: false,
  },
};

export const StaticError: Story = {
  args: {
    defaultData: [[], SAMPLE_DATA[0]],
    error: "Select at least one user.",
  },
};

export const StaticDisabled: Story = {
  args: {
    defaultData: SAMPLE_DATA,
    disabled: true,
  },
};

export const Empty: Story = {
  args: {
    label: "Assign users",
    defaultData: [[], []],
  },
};

export const ReadOnly: Story = {
  args: {
    label: "Assigned users",
    defaultData: [[], SAMPLE_DATA[0]],
    readOnly: true,
  },
};
