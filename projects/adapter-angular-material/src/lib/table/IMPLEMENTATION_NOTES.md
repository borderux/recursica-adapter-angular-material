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

## Real bug found 2026-09-25: chained `:host-context()` silently drops the whole rule when the second argument is an element type

Matt reported "row height is not correct at all" and "table looks different
than mantine". Two distinct, compounding bugs, both found via live
Playwright verification against a running Mantine reference on port 6011
(not from reading source):

1. **Wrong padding token.** `table-td.component.css`'s base `:host`
   rule used `--recursica_ui-kit_components_table_properties_row-padding`/
   `_padding` — both hardcoded to `--recursica_brand_dimensions_general_none`
   (`0`) in `recursica_variables_scoped.css`. The reference's own
   `Table.module.css` also has this exact zero-padding rule (§1, a shared
   baseline for `th`+`td`), but then overrides it for body cells with a
   _more specific_ `.root tbody td` rule (§4) using the real
   `table-cell_properties_padding-vertical`/`-horizontal` tokens (mapped to
   non-zero globals). This adapter's `table-th`/`table-tfoot` cell CSS
   already used the correct final tokens directly; `table-td` (body cells)
   never got the §4 override ported at all — cells silently sat at the §1
   zero-padding baseline forever. Fixed by pointing the base rule at the
   correct tokens directly (no cascade-override step needed here, since
   each sub-component owns its own non-overlapping `:host`).

2. **A structural Angular compiler bug, much bigger than the padding fix.**
   Independently, the `SelectedAndDisabledRows` story's disabled row
   (`rec-table-tr[disabled]`) rendered with zero visual difference —
   `opacity: 1`, no dimming — despite `data-disabled="true"` being correctly
   set on the DOM and the CSS rule looking correct in source. Root-caused by
   grepping the actual **compiled** `<style>` tag content (not just
   `document.styleSheets`, which silently omits rules the browser failed to
   parse): any rule shaped `:host-context(A):host-context(B)` — two chained
   `:host-context()` calls, not one compound selector — where `B` is (or
   starts with) an element type selector (`rec-table-tr[data-disabled]`,
   `rec-table-tfoot`) compiles to a **syntactically invalid** candidate
   selector. Confirmed two different failure shapes depending on structure:

   - Flat chain: concatenates the first context's attribute directly against
     the second context's type name with no combinator —
     `[data-recursica-theme]rec-table-tr[data-disabled]` (an attribute
     selector immediately before a type selector, illegal — a type selector
     must come first in a compound selector).
   - Nested (`:host-context(A) { :host-context(B) {} }`): leaks Angular's own
     internal `ShadowCss` sentinel string, `-shadowcsshost-no-combinator`,
     directly into the compiled CSS.
   - Two chained contexts both starting with element types (`rec-table-tfoot`
     - `rec-table-tr[data-disabled]`): concatenates the two type names with
       no separator — `rec-table-tfootrec-table-tr[data-disabled]` (two type
       selectors can never share one compound selector).

   Since these live inside a plain (non-forgiving) comma-separated selector
   list, **one invalid candidate drops the entire rule** — not just the bad
   variant. This affected 5 rules in this file alone (disabled — both body
   and footer, the footer base/divider/currency rules) and was silently
   eating the _entire_ `Table.Tfoot`-specific styling and both disabled-cell
   states. It also affected two more files with the same chained-context
   shape: `tabs-list.component.css` (4 rules, all `[data-inverted]`
   variants — fixed via CSS nesting, since those chains are attribute-only
   on both sides and nesting alone resolved them) and — separately —
   confirmed present in principle wherever a similar shape exists project-wide
   (grepped: only these 2 components use this pattern at all).

   **Fix applied here**: dropped the redundant `:host-context([data-recursica-theme])`
   prefix from every rule that also needs an element-typed ancestor context,
   leaving a single un-chained `:host-context(element[...])` — the same
   shape the file's own (already-working) striped/selected/hover rules use.
   `--recursica_*` custom properties still resolve correctly via ordinary
   CSS inheritance regardless of whether this specific selector re-asserts
   the `[data-recursica-theme]` gate. **One case intentionally left broken**
   (documented inline at the bottom of `table-td.component.css`): a footer
   cell whose _row_ (not the cell itself) is disabled — chaining
   `rec-table-tfoot` and `rec-table-tr[data-disabled]` together hits the
   two-type-names-concatenated failure with no simple single-context
   workaround. No story exercises this combination; falls back to the
   plain body-cell disabled styling rather than nothing.

   **How to apply elsewhere**: before writing `:host-context(A):host-context(B)`
   in any component CSS in this adapter, check whether `B` is or starts with
   an element type selector. If so, don't chain — verify live (grep the
   compiled `<style>` tag text for the selector substring, not just
   "looks right" in a screenshot) rather than trusting the source.

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
