import type { Meta, StoryObj } from "@storybook/angular";
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
