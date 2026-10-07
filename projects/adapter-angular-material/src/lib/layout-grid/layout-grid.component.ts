import { Component, Input, ViewEncapsulation } from "@angular/core";

/**
 * Recursica `LayoutGrid` — Angular Material adapter. Replaces the old `Grid`, following the
 * Mantine adapter's rename and contract change (`LAYOUT_GRID_IMPLEMENTATION_NOTES.md` there).
 *
 * Material has no layout-grid primitive (`MatGridList` is a false friend: a fixed-row-height tile
 * widget), so this is hand-built.
 *
 * ## No integrator-facing layout props
 *
 * Columns, column-gutter, row-gutter and margin are design-system-managed, not per-instance
 * settings. Forge defines the `layout-grids` tokens per breakpoint and redefines the responsive
 * alias `--recursica_brand_layout-grids_{columns,column-gutter,row-gutter,margin}` inside `@media`
 * blocks, so this component reads only that alias and follows breakpoints with no JS. There are
 * deliberately no `columns`/`columnGutter`/`rowGutter`/`margin` inputs.
 *
 * ## Flex-wrap layout, not CSS Grid
 *
 * The column count is a CSS variable that changes per breakpoint. A column's `span` must be
 * clamped to that count (span 6 fills the row at 3 columns) and `grid-column: span N` cannot
 * take `min()`/`calc()`. Columns are therefore flex items sized with
 * `calc(min(span, columns) / columns …)` in `layout-grid-col.component.css`, with the grid's
 * `gap` tokens included in the math. `grow` is native here: grown columns take `flex-grow: 1`.
 *
 * ## Brand-layer exemption
 *
 * `layout-grids` tokens have no `ui-kit` layer in Forge's model (a grid is a page-layout
 * primitive, not a component), so this component reads `brand_layout-grids_*` directly.
 *
 * recursica-allow-brand: --recursica_brand_layout-grids_column-gutter
 * recursica-allow-brand: --recursica_brand_layout-grids_row-gutter
 * recursica-allow-brand: --recursica_brand_layout-grids_columns
 * recursica-allow-brand: --recursica_brand_layout-grids_margin
 */
@Component({
  selector: "rec-layout-grid",
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./layout-grid.component.css",
  template: `
    <div
      class="root"
      [attr.data-grow]="grow ? '' : null"
      [style.justify-content]="justify ?? null"
      [style.align-items]="align ?? null"
    >
      <ng-content />
    </div>
  `,
})
export class LayoutGridComponent {
  /** Let columns grow to fill the remaining width of their row. */
  @Input() grow = false;
  /** `justify-content` for the row of columns. */
  @Input() justify?: string;
  /** `align-items` for the row of columns. */
  @Input() align?: string;
}
