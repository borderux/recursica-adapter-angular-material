import { Component, Input, ViewEncapsulation } from "@angular/core";

/**
 * Recursica `LayoutGrid` — Angular Material adapter (named `Grid` before 2026-10-05; mirrors
 * recursica-adapter-mantine-v8's 2026-10-02 rename).
 *
 * Built on real CSS Grid (`display: grid`); Material has no equivalent (`MatGridList` is a
 * false friend). Columns, column-gutter, row-gutter and margin are design-system-managed: they
 * come from Forge's responsive `--recursica_brand_layout-grids_*` aliases, which Forge redefines
 * per breakpoint inside `@media` blocks, so the grid follows breakpoints with no JS. There are no
 * `columns`/`columnGutter`/`rowGutter`/`margin` inputs. See `IMPLEMENTATION_NOTES.md`.
 */
@Component({
  selector: "rec-layout-grid",
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./layout-grid.component.css",
  template: `
    <div class="inner" [attr.data-grow]="grow ? '' : null">
      <ng-content />
    </div>
  `,
})
export class LayoutGridComponent {
  /** Accepted for parity with the reference; not implemented — see `IMPLEMENTATION_NOTES.md`. */
  @Input() grow = false;
}
