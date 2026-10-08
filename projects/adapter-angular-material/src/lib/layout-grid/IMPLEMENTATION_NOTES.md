# LayoutGrid — Implementation Notes

**Status**: REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). Replaces `Grid`, following
the Mantine adapter's rename (2026-10-02) and its `LAYOUT_GRID_IMPLEMENTATION_NOTES.md`.

## Material has nothing to adopt

`MatGridList`/`MatGridTile` is a false-friend name match (a fixed-row-height tile widget, not a
layout primitive). Hand-built.

## No integrator-facing layout props

Columns, column-gutter, row-gutter and margin are design-system-managed. Forge defines
`layout-grids` per breakpoint and redefines the responsive alias
`--recursica_brand_layout-grids_{columns,column-gutter,row-gutter,margin}` inside `@media` blocks, so
`LayoutGrid` reads only that alias and follows breakpoints with no JS. There are no `columns`,
`columnGutter`, `rowGutter` or `margin` inputs, and no fallback values (Forge always defines them).
The old `Grid` read `brand_layout-grids_desktop_gutter`; that token family is no longer used.

## Flex-wrap layout, not CSS Grid

The old `Grid` used `display: grid` with `grid-column: span N`. That cannot follow a per-breakpoint
column count: `span` takes only an integer literal, so it can't be clamped with `min()`. Columns are
now flex items whose basis is
`calc(colWidth * min(span, columns) + (min(span, columns) - 1) * gutter)`, where
`colWidth = (100% - (columns - 1) * gutter) / columns`. Offset is `(colWidth + gutter) * offset` as
`margin-inline-start`.

- An omitted `span` is 12 (like Mantine's `Grid.Col`), clamped to the current column count.
- `"auto"` shares leftover row width; `"content"` hugs its content.
- `span`/`offset` accept a `{ base, xs, sm, md, lg, xl }` map. `LayoutGridColComponent` resolves it
  mobile-first and sets `--col-*-<bp>` custom properties for every breakpoint on its host;
  `layout-grid-col.component.css` switches between them with `@media`. Breakpoints are Mantine's
  defaults (`36em`/`48em`/`62em`/`75em`/`88em`), since Recursica defines no breakpoint-name scale.
- `visibleFrom`/`hiddenFrom` and `order` are supported.
- `grow` is real now (grown columns get `flex-grow: 1; max-width: 100%`). `justify` and `align` map to
  `justify-content`/`align-items`.

## Not implemented

- Mantine's `type="container"` (container-query breakpoints).

## Brand-layer exemption

`layout-grids` tokens have no `ui-kit` layer in Forge's model, so this component reads
`brand_layout-grids_*` directly, with `recursica-allow-brand:` headers in `layout-grid.component.ts`.

## Stories

A single `Default` story, matching the Mantine adapter: 12 single-column cells (two rows at the
default 6 columns).

## Passthrough

Host aria and `id` attributes are cleared by host directives (`RecursicaAriaLabelling`, `RecursicaElementId`); the values are forwarded to the inner element.

| Input                                                                                                    | Forwarded to         | Notes |
| -------------------------------------------------------------------------------------------------------- | -------------------- | ----- |
| `ariaLabel` / `aria-label`, `ariaLabelledby` / `aria-labelledby`, `ariaDescribedby` / `aria-describedby` | inner `div.root` row |       |
| `id`                                                                                                     | inner `div.root` row |       |

`rec-layout-grid` now nulls the host `align` attribute so a static `align` no longer leaks to the host.

Withheld:

- `class` / `style`: React's open surface is not copied
- `rec-layout-grid-col`: host is the element, no passthrough
