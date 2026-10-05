import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import recursicaManifest from "../../../../../recursica_manifest.json";
import { LayoutGridComponent } from "./layout-grid.component";
import { LayoutGridColComponent } from "./layout-grid-col.component";

/**
 * Mirrors the reference's single `Default` story: two rows of single-column cells, as many per
 * row as the manifest's default layout grid has columns. Plain bordered cells, not `rec-card`:
 * Card's token min-width is wider than one column and would overflow it. Columns, gutters and margin come from the
 * design system, so the story sets none of them.
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

const columns = recursicaManifest.brand["layout-grids"].default.columns.$value;
const cells = Array.from({ length: columns * 2 }, (_, i) => (i % columns) + 1);

export const Default: Story = {
  render: () => ({
    props: { cells },
    template: `
      <rec-layout-grid>
        @for (cell of cells; track $index) {
          <rec-layout-grid-col [span]="1"><div style="border: 1px dashed currentColor; padding: 8px; text-align: center;">{{ cell }}</div></rec-layout-grid-col>
        }
      </rec-layout-grid>
    `,
  }),
};
