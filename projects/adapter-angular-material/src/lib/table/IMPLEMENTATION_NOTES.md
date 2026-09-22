# Table — Implementation Notes

**Status**: REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

## `MatTable`/`MatTableDataSource` re-investigated and rejected — wrong shape, not just wrong candidate

The stub's own `IMPLEMENTATION_NOTES.md` flagged `MatTable`/
`MatTableDataSource` (+ `MatSort`/`MatPaginator`) as a real, stable
candidate, with the real work being "a headless, directive-composition-heavy
API... rather than a single `<Table data={...} columns={...}>` drop-in".
Re-investigated by reading `Table.tsx` directly — that framing itself was
wrong: the reference is **not** a `columns`/`dataSource`-driven table at
all. It's a thin compound wrapper around plain HTML table markup
(`Table`/`Thead`/`Tbody`/`Tr`/`Th`/`Td`/`Tfoot`/`Caption`/`ScrollContainer`,
each just a styled native element plus a couple of Recursica-specific data
attributes — confirmed by reading `Table.tsx` and every golden story in
`Table.stories.tsx` directly). `MatTable`'s entire value proposition —
column definitions, a `DataSource`, sort/paginate glue — solves a problem
this reference doesn't have. Adopting it would mean inventing a
`columns`/`dataSource` API this design system's own reference component
doesn't expose, then translating every golden story's literal
`<Table.Tr><Table.Td>` composition back into that shape for no benefit.

**Decision**: hand-built — plain elements with Recursica token styling, no
Material adoption, the same category of decision `Card`/`Flex`/`Grid`
already made for structural, non-interactive primitives elsewhere in this
adapter.

## `rec-table-*` elements styled `display: table-*`, not attribute selectors on real `<tr>`/`<th>`/`<td>` tags

A first instinct here (implemented, then reverted) was an attribute
selector on the real semantic tag (`tr[recTableTr]`, `td[recTableTd]`,
matching `MatRow`'s own `selector: 'mat-row, tr[mat-row]'`), reasoning that
a `<rec-table-tr>` custom element nested between `<rec-table-tbody>` and
`<rec-table-td>` would trigger browser HTML-parsing "foster parenting"
(invalid table content silently relocated out of the table). Two real
findings killed that approach:

1. **Live, confirmed lint failure**: this repo's own `eslint.config.mjs`
   enforces `@angular-eslint/component-selector: { type: "element", prefix:
"rec" }` repo-wide for real, published components — no exemption the
   way `form-control-wrapper.stories.ts`'s own `input[recDemoFormControl]`
   demo-only control gets (that lives in Storybook-only code a separate
   config block exempts). `eslint` flagged all 6 attribute-selector
   sub-components on the first real lint pass.
2. **The foster-parenting concern itself doesn't apply**: that's a
   _parsing_-algorithm quirk (tokenizing HTML text into a DOM tree) —
   Angular never parses this template as an HTML string; it compiles to
   imperative `createElement`/`appendChild` calls, with no text-parsing/
   tree-construction pass at all.

**Fix**: every sub-component uses a real `rec-table-*` element selector
with `:host { display: table-header-group|table-row-group|
table-footer-group|table-row|table-cell }` — the CSS table-layout
algorithm's anonymous-box generation keys off computed `display` values,
not tag names, so this lays out identically to a real `<table>` regardless
of the underlying custom-element tag. Each sub-component's own `host: {
role: '...' }` restores the implicit ARIA semantics (`rowgroup`/`row`/
`columnheader`/`cell`) a real `<thead>`/`<tr>`/`<th>`/`<td>` would have
carried automatically — a CSS `display` override does not imply an ARIA
role, so it's set explicitly rather than assumed to follow.

## Styling: each sub-component owns its own scoped `:host`/`:host-context()` CSS, not shared descendant selectors

The reference's own `Table.module.css` uses plain descendant selectors
from a single `.root` class on the `<table>` element (`.root th`, `.root
tbody tr[data-selected] td`, etc.) — that only works because Mantine
renders one flat DOM tree with no component-boundary CSS scoping. This
adapter's sub-components are separate Angular components, each with its
own `ViewEncapsulation.Emulated` hash — `TableThComponent`'s own CSS
reproduces the reference's row-level rules (`tr[data-selected]`,
`tr:hover`, `tr:nth-of-type(even)`, `tfoot td`) via `:host-context()`
selectors that walk up past `TableTrComponent`'s/`TableTfootComponent`'s
own component boundaries to the ancestor `rec-table-tr`/`rec-table-tfoot`
elements' own state — the same ancestor-chain-crossing technique this
adapter's `[data-recursica-theme]` gating already relies on throughout,
applied here to component-internal state instead of a document-level
theme attribute.

## `Table.Td` reused inside `Table.Tfoot` — one component, two token sets

Confirmed by reading `Table.stories.tsx`'s own `CurrencyColumnWithFooter`
story directly: the footer row uses the same `<Table.Td>` as the body,
not a separate footer-cell component. `TableTdComponent`'s own CSS applies
the default `table-cell_*` tokens, then a `:host-context(rec-table-tfoot)`
block overrides them with `table-footer_*` tokens when the ancestor is a
footer — reproducing the reference's own single-component, dual-context
approach rather than inventing a separate `TableTfootTdComponent` with no
reference precedent.

## Not built: `Table.Caption`/`Table.ScrollContainer`

Confirmed by reading `Table.stories.tsx` directly: all 4 golden stories
(Default, SortedColumn, SelectedAndDisabledRows, CurrencyColumnWithFooter)
use only `Table`/`Thead`/`Tbody`/`Tr`/`Th`/`Td`/`Tfoot` — neither appears
in any of them. Building two additional sub-components with no golden
coverage would be speculative scope, the same reasoning `Modal`'s/
`HoverCard`'s own granular sub-components were skipped for elsewhere in
this adapter.

## Verification

**Real signal, this session**: fresh `ng build`, `tsc --noEmit`, and
`eslint` clean — but not first pass. The initial attribute-selector design
(`tr[recTableTr]`, etc.) built and typechecked cleanly but failed `eslint`
with 6 real `@angular-eslint/component-selector` errors, caught and fixed
by rewriting every sub-component as a `rec-table-*` element selector with
an explicit `display: table-*` override — a real course-correction driven
by this repo's own lint config, not a theoretical concern. All 4
golden-matching stories (Default, SortedColumn, SelectedAndDisabledRows,
CurrencyColumnWithFooter) confirmed registered and compiling with zero
webpack errors in a live Storybook dev server (port 6007, isolated from
the developer's own 6006 instance).

**Not done, same flag as every component built this session**: no
browser/Playwright tooling available, so the actual CSS table-layout
rendering of custom elements with `display: table-*` (versus a real
`<table>`'s native table elements), row-hover/striping/selection visual
states, and screen-reader announcement of the `role="row"`/`"columnheader"`/
`"cell"` overrides were reasoned from the code and CSS/ARIA spec behavior,
not click- or screen-reader-verified.
