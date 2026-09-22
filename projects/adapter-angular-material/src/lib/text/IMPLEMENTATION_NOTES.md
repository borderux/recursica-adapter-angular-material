# Text — Implementation Notes

**Status**: REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

## Genuinely does not exist — same finding as `Heading`

The stub's own `IMPLEMENTATION_NOTES.md` already confirmed `Category: DOES
NOT EXIST` (Material's typography system is Sass mixins only, no
importable component). Re-confirmed at build time. Renders a native `<p>`
with a `recursica_brand_typography_{variant}` class — the same
pre-existing global utility-class family `Heading` consumes (confirmed:
`.recursica_brand_typography_body`/`body-small`/`caption`/`overline`/
`subtitle`/`subtitle-small` all already exist in
`recursica_variables_scoped.css`).

## No polymorphism, no `weight` input from the stub's own guess

Same reasoning as `Avatar`/`Badge`/`Heading` for skipping
`createPolymorphicComponent` — no other component in this adapter offers
it. The stub's own first-pass guess included a `weight: string` input; the
real reference has no such prop (confirmed by reading `Text.tsx`
directly — weight is fully owned by the `variant`'s own typography class),
so it isn't built here either.

## Verification

**Real signal, this session**: fresh `ng build`, `tsc --noEmit`, and
`eslint` all clean. Both golden-matching stories (Default,
StaticVariations) confirmed registered and compiling with zero webpack
errors in a live Storybook dev server (port 6007, isolated from the
developer's own 6006 instance).

**Not done, same flag as every component built this session**: no
browser/Playwright tooling available, so the actual rendered typography
was reasoned from the CSS, not visually verified.
