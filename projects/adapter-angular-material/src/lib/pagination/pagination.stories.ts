import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { PaginationComponent } from "./pagination.component";

/**
 * REAL implementation. 3 golden stories, matching `Pagination.stories.tsx`
 * exactly — all use only the top-level `<Pagination total ...>` shape (see
 * the component's own class doc comment for why the reference's granular
 * `Pagination.Root`/`.Items`/etc. composition isn't built here).
 */
const meta: Meta<PaginationComponent> = {
  title: "UI-Kit/Pagination",
  component: PaginationComponent,
  args: {
    total: 10,
  },
};
export default meta;

type Story = StoryObj<PaginationComponent>;

export const Default: Story = {};

export const WithEdges: Story = {
  args: {
    withEdges: true,
  },
};

export const WithTextLabels: Story = {
  args: {
    withEdges: true,
    withLabels: true,
  },
};

/** Passthrough check: aria and id land on the inner `nav`, not on `rec-pagination`. */
export const Accessibility: Story = {
  decorators: [moduleMetadata({ imports: [PaginationComponent] })],
  render: () => ({
    template: `
      <rec-pagination
        [total]="5"
        aria-label="A11Y-LABEL"
        aria-describedby="a11y-desc"
        id="a11y-id"
      ></rec-pagination>
      <span id="a11y-desc" hidden>Description</span>
    `,
  }),
};
