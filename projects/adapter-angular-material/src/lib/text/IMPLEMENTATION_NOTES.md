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

## `component`: `p` (default), `span`, `label`, `div`

`rec-text` renders a `<p>` by default. The `component` input switches the root
to `span` (inline text), `label` or `div`, so Text does not produce invalid
markup such as a `<p>` inside a `<p>` or a `<button>`. A custom element cannot
change its own tag, so the template renders one root per allowed element from a
shared content template. Typography, `color` and `emphasis` apply the same on
every element.

The stub's first-pass guess also included a `weight: string` input; the real
reference has no such prop (weight is owned by the `variant`'s typography
class), so it isn't built.

## Text never renders `h1` to `h6`

Heading levels belong to `rec-heading` alone: Recursica and Forge define and
style `h1` to `h6`, and `rec-heading` renders them with fixed styles. Text covers
all other text, and its variants can extend the Recursica definitions. So
`component="h1"` to `component="h6"` throws
(`rec-text cannot render <h2>. Use <rec-heading> for semantic h1-h6.`), as does
any element outside `p`, `span`, `label` and `div`. This matches the React
adapter's `Text`.

## Verification

**Real signal, this session**: fresh `ng build`, `tsc --noEmit`, and
`eslint` all clean. Both golden-matching stories (Default,
StaticVariations) confirmed registered and compiling with zero webpack
errors in a live Storybook dev server (port 6007, isolated from the
developer's own 6006 instance).

**Not done, same flag as every component built this session**: no
browser/Playwright tooling available, so the actual rendered typography
was reasoned from the CSS, not visually verified.

## Passthrough

| Input                                                                                                    | Forwarded to                            | Notes                                        |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------- | -------------------------------------------- |
| `ariaLabel` / `aria-label`, `ariaLabelledby` / `aria-labelledby`, `ariaDescribedby` / `aria-describedby` | rendered `p` / `span` / `label` / `div` | Via `RecursicaAriaLabelling`.                |
| `id`                                                                                                     | rendered element                        | Via `RecursicaElementId`; host `id` cleared. |

Withheld:

- `size`, `inherit`, `inline`, `gradient`: tokens own them or not applicable
