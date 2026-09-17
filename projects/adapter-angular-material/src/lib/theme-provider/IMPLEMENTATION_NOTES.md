# RecursicaThemeProvider (`rec-theme-provider`) — Implementation Notes

**Status**: real implementation (`docs/CREATING_AN_ADAPTER.md` step 10),
built ahead of the other 46 (still stubs), alongside `Layer` — see
`docs/ADAPTER_INTEGRATION_REPORT.md` Crosscutting Finding A / Q10. Every
other real component in this adapter depends on this one (and `Layer`)
existing and working correctly, since it's what puts `data-recursica-theme`
on the page at all.

## Why this exists here at all (not re-exported)

`@recursica/adapter-common`'s `RecursicaThemeProvider` is a React component
(`useEffect`-based); the package is React-only (hard `react`/`react-dom`
peers), so it can't be a dependency of an Angular library. This is a
from-scratch Angular port of the real React source, not a wrapper.

## What was ported, and from where

Source of truth (`recursica` monorepo, read directly):
`packages/adapter-common/src/RecursicaThemeProvider/RecursicaThemeProvider.tsx`.

Ported faithfully:

- Sets `data-recursica-theme="light"|"dark"` on `document.documentElement`,
  removed on cleanup.
- Defaults to `theme = "light"`.
- Wraps content in a layer-0 `Layer` by default, controlled by `initLayer0`
  (default `true`), matching the React source's
  `initLayer0 ? <Layer layer={0}>{children}</Layer> : <>{children}</>`
  branching — composed here via `ThemeProviderComponent`'s template
  conditionally rendering `<rec-layer [layer]="0">` around `<ng-content>`,
  reusing `LayerComponent` rather than duplicating its logic (per this
  task's explicit instruction).

## Deliberate, flagged omission: `overStyled` dev-tooling

The React source unconditionally calls `injectOverStyledStyles()` and
`registerOverStyledConsoleCommand()` in a mount-only `useEffect`. **Both
calls are intentionally NOT ported.** They're dev-tooling for the
`overStyled` prop escape-hatch highlight feature, and
`docs/STYLING_SYSTEM.md` §6 explicitly leaves the entire `overStyled`/
generic-styling-escape-hatch mechanism as an open, undesigned item for this
Angular adapter (Angular's `[ngClass]`/`[style]`/`[class]` host bindings
bypass a component's declared `@Input()` surface in a way none of the prior
adapters' React-prop-based `filterStylingProps()` model has to deal with,
and no Angular-native answer exists yet). Porting this dev-tooling ahead of
that mechanism existing would build on a foundation that isn't there yet.
This is a scoped, documented gap, not a silent drop — revisit once
`docs/STYLING_SYSTEM.md` §6 is resolved, most likely alongside whichever
component's implementation first needs the escape hatch for real.

## Angular-idiom decisions

- **`OnInit` + `OnChanges`, not `OnChanges` alone, not an `@Input()` setter.**
  Angular only invokes `ngOnChanges` for an `@Input()` that is actually
  _bound_ in the caller's template. `<rec-theme-provider>` used with no
  `[theme]` binding at all (relying on the `'light'` default) never fires
  `ngOnChanges` — relying on it alone would silently skip setting the
  attribute for the common "just use the default" case. `ngOnInit` covers
  that first-render case unconditionally; `ngOnChanges` (filtered to skip
  `firstChange`, since `ngOnInit` already handles the initial apply) covers
  reactively re-applying the attribute whenever a _bound_ `theme` value
  changes at runtime — the Angular-idiomatic equivalent of the React
  source's `useEffect(() => { ... }, [theme])`. A plain `@Input()` setter
  (`set theme(value) { ... }`) was considered and rejected: it also only
  fires when the input is bound (same gap as `ngOnChanges` alone), and mixes
  input-assignment semantics with side-effecting DOM work in a way that's
  harder to read than two named lifecycle hooks with a shared private
  `applyTheme()` method.
- **`ngOnDestroy` removes the attribute** — matches the React source's
  `useEffect` cleanup function exactly.
- **`inject(DOCUMENT)`** rather than referencing the global `document`
  directly — the standard Angular idiom for DOM access, keeping the
  component SSR-safe/testable in principle even though this adapter has no
  SSR target today.
- **Composition via a single, always-rendered `<rec-layer>`, not a branch
  between two `<ng-content>` outlets — a judgment call made after hitting a
  real, reproduced Angular/Storybook limitation.** The first implementation
  matched the React source's
  `initLayer0 ? <Layer layer={0}>{children}</Layer> : <>{children}</>`
  literally: `@if (initLayer0) { <rec-layer [layer]="0"><ng-content /></rec-layer> } @else { <ng-content /> }`.
  Verifying this in a real running Storybook (not just reading the code back)
  showed the projected content rendered as **empty** in every story — the
  `<rec-layer>` element and its `data-recursica-layer="0"` attribute were
  present and correctly styled, but `<ng-content>`'s projected text never
  appeared. Narrowed the cause by testing a second variant, classic
  `*ngIf="initLayer0; else plain"` / `<ng-template #plain><ng-content /></ng-template>`
  — **same empty-content result** — ruling out "modern `@if` block syntax
  specifically" as the cause. The common factor in both failing variants:
  `<ng-content>` appears twice in the template, once per conditional branch.
  In this repo's Storybook setup (`@storybook/angular` 9.1.20, which JIT-
  compiles story components rather than using Angular's AOT pipeline),
  having `<ng-content>` in two conditional branches of the same component
  reliably drops the projected content from both, not just the inactive one.
  This wasn't traced to a specific Angular/Storybook GitHub issue (out of
  scope to fully root-cause here) — it's reported as a reproduced, verified
  fact about this repo's toolchain, not a guess.

  **Fix**: always render exactly one `<rec-layer>`, with exactly one
  `<ng-content>`, and drive the `initLayer0 = false` case through `Layer`'s
  own `contentsOnly` input instead of omitting the wrapper element entirely:
  `<rec-layer [layer]="0" [contentsOnly]="!initLayer0"><ng-content /></rec-layer>`.
  `contentsOnly` already renders `display: contents` with no
  `data-recursica-layer` attribute (see `Layer/IMPLEMENTATION_NOTES.md`) —
  functionally identical to "no Layer at all" for styling and cascade
  purposes. The only difference from React's fragment branch is one extra,
  inert (`display: contents`, unstyled) DOM element in the `initLayer0 = false`
  case — an acceptable, documented trade-off for content projection that
  actually works, verified in a real browser rather than assumed from
  reading the template.

