# Layer — Implementation Notes

**Status**: real implementation (`docs/CREATING_AN_ADAPTER.md` step 10),
built ahead of the other 46 (still stubs) — see
`docs/ADAPTER_INTEGRATION_REPORT.md` Crosscutting Finding A / Q10. Everything
else in this adapter (component theming, `RecursicaThemeProvider`, and by
extension every real component built on top of it) depends on this one
existing and working correctly.

## Why this exists here at all (not re-exported)

Every other Recursica adapter gets `Layer` for free from
`@recursica/adapter-common`. That package is React-only (it depends on
`react`/`react-dom` as hard peers), so it cannot be a dependency of an
Angular library — see `docs/ADAPTER_INTEGRATION_REPORT.md` Crosscutting
Finding A. This component is a from-scratch Angular port of the real React
source, not a wrapper around a shared package.

## What was ported, and from where

Source of truth (`recursica` monorepo, read directly, not summarized):

- `packages/adapter-common/src/components/Layer/Layer.tsx`
- `packages/adapter-common/src/components/Layer/Layer.module.css`
- `packages/adapter-common/src/components/Layer/RecursicaLayerProps.ts`

Ported faithfully:

- Root element carries `data-recursica-layer="<0|1|2|3>"`, omitted entirely
  when `contentsOnly` is true (React did this via conditional prop spread;
  Angular does it via `[attr.data-recursica-layer]="contentsOnly ? null : layer"`
  — binding an attribute to `null` removes it, the direct Angular idiom for
  "conditionally omit this attribute").
- `<ng-content />` in place of React's `children`.
- `.root` CSS: `display: block` and `border-style: solid` hardcoded
  unconditionally (no token) — carried over verbatim, including the
  original's own code comments explaining why (no token exists for either;
  `display: block` is required so the box can receive layer padding/
  background at all).
- `.root[data-recursica-layer="N"]` blocks for N = 0–3, reading
  `background-color`/`color`/`border-color`/`border-width`/`border-radius`/
  `box-shadow`/`padding` from the exact `--recursica_brand_layer_N_*`
  variable names in `recursica_variables_scoped.css` (confirmed against
  that file directly, not assumed from the React CSS alone — variable names
  match exactly).
- `contentsOnly` variant: `display: contents`, `border-style: unset`, no
  data attribute — same class name (`contents`) as the React source, for
  direct traceability between the two implementations.

**No UI-kit dependency**: this component has zero Angular Material
involvement — pure Recursica plumbing, so there's no "how does Material do
this differently" design question to resolve, only a React→Angular idiom
translation.

## Angular-idiom decisions

- **Element selector + inner `<div class="root">` template**, not a host-
  binding-only component. `rec-layer` renders as a custom element wrapping a
  single real `<div>`; this matches the `.root`-class convention every other
  component in this adapter uses (`docs/STYLING_SYSTEM.md` §3) and keeps the
  CSS a near-identical line-for-line port of the React `.module.css` (same
  selectors, same class names), rather than restructuring around Angular
  host bindings for a marginal DOM-node savings.
- **`ViewEncapsulation.Emulated`** (explicit, matching the stub convention
  and `docs/STYLING_SYSTEM.md` §3) — Angular's compiler scopes `.root` and
  the attribute-selector blocks with a generated `_ngcontent-<hash>`
  automatically; no CSS Modules equivalent exists or is needed.
- **`@Input({ required: true }) layer!: 0 | 1 | 2 | 3`** — the React prop was
  required (no default), so the Angular input is marked `required` too
  rather than given a default value, to keep the same "caller must specify"
  contract.

## Verification

Confirmed structurally correct AND actually rendering real, non-default
colors — see `../theme-provider/IMPLEMENTATION_NOTES.md`'s "Verification"
section for the full writeup shared by both components: how the token CSS
got wired into Storybook (`angular.json`'s `storybook`/`build-storybook`
architect targets' own `styles` array, not `preview.ts` — a plain import
there was tried first and failed with a webpack loader error), the
`index.json` story-id check, and a table of real computed
`background-color`/`color`/`border` values read via a headless-Chromium
check per layer (0–3) and per theme (light/dark), confirming e.g. layer 1's
`border-width` resolves to a real `2px` (not `0px`) and light vs. dark
correctly inverts background/text color.
