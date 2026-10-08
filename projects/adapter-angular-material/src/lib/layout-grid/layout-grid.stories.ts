import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { LayoutGridComponent } from "./layout-grid.component";
import { LayoutGridColComponent } from "./layout-grid-col.component";

/**
 * Mirrors the Mantine adapter's `LayoutGrid.stories.tsx`: a single `Default` story. The column
 * count, gutters and margin come from the design system's layout-grid tokens (Forge defines them
 * per breakpoint), so none of them are inputs. The default grid is 6 columns, so 12 single-column
 * cells fill two full rows.
 */
const meta: Meta<LayoutGridComponent> = {
  title: "UI-Kit/LayoutGrid",
  component: LayoutGridComponent,
  decorators: [
    moduleMetadata({
      imports: [LayoutGridComponent, LayoutGridColComponent],
    }),
  ],
};
export default meta;

type Story = StoryObj<LayoutGridComponent>;

// Plain bordered cell: Card has a token min-width wider than one column, which would overflow it.
const swatch = (n: number) =>
  `<rec-layout-grid-col [span]="1"><div style="border: 1px dashed currentColor; padding: 8px; text-align: center;">${n}</div></rec-layout-grid-col>`;

export const Default: Story = {
  render: () => ({
    template: `
      <rec-layout-grid>
        ${Array.from({ length: 12 }, (_, i) => swatch((i % 6) + 1)).join("")}
      </rec-layout-grid>
    `,
  }),
};

export const Accessibility: Story = {
  render: () => ({
    template: `
      <rec-layout-grid aria-label="A11Y-LABEL" aria-describedby="a11y-desc" id="a11y-id">
        ${swatch(1)}
      </rec-layout-grid>
    `,
  }),
};
