import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { TreeComponent } from "./tree.component";
import { LayerComponent } from "../layer/layer.component";
import { RecursicaTreeNode } from "./tree-node-data";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * reference's own `Tree.stories.tsx` exactly: Default, AllExpanded,
 * PreSelected, MultipleSelection, Disabled, LayerOne.
 */
const meta: Meta<TreeComponent> = {
  title: "UI-Kit/Tree",
  component: TreeComponent,
  decorators: [
    moduleMetadata({
      imports: [TreeComponent, LayerComponent],
    }),
  ],
};
export default meta;

type Story = StoryObj<TreeComponent>;

const sampleData: RecursicaTreeNode[] = [
  {
    value: "documents",
    label: "Documents",
    children: [
      { value: "documents/resume.pdf", label: "resume.pdf" },
      { value: "documents/cover-letter.docx", label: "cover-letter.docx" },
      {
        value: "documents/taxes",
        label: "Taxes",
        children: [
          { value: "documents/taxes/2023.pdf", label: "2023.pdf" },
          { value: "documents/taxes/2024.pdf", label: "2024.pdf" },
        ],
      },
    ],
  },
  {
    value: "photos",
    label: "Photos",
    children: [
      { value: "photos/vacation.jpg", label: "vacation.jpg" },
      { value: "photos/family.jpg", label: "family.jpg" },
    ],
  },
  { value: "readme.md", label: "readme.md" },
];

export const Default: Story = {
  args: {
    data: sampleData,
    initialExpandedValues: ["documents"],
  },
};

export const AllExpanded: Story = {
  args: {
    data: sampleData,
    initialExpandedValues: "*",
  },
};

export const PreSelected: Story = {
  args: {
    data: sampleData,
    initialExpandedValues: ["documents"],
    initialSelectedValues: ["documents/resume.pdf"],
  },
};

export const MultipleSelection: Story = {
  args: {
    data: sampleData,
    initialExpandedValues: "*",
    initialSelectedValues: ["documents/resume.pdf", "photos/vacation.jpg"],
    multiple: true,
  },
};

export const Disabled: Story = {
  args: {
    data: sampleData,
    initialExpandedValues: ["documents"],
    initialSelectedValues: ["documents/resume.pdf"],
    disabled: true,
  },
};

export const LayerOne: Story = {
  render: () => ({
    template: `
      <rec-layer [layer]="1" style="padding: 24px; display: block;">
        <rec-tree [data]="data" [initialExpandedValues]="['documents']"></rec-tree>
      </rec-layer>
    `,
    props: { data: sampleData },
  }),
};
