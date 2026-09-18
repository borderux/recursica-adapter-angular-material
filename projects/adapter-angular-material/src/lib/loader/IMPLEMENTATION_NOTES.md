# Loader — Implementation Notes

**Status**: real implementation (`docs/CREATING_AN_ADAPTER.md` step 10).
Built **before** `Button` even though the integration report lists Button
first in build order — the real React reference
(`recursica-adapter-mantine-v8`'s `Button.tsx`) composes `Loader` internally
for its loading state, so `Loader` had to exist first. See
`button.component.ts`'s doc comment / `IMPLEMENTATION_NOTES.md` for that
composition.

## Integration report findings (pre-implementation survey)

- **Category**: EASY
- **Angular Material / CDK candidate**: `MatProgressSpinner`/`MatSpinner` (`progress-spinner.d.ts`)
- **Notes**: `mode` (`determinate/indeterminate`), `value`, `diameter`, `strokeWidth`.

Re-verified against the real `.d.ts`/compiled source at implementation time
(this section supersedes the stub's first-pass guess):

## The real Recursica contract (`RecursicaLoaderProps`)

```ts
variant?: "oval" | "bars" | "dots";
size?: "sm" | "md" | "lg" | RecursicaSize; // RecursicaSize = "small"|"default"|"large"
animate?: boolean; // default true
```

`mode`/`value` (Material's determinate-progress concept) have **no
Recursica equivalent** and are never exposed — this component always
renders `oval`'s wrapped `MatProgressSpinner` with `mode="indeterminate"`.

## `bars`/`dots`: built for real

Checked both sides before deciding how to handle these two:

1. **Angular Material has no bars/dots spinner.** `MatProgressSpinner` /
   `MatSpinner` (`node_modules/@angular/material/progress-spinner.d.d.ts`)
   render a single SVG `<circle>` — there is no alternate shape input.
2. **`recursica_variables_scoped.css` has no bars/dots token backing
   either.** `grep -o "recursica_ui-kit_components_loader[a-z_-]*"` against
   the real generated token CSS returns exactly 4 token families, all
   variant-agnostic or oval-ring-shaped: `properties_indicator-color` and,
   per size, `properties_size`, `properties_thickness-size`,
   `properties_border-radius`. There is no `variants_bars_*`/
   `variants_dots_*` token tree at all — unlike Button's
   `variants_styles_{solid,outline,text}_*`, which does exist per variant.

Per direct instruction from the human running this project: build `bars`/
`dots` for real anyway, in plain CSS, matching the real **underlying
Mantine primitive's own** look (not the Recursica React wrapper — the
Mantine primitive itself, since that's what "the style" actually is; the
Recursica wrapper just forwards `type` straight through to it with no
changes). Read directly, not guessed:

- `@mantine/core/esm/components/Loader/loaders/Bars.mjs`: a `<span>`
  (`classes.barsLoader`) containing exactly 3 `<span class="bar">` children.
- `@mantine/core/esm/components/Loader/loaders/Dots.mjs`: same shape, 3
  `<span class="dot">` children.
- `@mantine/core/styles/Loader.css`'s compiled rules for both (reproduced
  here, real values, not paraphrased):
  - **Bars**: container `position: relative; width/height: var(--loader-size); display: flex; gap: calc(var(--loader-size) / 5)`. Each bar: `flex: 1; background: var(--loader-color); border-radius: 2px; animation: <scale/opacity keyframe> 1.2s cubic-bezier(0, 0.5, 0.5, 1) infinite`, with `animation-delay` `-240ms`/`-120ms`/`0` on bars 1/2/3 respectively. Keyframe: `0% { scale(0.6); opacity: 0 } 50%,100% { scale(1) }`.
  - **Dots**: container `display: flex; justify-content/align-items: center; gap: calc(var(--loader-size) / 10); position: relative; width/height: var(--loader-size)`. Each dot: `width/height: calc(var(--loader-size) / 3 - var(--loader-size) / 15); border-radius: 50%; background: var(--loader-color); animation: <scale/opacity keyframe> 0.8s infinite linear`, with only the **middle** dot (`:nth-child(2)`) getting `animation-delay: 0.4s` — the other two are unstaggered. Keyframe: `0%,100% { scale(1); opacity: 1 } 50% { scale(0.6); opacity: 0.5 }`.

`loader.component.css`'s `.barsLoader`/`.bar`/`.dotsLoader`/`.dot` rules
reproduce these exactly (same proportional `calc()` sizing, same delays,
same keyframe shapes), fed by this component's own `--loader-size`/
`--loader-color` custom properties (declared on `.root` from the real
`indicator-color`/per-size `size` tokens — the same tokens `oval` uses,
since there's no bars/dots-specific token tree to read instead) rather than
Mantine's own. `border-radius: 2px` on bars and `50%` on dots are Mantine's
own literal values, not Recursica tokens — carried over as-is per the
instruction to match Mantine's look, and noted here as intentional
hardcodes (consistent with `layer.component.css`'s established
"HARDCODE" comment convention).

Since there's no single "real underlying element" to wrap once two of the
three variants are hand-built (only `oval` genuinely wraps a Material
component), this component's template root became a plain
`<span class="root">` wrapping whichever variant's markup is active, with
`data-variant`/`data-size`/`data-animate`/`role="progressbar"` on that
wrapper — a structural change from the first pass (which had
`<mat-progress-spinner class="root">` as the literal root, matching "wrap
the real underlying element" for the `oval`-only version). `RecursicaOverStyled`
now forwards onto this wrapper uniformly for all three variants instead of
only reaching the Material element.

## Sizing: `oval` reads tokens at runtime; `bars`/`dots` don't need to

`MatProgressSpinner.diameter`/`strokeWidth` are plain JS numbers (px) — the
component's SVG `viewBox`/circle-radius math (`_circleRadius()`,
`_viewBox()` in `progress-spinner.d.d.ts`) is computed from these numbers at
the TypeScript level, not from CSS. A CSS-only override of the rendered
`width`/`height` (leaving Material's internal SVG coordinate space sized for
its own default `diameter` — confirmed `BASE_SIZE = 100`, i.e. a 100×100
viewBox — via the compiled `fesm2022/progress-spinner.mjs`) would visually
scale the whole ring including stroke width by the mismatched ratio, making
the stroke unpredictably thin/thick relative to the intended
`thickness-size` token. There is no `vector-effect: non-scaling-stroke`
escape hatch in MDC's circular-progress markup to sidestep this.

**Resolution (`oval` only)**: `ngAfterViewInit`/`ngOnChanges` read the real
resolved pixel values of this size's `..._properties_size`/
`..._properties_thickness-size` tokens off the rendered element via
`getComputedStyle(...).getPropertyValue(...)` and feed them into Material's
real `[diameter]`/`[strokeWidth]` inputs — so Material's own SVG geometry is
correct for the token's actual value, not just a CSS coat of paint on top of
wrong internal math. Both tokens are declared at `:root` in
`recursica_variables_scoped.css` (not theme/layer-scoped, confirmed by
`grep -n` — lines 1206-1215), so the read is reliable regardless of which
theme/layer context the component renders in. Fallback constants
(`FALLBACK_PX`) matching the tokens' current real values (small 24px/3px,
default 36px/4px, large 48px/5px) are used only until `ngAfterViewInit`
runs, avoiding a visible flash.

`bars`/`dots` need none of this — they're plain hand-written CSS reading
`var(--loader-size)` directly, the same way Mantine's own primitives do, so
there's no JS-numeric-input mismatch to work around at all.

## `--mat-progress-spinner-active-indicator-width`: `!important`, and why (`oval` only)

Reading `fesm2022/progress-spinner.mjs`'s compiled component metadata
(`ɵɵngDeclareComponent`'s `host.properties` map) directly: Material
inline-binds this same custom property to **`diameter + "px"`** on the host
element — i.e. a value equal to the entire circle's diameter, not a sensible
stroke thickness. (Confirmed this is real, compiled, ships-as-is behavior,
not a doc-generation artifact — the `.d.d.ts` file ships no separate
runtime source, and this partial-Ivy-linked metadata is what the consuming
app's own compiler expands into the actual host bindings.) An inline
`style` attribute always outranks a normal-weight external stylesheet rule
regardless of selector specificity, so this component's own real
`thickness-size` token override needs `!important` to win — the same class
of conflict `Button.module.css`'s `--button-color !important` comment
documents in the React reference, independently rediscovered here for a
different property.

## `border-radius` token: not applied to `oval`, and why

Each size tier's `..._properties_border-radius` token (`9999px` for all
three sizes — i.e. "fully round") has no real target in Material's markup:
`MatProgressSpinner` renders an SVG `<circle>`, not a rounded-rect ring the
way the React reference's `::after`-based ring is (which does need
`border-radius` to render as a circle at all). There is no element here for
`border-radius` to usefully apply to for the `oval` variant. Documented,
deliberate non-application — not a token-support gap. (`dots`, unrelated to
this token, does use `border-radius: 50%` — Mantine's own literal value,
see above.)

## Not exposed (Material inputs intentionally not declared)

- `mode`, `value` — no Recursica equivalent; `oval` is always
  `mode="indeterminate"`.
- `color` (`ThemePalette`, M2-only, explicitly documented as having no
  effect under M3 theming in the `.d.ts` itself) — same reasoning as
  Button's `color`, see that component's notes.

## `RecursicaOverStyled`

`overStyled`/`overClass`/`overStyle` forward onto the wrapper
`<span class="root">` via `resolveOverStyle()` — uniform across all three
variants, since `--loader-color`/`--loader-size` (and any `overStyle`
override of them) are read by all three's CSS. Discarded unless `overStyled`
is `true`. This is also the mechanism `Button` uses internally (not exposed
to `Button`'s own callers) to make the composed loading-state `Loader`'s
color match the button's own text color, regardless of `loaderVariant` — see
`button.component.ts`'s "Loading-state composition" note.

## `::ng-deep` needed for `animate: false` on `oval` — real, verified finding

The first implementation used `.root[data-animate="false"] * { animation: none !important; }`
with no `::ng-deep`, covering all three variants with one rule. Verifying it
in a real running Storybook (not just reading the code back) showed **no
visual or computed effect on `oval`** — its ring kept spinning (`bars`/
`dots` weren't built yet at that point). Root cause: the actually-animated
`oval` elements (`.mdc-circular-progress__indeterminate-container` and its
`circle-left`/`circle-right` graphics) are rendered by `MatProgressSpinner`'s
own template, which uses `ViewEncapsulation.None` (`docs/STYLING_SYSTEM.md`
§1). Under our own `ViewEncapsulation.Emulated`, Angular's compiler appends
our own `_ngcontent-<hash>` attribute requirement to every simple selector
in a rule, including a bare `*` — so a plain `.root[data-animate="false"] *`
only ever matches elements _our own_ template rendered, never a child
component's internal DOM. `::ng-deep` drops that attribute requirement for
everything after it in the selector, while `.root[data-animate="false"]`
itself still requires our own scoping attribute, so the rule still only
takes effect on a real instance of this component with `data-animate="false"`
— not a global rule. `bars`/`dots`' own `.bar`/`.dot` elements, by contrast,
**are** rendered by this component's own template (no child-component
boundary to cross), so their freeze rules are plain, un-`::ng-deep`'d
selectors — both approaches verified working via real `getComputedStyle()`.

## Verification (real Storybook, real headless Chromium)

Booted `npm run storybook`, loaded each `UI-Kit/Loader` story's
`iframe.html?id=...` in a real Chromium instance (Playwright, borrowed
read-only from the `recursica` monorepo's `node_modules` — not installed as
a dependency here), and read real `getComputedStyle()`/DOM values rather
than trusting static markup. Actual results:

| Story                                         | Finding                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Default` (oval)                              | `.oval` width/height: `36px`/`36px`; `--mat-progress-spinner-active-indicator-color`: real resolved hex `#c21b43`; `--mat-progress-spinner-active-indicator-width`: `4px` — confirms the `getComputedStyle`-driven `readTokenSize()` read replaced the `FALLBACK_PX` constants with real token values (Material's own uninfluenced defaults would be `100`/`10`) |
| `Small`/`Large` (oval)                        | width/height `24px`/`24px` and `48px`/`48px`; indicator-width `3px`/`5px`                                                                                                                                                                                                                                                                                        |
| `Bars`                                        | 3 real `.bar` elements; `background-color: rgb(194, 27, 67)` (real token color); `animation-delay` per bar: `-0.24s`/`-0.12s`/`0s` — matches Mantine's `-240ms`/`-120ms`/`0` exactly; `.root` computed `width`/`height`: `36px`/`36px`                                                                                                                           |
| `Dots`                                        | 3 real `.dot` elements; `border-radius: 50%`; `animation-delay` per dot: `0s`/`0.4s`/`0s` — only the middle dot delayed, matching Mantine's `:nth-child(2)` rule exactly                                                                                                                                                                                         |
| `AnimationFrozen` (oval)                      | indeterminate container's `animationName`: `none` (real spin animation name on the unfrozen `Default` story for comparison: `mdc-circular-progress-container-rotate`)                                                                                                                                                                                            |
| `Bars` with `animate: false` (separate check) | `.bar`'s computed `animationName`: `none`                                                                                                                                                                                                                                                                                                                        |
| `OverStyledEscapeHatch`                       | wrapper's inline `style` attribute contains the forwarded `--loader-color: #e91e63`; computed color on the rendered variant reflects it                                                                                                                                                                                                                          |
| `Default` (same check, `overStyled` unset)    | no `--loader-color` override present in the inline `style` attribute — discarded by default                                                                                                                                                                                                                                                                      |

Screenshots saved: `/tmp/recursica-angular-material-loader-default.png`
(oval, real red ring), `/tmp/recursica-angular-material-loader-bars.png`
(3 real bars, mid-animation), `/tmp/recursica-angular-material-loader-dots.png`
(3 real dots, middle one visibly out of phase) — all real red/pink brand
color, real layer-0 surface background, not placeholders. Server killed
after verification — not left running.
