import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { HeadingComponent } from "./heading.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * genesis adapter's own `Heading.stories.tsx` / `test/golden/ui-kit-heading--*.png`.
 */
const meta: Meta<HeadingComponent> = {
  title: "UI-Kit/Heading",
  component: HeadingComponent,
  decorators: [
    moduleMetadata({
      imports: [HeadingComponent],
    }),
  ],
  argTypes: {
    order: { control: "select", options: [1, 2, 3, 4, 5, 6] },
  },
};
export default meta;

type Story = StoryObj<HeadingComponent>;

export const Default: Story = {
  render: () => ({
    template: `<rec-heading [order]="1">Semantic H1 Document Boundary</rec-heading>`,
  }),
};

export const StaticVariations: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 24px;">
        <rec-heading [order]="1">H1 Heading</rec-heading>
        <rec-heading [order]="2">H2 Heading</rec-heading>
        <rec-heading [order]="3">H3 Heading</rec-heading>
        <rec-heading [order]="4">H4 Heading</rec-heading>
        <rec-heading [order]="5">H5 Heading</rec-heading>
        <rec-heading [order]="6">H6 Heading</rec-heading>
      </div>
    `,
  }),
};
