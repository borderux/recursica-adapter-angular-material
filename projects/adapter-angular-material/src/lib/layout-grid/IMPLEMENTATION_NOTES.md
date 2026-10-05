# LayoutGrid — Implementation Notes

**Status**: REAL implementation. Named `Grid` before 2026-10-05; follows recursica-adapter-mantine-v8's
`LayoutGrid` (2026-10-02, see its `LAYOUT_GRID_IMPLEMENTATION_NOTES.md`).

## No Material equivalent

`MatGridList`/`MatGridTile` are a false friend (fixed-row-height tile widget). Built on real CSS Grid.

## Forge contract

Forge always emits a default grid (columns, column-gutter, row-gutter, margin) in the CSS and in
`recursica_manifest.json`; extra breakpoints are overrides. Forge emits a responsive alias per var
(`--recursica_brand_layout-grids_{columns,row-gutter,column-gutter,margin}`), redefined inside
`@media` blocks, so the grid follows breakpoints with no JS. Nothing here has a fallback value.

## No integrator-facing layout props

`columns`, `columnGutter`, `rowGutter` and `margin` inputs were removed (they had been added on the
old `Grid` and defaulted to a `desktop_gutter` token that no longer exists). They are design-system
managed. For an arbitrary N-column grid, use plain CSS Grid.

## `rec-layout-grid-col`

`span`/`offset` (number or `{ base, xs, sm, md, lg, xl }`) are relative to Forge's current column
count; `span` is clamped to it (`grid-column: span min(span, columns)`). An omitted span is 12, like
Mantine. Responsive keys and `visibleFrom`/`hiddenFrom` switch at Mantine's default breakpoint widths
(`36/48/62/75/88em`), which Forge never edits; `breakpointsFromRecManifest(manifest)` gives the
widths where Forge's own grids switch. The column styles live in `layout-grid-col.component.css`
using `:host` (an element selector in a shared stylesheet never matched the col's own host).

## `grow`: accepted, not implemented

Unchanged from the old `Grid`: plain CSS Grid with fixed spans can't redistribute only the last
incomplete row. The `Grow` and `ResponsiveSizes` stories are therefore not mirrored (and the reference
dropped its Grid stories with the rename).

## Stories

A single `Default` story, as in the reference: two rows of single-column cells, `columns` from
`brand.layout-grids.default.columns` in the manifest. Plain dashed swatches, not `rec-card` (Card's
token min-width exceeds one column).