## Verification (Storybook, real token CSS) — real computed values, not just "attributes present"

**Token CSS wiring — two attempts, one worked:**

1. First tried a plain side-effect import at the top of `preview.ts`
   (`import "../../../recursica_variables_scoped.css";`, as the task's own
   framing suggested trying). Booting Storybook for real surfaced a webpack
   error: `Module parse failed... no loaders are configured` for that file —
   `@storybook/angular`'s webpack config (confirmed by reading
   `node_modules/@storybook/angular/dist/server/framework-preset-angular-cli.js`)
   only wires up `css-loader`/`style-loader`/`MiniCssExtractPlugin` for CSS
   reachable through Angular's own `styles`-array build pipeline
   (`getStylesConfig`) — a bare top-level `import` of an arbitrary `.css`
   file bypasses that pipeline entirely and has no loader.
2. **Working fix**: added `"styles": ["recursica_variables_scoped.css"]` to
   both the `storybook` and `build-storybook` architect targets' own
   `options` in `angular.json` (not the `build`/ng-packagr target — that
   builder has no `styles` concept, confirmed by trying and by reading its
   schema). This works because `@storybook/angular`'s `getBuilderOptions()`
   reads `getTargetOptions(builderContext.target)` — i.e. the options object
   of the **currently-running architect target** (`storybook`/`build-storybook`
   themselves) — and merges it into the options passed to Angular's own
   `generateI18nBrowserWebpackConfigFromContext`, which is what actually
   wires up the CSS loaders. The path is resolved relative to the **workspace
   root** (confirmed empirically: `"../../recursica_variables_scoped.css"`
   first failed with `Can't resolve` reported relative to the repo root
   itself, i.e. one level too far up; the correct value, with the file
   already at the repo/workspace root, is the bare filename with no `../`).
   This never touches the `build` target used by `npm run build`/`ng build`,
   so ng-packagr's own schema/output is unaffected (confirmed: `npm run
build` still passes clean after this change).

**Real rendering, confirmed with an actual headless browser** (not just
static HTML/attribute inspection): booted Storybook for real
(`npm run storybook`), confirmed via `http://localhost:6006/index.json` that
all 8 expected story ids are present
(`ui-kit-layer--layer-0/1/2/3/--contents-only`,
`ui-kit-recursicathemeprovider--light/--dark/--toggle-theme`), then loaded
each story's `iframe.html?id=...` in a real Chromium instance (Playwright,
borrowed read-only from the `recursica` monorepo's own `node_modules` — not
installed as a dependency of this repo) and read `getComputedStyle()` on the
rendered `.root` element:

| Story                         | `data-recursica-layer`        | `background-color`               | `color`              | border                        | notes                                                                                                              |
| ----------------------------- | ----------------------------- | -------------------------------- | -------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Layer 0 (light)               | `"0"`                         | `rgb(252, 252, 252)`             | `rgb(19, 19, 19)`    | `rgb(214, 214, 214)`, 0px     |                                                                                                                    |
| Layer 1 (light)               | `"1"`                         | `rgb(249, 249, 249)`             | `rgb(19, 19, 19)`    | `rgb(214, 214, 214)`, **2px** | non-zero border-width confirms `--...border-size` resolved                                                         |
| Layer 2 (light)               | `"2"`                         | `rgb(249, 249, 249)`             | `rgb(19, 19, 19)`    | `rgb(214, 214, 214)`, 0px     |                                                                                                                    |
| Layer 3 (light)               | `"3"`                         | `rgb(249, 249, 249)`             | `rgb(19, 19, 19)`    | `rgb(233, 233, 233)`, 0px     | distinct border color from layers 0–2                                                                              |
| Layer `contentsOnly`          | _(absent)_                    | `rgba(0, 0, 0, 0)` (transparent) | inherited            | none                          | `display: contents` confirmed; attribute correctly omitted                                                         |
| ThemeProvider `theme="light"` | `"0"` (on nested `rec-layer`) | `rgb(252, 252, 252)`             | `rgb(19, 19, 19)`    | `rgb(214, 214, 214)`          | `document.documentElement` confirmed to carry `data-recursica-theme="light"`                                       |
| ThemeProvider `theme="dark"`  | `"0"`                         | `rgb(19, 19, 19)`                | `rgb(252, 252, 252)` | `rgb(55, 55, 55)`             | background/text correctly **inverted** vs. light; `document.documentElement` carries `data-recursica-theme="dark"` |

These are real resolved RGB values from the design tokens, not transparent/
default browser values — confirms the full chain (`preview.ts`'s
`styles`-array-driven CSS → `[data-recursica-theme]`/`[data-recursica-layer]`
cascade → `Layer`'s CSS variable references → computed styles) works
end to end, and that `RecursicaThemeProvider`'s `ngOnInit`/`ngOnChanges`
correctly drive `document.documentElement`'s attribute per story. Server
killed after verification — not left running.
