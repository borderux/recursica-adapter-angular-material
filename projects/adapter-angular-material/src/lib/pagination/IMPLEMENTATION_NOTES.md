# Pagination — Implementation Notes

**Status**: REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

## `Category: REQUIRES WORK` re-confirmed — no `MatPaginator` adoption

The stub's own `IMPLEMENTATION_NOTES.md` already flagged `MatPaginator` as
purpose-built for a data-table (`length`/`pageSize`/`pageSizeOptions` +
prev/next + an optional page-size `<mat-select>`), not a generic numbered-
page-pill control the way Mantine's `Pagination` is. Re-confirmed at build
time by reading the compiled `@angular/material/paginator` source — hand-
built instead, no adoption.

## Page-range/ellipsis math: a direct port of `@mantine/hooks`' `usePagination`

`pagination-range.ts`'s `computePaginationRange` is read directly from
`@mantine/hooks`' compiled `use-pagination.mjs` source, not reimplemented
from a description of "reasonable" pagination behavior — the reference's
own `<Pagination total={10} />` golden story renders against this exact
algorithm, so reproducing it verbatim (siblings=1, boundaries=1 defaults)
is required for parity, not just a nice-to-have.

## Only the top-level `<Pagination>` shape — confirmed, not the compound `Root`/`Items`/etc.

Confirmed by reading `Pagination.stories.tsx` directly: all 3 golden
stories use only `<Pagination total withEdges withControls withLabels>` —
none exercise the reference's own `Pagination.Root`/`.Items`/`.Control`/
`.Dots`/`.Next`/`.Previous`/`.First`/`.Last` "advanced composition"
sub-components. Building those with no golden coverage would be
speculative scope, the same reasoning `Modal`'s and `HoverCard`'s own
granular sub-components were skipped for.

## Uncontrolled value: `signal(1)` seeded in `ngOnInit`, not a field initializer

Same established convention as `checkbox`/`radio`/`text-area`/etc. in this
adapter — seeding `_uncontrolledValue` from `defaultValue` inside
`ngOnInit()` rather than a field initializer, since `@Input()` values
aren't available yet when field initializers run.

## Icon rendering: a real `<ng-template>`, not string interpolation

An early draft tried a `renderIcon(type)` method returning SVG markup for
`{{ }}` interpolation — Angular's interpolation HTML-escapes the result
rather than parsing it as DOM, so this silently renders literal `<svg>`
text instead of an icon. Fixed with a shared `<ng-template #iconTpl
let-type>` containing real, static SVG markup, invoked via
`[ngTemplateOutlet]`/`[ngTemplateOutletContext]` at each of the four
navigation-button call sites.

## `iconPath()`/`iconLabel()` methods, not direct `Record` indexing in the template

`<ng-template let-type>` gives `type` an implicit `any` type — indexing
`Record<RecursicaPaginationIconType, string>` with an `any`-typed key
trips `noImplicitAny`'s TS7053 ("element implicitly has an 'any' type")
even through Angular's `$any()` cast, because the mapped `Record` type has
no index signature to fall back to. Resolved with two component methods
(`iconPath(type: string)`/`iconLabel(type: string)`) that perform the cast
(`type as RecursicaPaginationIconType`) inside ordinary TypeScript, where
an explicit `as` cast is unambiguous, instead of indexing directly in the
template expression.

## Styling: reuses Button's own tokens directly, no Material `--mat-*` bridge

Unlike `Button` (which wraps `matButton` and bridges Recursica tokens onto
Material's `--mat-button-*` custom properties), Pagination is hand-built —
there is no Material component underneath, so `pagination.component.css`
consumes `recursica_ui-kit_components_button_variants_*` tokens directly,
the same way the React reference's own `Pagination.module.css` does. Only
`recursica_ui-kit_components_pagination_properties_{item-gap,
colors_dots-color}` are Pagination-specific (confirmed against
`recursica_variables_scoped.css`).

**Real deviation from the reference**: `Pagination.module.css`'s
`.baseIcon` sizes off `--pagination-control-size`, a Mantine CSS custom
property that is never actually defined anywhere in the reference's own
source (a dead/unset token there too). Sized off the real Button
icon-size token (`recursica_ui-kit_components_button_variants_sizes_default_properties_icon`)
here instead of reproducing that gap.

## Verification

**Real signal, this session**: fresh `ng build`, `tsc --noEmit`, and
`eslint` all clean (after fixing the two real issues above — the
`Record` indexing TS7053s and the icon-template rewrite). All 3
golden-matching stories (Default, WithEdges, WithTextLabels) confirmed
registered and compiling with zero webpack errors in a live Storybook dev
server (port 6007, isolated from the developer's own 6006 instance).

**Not done, same flag as every component built this session**: no
browser/Playwright tooling available, so actual click-through paging,
ellipsis-range recalculation on click, and disabled-state boundary
behavior were reasoned from the ported algorithm and code, not
click-verified.
