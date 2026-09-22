import { Component, Input, ViewEncapsulation } from "@angular/core";
import { resolveSpacing } from "../utils/recursica-spacing";

/**
 * Recursica `Grid` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). The stub's
 * own `IMPLEMENTATION_NOTES.md` already confirmed `Category: DOES NOT
 * EXIST`, flagging `MatGridList`/`MatGridTile` as a false-friend name match
 * (Material's historical fixed-row-height photo/tile masonry widget, not a
 * general CSS Grid primitive) — re-confirmed, not assumed. Built directly
 * on real CSS Grid (`display: grid`), not a port of Mantine's own
 * flexbox-plus-negative-margin `Grid` internals — there's no Mantine
 * stylesheet here to fight for specificity, so the simpler, native CSS
 * Grid approach is used instead of replicating Mantine's own
 * implementation details. See `grid-col.component.ts`'s own class doc
 * comment for the responsive span/offset/visibility design.
 *
 * ## `columns`/`columnGutter`/`rowGutter`/`margin` — real design-token divergence found
 *
 * The reference's own `Grid.tsx` (confirmed by reading it directly,
 * *and* its `GRID_IMPLEMENTATION_NOTES.md`) reads
 * `--recursica_brand_layout-grids_default_{columns,column-gutter,row-gutter,margin}`
 * for its defaults. **This repo's own `recursica_variables_scoped.css` has
 * no `default` variant of that token family at all** — only
 * `desktop`/`tablet`/`mobile` (confirmed by grepping directly). This is a
 * real schema difference between the two adapters' token exports, not a
 * simplification made here. Since no golden story in this adapter's own
 * corpus exercises responsive breakpoint-driven gutter/margin switching,
 * `desktop`'s values are used as the single non-responsive default —
 * flagged honestly as a substitution, not presented as if `default` tokens
 * exist.
 *
 * `columns` still defaults to the literal number `6` (same as the
 * reference — it has no CSS-variable equivalent in Mantine either, baked
 * in as a JS default there too).
 *
 * ## `grow`: accepted, not implemented — a real, flagged gap
 *
 * Mantine's `grow` redistributes remaining width among only the *last,
 * incomplete* row's items once the true wrapped-row boundaries are known —
 * information plain CSS Grid with fixed `span` columns doesn't expose
 * (there's no selector for "the items in the final wrapped row" without
 * either JS layout measurement or switching the whole grid to a
 * content-driven `auto-fit` track model, which would break the
 * "span N of `columns`" sizing every non-last row depends on). Rather than
 * ship a CSS approximation likely to diverge from the actual golden
 * (`ui-kit-grid--grow.png`) in ways not worth guessing at, `grow` is
 * accepted as an input (reflected as `[data-grow]` for a future real
 * implementation to hook into) but has no CSS behavior yet — flagged
 * honestly in `IMPLEMENTATION_NOTES.md`, not silently faked.
 */
@Component({
  selector: "rec-grid",
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./grid.component.css",
  host: {
    "[style.margin]": "resolvedMargin ?? null",
  },
  template: `
    <div
      class="inner"
      [attr.data-grow]="grow ? '' : null"
      [style.grid-template-columns]="'repeat(' + columns + ', minmax(0, 1fr))'"
      [style.column-gap]="resolvedColumnGutter"
      [style.row-gap]="resolvedRowGutter"
      [style.--rec-grid-columns]="columns"
    >
      <ng-content />
    </div>
  `,
})
export class GridComponent {
  @Input() columns = 6;
  @Input() columnGutter?: string;
  @Input() rowGutter?: string;
  @Input() margin?: string;
  @Input() grow = false;

  get resolvedColumnGutter(): string | undefined {
    return this.columnGutter
      ? resolveSpacing(this.columnGutter)
      : "var(--recursica_brand_layout-grids_desktop_gutter)";
  }

  get resolvedRowGutter(): string | undefined {
    return this.rowGutter
      ? resolveSpacing(this.rowGutter)
      : "var(--recursica_brand_layout-grids_desktop_gutter)";
  }

  get resolvedMargin(): string | undefined {
    return this.margin ? resolveSpacing(this.margin) : undefined;
  }
}
