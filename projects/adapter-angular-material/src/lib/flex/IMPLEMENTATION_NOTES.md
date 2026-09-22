# Flex — Implementation Notes

**Status**: REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

## Genuinely does not exist — re-confirmed, not carried over

The stub's own `IMPLEMENTATION_NOTES.md` already confirmed `Category: DOES
NOT EXIST` (`@angular/cdk/layout` only offers `BreakpointObserver`/
`MediaMatcher`, no markup/CSS). Re-confirmed at build time.

## No design-system CSS at all — a pure passthrough

The reference's own `Flex.module.css` is empty ("Mantine handles flex,
gap, align, justify. No intrinsic design-system styles required for pure
layout wrappers.") — `Flex.tsx` applies every prop as literal inline CSS
via Mantine's `Flex`, with no default beyond `direction: row`. This
component reproduces that directly via host style bindings, no inner
wrapper `<div>` — the host element itself is the flex container.

## `RecursicaOverStyled` gate skipped

Confirmed by reading `Flex.tsx`'s own doc comment: layout primitives don't
use the `overStyled` escape hatch. This component has no wrapped element to
protect either way — a caller's own `class`/`[style]` on `<rec-flex>`
already reaches the host directly via ordinary Angular host binding.

## `gap`/`rowGap`/`columnGap`: shared `resolveSpacing` utility

`utils/recursica-spacing.ts` is a direct port of the reference's own
`SPACING_MAP`/`mapLayoutProps` (`filterStylingProps.ts`) — shared by
`Flex`/`Group`/`Stack`/`Grid`, all of which need the identical
"`rec-*` token or raw CSS value" resolution.

## Verification

**Real signal, this session**: fresh `ng build`, `tsc --noEmit`, and
`eslint` all clean. All 3 golden-matching stories (Default,
StaticGapSmallColumn, StaticGapLargeRow) confirmed registered and
compiling with zero webpack errors in a live Storybook dev server (port
6007, isolated from the developer's own 6006 instance).

**Not done, same flag as every component built this session**: no
browser/Playwright tooling available, so the actual rendered flex layout
was reasoned from the code, not visually verified.
