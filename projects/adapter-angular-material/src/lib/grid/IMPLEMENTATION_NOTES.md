# Grid — Implementation Notes

**Status**: REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

## Genuinely does not exist — re-confirmed, `MatGridList` false-friend confirmed too

The stub's own `IMPLEMENTATION_NOTES.md` already confirmed `Category: DOES
NOT EXIST`, flagging `MatGridList`/`MatGridTile` as a false-friend name
match (Material's historical fixed-row-height photo/tile masonry widget,
not a general CSS Grid primitive). Re-confirmed at build time — no
adoption/rejection call to make since nothing real to adopt.

## Built on real CSS Grid, not a port of Mantine's flexbox internals

The reference's own `Grid`/`Grid.Col` are built on Mantine's `Grid`, which
internally uses flexbox plus a negative-margin/padding trick to fake gutter
math (confirmed by reading `GRID_IMPLEMENTATION_NOTES.md`'s own
`.root.root`/`.inner.inner`/`.col.col` doubled-specificity-selector
section). There's no Mantine stylesheet here to fight for specificity
against, so this component uses real CSS Grid (`display: grid`,
`grid-template-columns: repeat(columns, minmax(0, 1fr))`, `grid-column:
span N`) directly — simpler and more correct than replicating Mantine's own
internal workaround for a problem that doesn't exist in this adapter.

## Real design-token schema divergence found — not a simplification

The reference's `Grid.tsx` reads
`--recursica_brand_layout-grids_default_{columns,column-gutter,row-gutter,margin}`
for its defaults (confirmed both in the source and its own
`GRID_IMPLEMENTATION_NOTES.md`). **This repo's own
`recursica_variables_scoped.css` has no `default` variant of that token
family at all** — only `desktop`/`tablet`/`mobile` (confirmed by grepping
directly). This is a real schema difference between the two adapters'
token exports, not something invented here. Since no golden story in this
adapter's own corpus exercises responsive breakpoint-driven gutter/margin
switching, `desktop`'s values are used as the single non-responsive
default — flagged as a substitution, not presented as if `default` tokens
exist. `columns` still defaults to the literal number `6`, matching the
reference (it has no CSS-variable equivalent in Mantine either).

## Responsive `span`/`offset`/`visibleFrom`/`hiddenFrom`: CSS custom properties + `@media`

`GridColComponent` sets one CSS custom property per breakpoint directly on
its host (`--col-span-base`/`--col-span-xs`/etc.); `grid.component.css`
resolves the effective span/offset at each breakpoint via `@media
(min-width: ...)` blocks, each reading whichever variable is actually set
and falling back to the next-smaller breakpoint's resolved value — the
same "mobile-first, override upward" cascade Mantine's own responsive
props follow. Breakpoint values (`36em`/`48em`/`62em`/`75em`/`88em` for
xs/sm/md/lg/xl) are Mantine's own hardcoded defaults (confirmed in
`@mantine/core`'s compiled `styles.css`), reused for the same reason
`Container`'s size scale reuses them — no Recursica breakpoint token
exists to reference instead.

## `grow`: accepted as an input, not implemented — a real, flagged gap

Mantine's `grow` redistributes remaining width among only the _last,
incomplete_ row's items once the true wrapped-row boundaries are known —
information plain CSS Grid with fixed `span` columns doesn't expose
without either JS layout measurement or switching the whole grid to a
content-driven `auto-fit` track model (which would break the "span N of
`columns`" sizing every non-last row depends on). Rather than ship a CSS
approximation likely to diverge from the actual golden in ways not worth
guessing at, `grow` is reflected as `[data-grow]` for a future real
implementation but has no CSS behavior yet.

## Stories: two reference stories intentionally not mirrored

- `Grow` — not mirrored, since `grow` has no implemented behavior (see
  above); mirroring the story would silently demonstrate a no-op.
- `ResponsiveSizes` — not mirrored. The reference's own comment on this
  story says it exists purely so `mui-adapter` has a same-named counterpart
  to diff against; `ResponsiveSpans` already covers the same underlying
  behavior (`Grid.Col` has no separate `size` prop, only `span`).

**Also noted, not investigated further**: the reference repo has a golden
screenshot (`ui-kit-grid--row-gutter.png`) with no corresponding story in
the current `Grid.stories.tsx` at all — an orphaned golden in the
reference itself, not something this adapter needs to reproduce.

## Verification

**Real signal, this session**: fresh `ng build`, `tsc --noEmit`, and
`eslint` all clean. All 5 golden-matching stories (Default,
ResponsiveSpans, Offset, CustomColumnCount, VisibleHiddenFrom) confirmed
registered and compiling with zero webpack errors in a live Storybook dev
server (port 6007, isolated from the developer's own 6006 instance).

**Not done, same flag as every component built this session**: no
browser/Playwright tooling available, so the actual responsive `@media`
behavior, span/offset math, and visibility toggling were reasoned from the
CSS, not visually verified at different viewport widths.
