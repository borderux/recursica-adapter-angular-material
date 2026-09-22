# Heading — Implementation Notes

**Status**: REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

## Genuinely does not exist — the stub's own suggested shape is what got built

The stub's own `IMPLEMENTATION_NOTES.md` confirmed `Category: DOES NOT
EXIST` (Sass typography mixins only, no component-level typography
primitive in Material at all) and suggested "`<rec-heading [order]>`
rendering a native `<h1>`–`<h6>` with Recursica's own typography classes" —
re-confirmed at build time, and exactly what this component does.

## `.recursica_brand_typography_h{order}` — a pre-existing global utility class

`Heading.tsx` applies `recursica_brand_typography_h${order}` as a plain
class name, not a component-scoped CSS variable. Confirmed these classes
already exist in this adapter's own `recursica_variables_scoped.css`
(`.recursica_brand_typography_h1` through `h6`) — real rules already
shipping globally, nothing this component needs to define itself. The one
real exception to this adapter's usual `:host-context([data-recursica-theme])`-gated
per-component token-CSS pattern, because that's genuinely what the
reference does too — not a shortcut taken here.

## Six `@switch` branches instead of a dynamic tag name

Angular templates can't bind an element's tag name dynamically. Same
category of constraint `Avatar`'s three mutually-exclusive display-mode
branches document for itself — six near-identical `<h1>`–`<h6>` branches
are the direct translation.

## `text-wrap: balance`, nothing else — no margin reset added

Ported the reference's own single hardcoded declaration
(`text-wrap: balance`, a UX decision per its own doc comment, not a design
token) exactly. Deliberately did **not** add a `margin: 0` reset even
though native `<h1>`–`<h6>` carry real browser default margins — the
reference's own `Heading.module.css` doesn't reset it either, so adding
one here would be an unrequested embellishment beyond what's being ported.

## Verification

**Real signal, this session**: fresh `ng build`, `tsc --noEmit`, and
`eslint` all clean. Both golden-matching stories (Default,
StaticVariations) confirmed registered and compiling with zero webpack
errors in a live Storybook dev server (port 6007, isolated from the
developer's own 6006 instance).

**Not done, same flag as every component built this session**: no
browser/Playwright tooling available, so the actual rendered typography
was reasoned from the CSS, not visually verified.
