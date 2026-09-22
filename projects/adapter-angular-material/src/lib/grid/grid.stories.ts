import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { GridComponent } from "./grid.component";
import { GridColComponent } from "./grid-col.component";
import { CardComponent } from "../card/card.component";
import { CardContentComponent } from "../card/card-content.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * genesis adapter's own `Grid.stories.tsx` / `test/golden/ui-kit-grid--*.png`,
 * with two intentional gaps:
 *
 * - `Grow` — not mirrored. `grow` isn't implemented (see
 *   `grid.component.ts`'s own class doc comment) — mirroring the story
 *   would silently demonstrate a no-op, not real coverage.
 * - `ResponsiveSizes` — not mirrored. The reference's own comment on this
 *   story says it exists purely so `mui-adapter` has a same-named
 *   counterpart to diff against; `ResponsiveSpans` already covers the same
 *   underlying behavior (Mantine's `Grid.Col` — and this component — have
 *   no separate `size` prop, only `span`).
 *
 * Uses plain text instead of `rec-text` (still a stub in this adapter) as
 * `Card`'s content, unlike the reference's own `Text`-wrapped `Swatch`.
 */
const meta: Meta<GridComponent> = {
  title: "UI-Kit/Grid",
  component: GridComponent,
  decorators: [
    moduleMetadata({
      imports: [
        GridComponent,
        GridColComponent,
        CardComponent,
        CardContentComponent,
      ],
    }),
  ],
  argTypes: {
    columns: { control: "number" },
  },
};
export default meta;

type Story = StoryObj<GridComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <rec-grid>
        <rec-grid-col [span]="2"><rec-card><rec-card-content>span 2 of 6 (default)</rec-card-content></rec-card></rec-grid-col>
        <rec-grid-col [span]="2"><rec-card><rec-card-content>span 2 of 6 (default)</rec-card-content></rec-card></rec-grid-col>
        <rec-grid-col [span]="2"><rec-card><rec-card-content>span 2 of 6 (default)</rec-card-content></rec-card></rec-grid-col>
      </rec-grid>
    `,
  }),
};

export const ResponsiveSpans: Story = {
  render: () => ({
    template: `
      <rec-grid [columns]="12">
        <rec-grid-col [span]="{ base: 12, sm: 6, md: 3 }"><rec-card><rec-card-content>xs 12 / sm 6 / md 3</rec-card-content></rec-card></rec-grid-col>
        <rec-grid-col [span]="{ base: 12, sm: 6, md: 3 }"><rec-card><rec-card-content>xs 12 / sm 6 / md 3</rec-card-content></rec-card></rec-grid-col>
        <rec-grid-col [span]="{ base: 12, sm: 6, md: 3 }"><rec-card><rec-card-content>xs 12 / sm 6 / md 3</rec-card-content></rec-card></rec-grid-col>
        <rec-grid-col [span]="{ base: 12, sm: 6, md: 3 }"><rec-card><rec-card-content>xs 12 / sm 6 / md 3</rec-card-content></rec-card></rec-grid-col>
      </rec-grid>
    `,
  }),
};

export const Offset: Story = {
  render: () => ({
    template: `
      <rec-grid>
        <rec-grid-col [span]="2" [offset]="2"><rec-card><rec-card-content>span 2, offset 2 (of 6)</rec-card-content></rec-card></rec-grid-col>
        <rec-grid-col [span]="2"><rec-card><rec-card-content>span 2 (of 6)</rec-card-content></rec-card></rec-grid-col>
      </rec-grid>
    `,
  }),
};

export const CustomColumnCount: Story = {
  render: () => ({
    template: `
      <rec-grid [columns]="4">
        <rec-grid-col [span]="2"><rec-card><rec-card-content>span 2 of 4</rec-card-content></rec-card></rec-grid-col>
        <rec-grid-col [span]="2"><rec-card><rec-card-content>span 2 of 4</rec-card-content></rec-card></rec-grid-col>
      </rec-grid>
    `,
  }),
};

export const VisibleHiddenFrom: Story = {
  render: () => ({
    template: `
      <rec-grid>
        <rec-grid-col [span]="3" hiddenFrom="sm"><rec-card><rec-card-content>hidden from sm and up</rec-card-content></rec-card></rec-grid-col>
        <rec-grid-col [span]="3" visibleFrom="sm"><rec-card><rec-card-content>visible from sm and up</rec-card-content></rec-card></rec-grid-col>
      </rec-grid>
    `,
  }),
};
