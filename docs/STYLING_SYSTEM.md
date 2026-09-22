# Styling System — Angular Material Adapter

This document exists per `docs/CREATING_AN_ADAPTER.md` step 8: before writing any component CSS, decide and record how this adapter styles Recursica components on top of `@angular/material`, so every component follows the same, deliberate answer instead of rediscovering it one file at a time. It's a living document — update it if a later component reveals a conclusion below is wrong or incomplete.

Written at scaffold time, before any real component exists, drawing on `docs/ADAPTER_INTEGRATION_REPORT.md`'s questions 1, 3, 4, and 10 (all evidence-checked against the real installed `@angular/material@20.2.14`/`@angular/cdk@20.2.14` source — see that doc for the full citations). This doc restates the relevant conclusions as decisions, and settles two things the report explicitly left open for a human: the scoping mechanism (§3) and the theming approach (§4), both confirmed by Matt.

## 1. How does Angular Material style its own components?

Read directly from the installed package (`node_modules/@angular/material`), not from material.angular.dev's docs pages — full detail in `ADAPTER_INTEGRATION_REPORT.md` Q1/Q2:

- **Plain CSS, generated at build time from Sass, embedded as a literal string in each component's compiled JS** (a `styles: [...]` array alongside the component's `ɵcmp` metadata) — not CSS-in-JS, not a separate stylesheet import.
- **`ViewEncapsulation.None`** on every Material component (confirmed: 0 of 41 sampled component bundles use `Emulated`). Material's own CSS is therefore genuinely global once injected — scoped only by its own stable, unhashed class names (`mat-mdc-button`, `mdc-button`, …), not by any per-instance or per-component-type attribute.
- **Entirely custom-property-driven**, two-tier: component-level variables (`--mat-button-*`, `--mat-checkbox-*`, …) fall back to system-level semantic variables (`--mat-sys-*`) when unset — e.g. `color: var(--mat-button-text-label-text-color, var(--mat-sys-primary))`. No hardcoded colors/sizes found in any sampled component.
- **Theming is a Sass build-time step, not a runtime provider** — see §4.
- **No generic style-prop escape hatch** (no `sx`/`classes`/`classNames`) — Angular doesn't have "style props" as a React-style concept at all (see §5's discussion of why this is architectural, not a gap).

## 2. No global style pollution

**Requirement:** a Recursica `<rec-button>` must be able to render next to a plain, un-wrapped `<button matButton>` with zero bleed in either direction.

**How this adapter meets it:**

- This adapter never edits, patches, or vendors Angular Material's own compiled CSS or Sass. A Recursica component's own stylesheet only adds declarations scoped to its own host/root selector — it never writes a bare `.mat-mdc-button` rule or anything touching `:root`/`html`/`body` directly.
- The override mechanism (custom-property redeclaration, §4 of the integration report / §4 below) is inherently non-polluting: setting `--mat-button-text-label-text-color` inside a scoped selector only affects elements matching that selector and their descendants — it cannot leak to a sibling plain `<button matButton>` elsewhere on the page, and a plain Material button's own styling is unaffected by this adapter's components existing anywhere else in the DOM.
- The one intentional exception: theming. Both Material's `mat.theme()` output and this adapter's ported `RecursicaThemeProvider` operate on `document.documentElement` (see §4) — that's how theming works at all, in both systems, not a pollution risk specific to this adapter. A plain Material component picks up the same theme as a Recursica-wrapped one; that's expected and correct.

## 3. Recursica's own styles are not trivially targetable from outside — scoping mechanism decided: `ViewEncapsulation.Emulated`

**Requirement:** a consumer app's stylesheet shouldn't be able to casually override this adapter's own styling decisions by guessing a class name.

**Angular has no literal CSS-Modules equivalent** — no `*.module.css` → locally-hashed-class-map import convention exists in Angular CLI's build tooling (neither the classic Webpack builder nor the newer esbuild-based `@angular/build` application builder). `ADAPTER_INTEGRATION_REPORT.md` Q3 flagged this as needing a human decision rather than assuming Mantine/Beam's mechanism carries over.

**Decided: `ViewEncapsulation.Emulated`** — Angular's own default, and the framework-idiomatic equivalent of "non-guessable, per-build scoped styling." Angular's compiler:

- Rewrites every selector in a component's own `styles`/`styleUrls` to include a generated `_ngcontent-<hash>` attribute.
- Stamps that same attribute onto every element the component's template renders, and a paired `_nghost-<hash>` attribute onto the host element.

A plain, unprefixed class (`.root`) written in this adapter's own component styles is automatically scoped this way with zero extra build tooling — `class="root"` in the template just works, scoped, the same practical outcome CSS Modules exists for (a consumer can't casually target `.root` and expect it to hit only this adapter's instances), achieved by the compiler instead of a bundler loader. This is a deliberate divergence from Angular Material's own choice (`ViewEncapsulation.None` — see §1): Material chose global CSS for its own components, but this adapter's own additions use Angular's native scoping instead.

**Not yet independently verified in a real build** (flagged honestly, matching the integration report's own epistemic standard): that `_ngcontent-<hash>` scoping behaves as described once a real component exists and is inspected in a browser. This should be confirmed the first time a real component (`Layer`, per the build order) is built, not assumed indefinitely.

## 4. Preferred override mechanism: CSS custom-property overrides — theming decided: two `mat.theme()` calls scoped under `[data-recursica-theme]`

This is the same category of decision Beam-adapter made, and follows from the same underlying fact: Material's own CSS is entirely custom-property-driven (§1), so redeclaring those variables on a scoped selector overrides Material's rendered output without ever touching `.mat-mdc-*`/global selectors — the override composes cleanly with `ViewEncapsulation.None`'s "one global stylesheet" model precisely because the override itself is a normal, selector-scoped CSS rule, not a rewrite of Material's own rule.

**Practical rule for future components**: before writing a component's own styles, check the relevant Material component's compiled CSS (`node_modules/@angular/material/fesm2022/<component>.mjs`'s `styles: [...]` array) for the `--mat-<component>-*`/`--mat-sys-*` variables it reads. Override those, redeclared under this adapter's own scoped selector (which, per §3, Angular's compiler further scopes with `_ngcontent-<hash>` automatically — no extra work needed to combine the two). Fall back to direct property overrides only for whatever Material doesn't expose as a variable.

**Specificity-boosting convention (confirmed with Matt, 2026-09): prefix every override selector with `:host-context([data-recursica-theme])`.** `RecursicaThemeProvider` always sets `data-recursica-theme` on `document.documentElement`, so requiring that attribute costs nothing in real usage — it's always true — but adds a real specificity qualifier a casual consumer override (e.g. a plain `.some-class button { ... }` in their own global stylesheet) is unlikely to replicate. `:host-context()` is Angular's own purpose-built mechanism for exactly this ("style this component differently based on an ancestor attribute/class" — the canonical example in Angular's own docs is a dark-mode class on an ancestor), so it composes correctly with `ViewEncapsulation.Emulated`'s scoping rather than requiring a hand-rolled `html[data-recursica-theme] .root ...` selector:

```css
:host-context([data-recursica-theme]) .root[data-variant="solid"] {
  --mat-button-text-label-text-color: var(
    --recursica_ui-kit_components_button_variants_solid_properties_colors_text
  );
}
```

**Verified live, not just "it compiles"**: added this exact pattern to a real component's CSS, booted the real Storybook instance (every story is already wrapped in the real `RecursicaThemeProvider` via the global decorator — see `.storybook/preview.ts` — so `data-recursica-theme` is genuinely present on `<html>` in every running story, no separate consuming app needed to test this), and confirmed via `getComputedStyle()` that the rule actually matched and applied in the real rendered output. This is not a guaranteed win against a determined consumer (nothing is — see §6/`OVERSTYLING.md`'s honest framing on specificity and injection order), but it raises the bar for the casual/accidental case, which is the actual goal.

**Known compiler quirk: avoid flat 3+-level descendant chains with `:host-context()`.** Verified live on `FormControlLayout`: a flat chain like `:host-context([data-recursica-theme]) .root[data-form-layout="side-by-side"] .leftSection[data-size="default"]` compiles to a selector requiring an extra intermediate `[_ngcontent-*]`-only compound between `.root` and `.leftSection` that no element actually occupies when `.leftSection` is `.root`'s _direct_ child — confirmed against the real compiled CSSOM selector text, not guessed. The rule silently never matches (`getComputedStyle` showed the referenced CSS variable resolving fine, but the property itself never applied). 2-level chains (`:host-context(...) .root[...]`) are unaffected — this only bites 3+ levels. Fix: use native CSS nesting (`&`) instead of a flat multi-line chain, matching `button.component.css`'s existing convention:

```css
:host-context([data-recursica-theme]) .root[data-form-layout="side-by-side"] {
  .leftSection {
    &[data-size="default"] {
      width: var(...);
    }
  }
}
```

This does **not** apply to `Layer`/`RecursicaThemeProvider` themselves — they don't have a "look" to protect the way a real UI component does (same precedent as §6's `RecursicaOverStyled` exemption), so there's no reason to retrofit this onto their existing selectors. Apply it starting with the first component that actually redeclares Material variables (`Button`, per the build order).

**Second known compiler quirk: `:host-context(X):host(Y)` doesn't generate the ancestor-matching form.** Verified live on `CardSection`: `:host-context([data-recursica-theme]):host(:first-child) .root` compiles to `[data-recursica-theme][_nghost-*]:first-child .root[_ngcontent-*]` — requiring the theme attribute on _this same host element_, not the intended ancestor (`data-recursica-theme` only ever lives on `<html>`, never on a component's own host), unlike plain `:host-context([data-recursica-theme]) .root` alone, which correctly generates both the same-element _and_ ancestor comma-separated forms. The rule silently never matched. Distinct from the 3-level-chain quirk above — this one is specific to combining `:host-context()` with `:host()` on the same compound selector. Fix: don't gate structural rules like this behind `:host-context()` at all when the referenced custom property already has a sensible fallback (`var(--foo, <fallback>)`) — the gate isn't needed for correctness once the fallback degrades gracefully with no theme present.

**Theming, decided (`ADAPTER_INTEGRATION_REPORT.md` Q10, Path B)**: rather than Material's default single `mat.theme(...)` call relying on the CSS `color-scheme` property + `light-dark()` function, this adapter's consuming app calls `mat.theme()` **twice**, each scoped under an explicit selector matching the attribute the ported `RecursicaThemeProvider` already sets on `document.documentElement`:

```scss
html[data-recursica-theme="light"] {
  @include mat.theme(
    (
      color: (
        theme-type: light,
        ...,
      ),
    )
  );
}
html[data-recursica-theme="dark"] {
  @include mat.theme(
    (
      color: (
        theme-type: dark,
        ...,
      ),
    )
  );
}
```

Confirmed directly from `_system.scss`: the `theme()` mixin emits its variables under `sass-utils.current-selector-or-root` — whatever selector it's called under is where the `--mat-sys-*` variables land. Since `RecursicaThemeProvider`'s real (React) implementation already does `document.documentElement.setAttribute("data-recursica-theme", theme)` reactively, an Angular port doing the identical thing drives both Recursica's own CSS and Angular Material's theme in lockstep, with **no separate JS sync bridge** — unlike Beam, which needed one because `BeamThemeProvider`'s theme prop is mount-only. **Not yet live-verified** (no running app exists yet to click a real toggle and confirm both sides flip together with no stale residual styling) — this is the first thing to confirm once `RecursicaThemeProvider` is actually built.

## 5. Static styling only — no CSS-in-JS, matches Angular's own idiom

No tension to document: Angular's own build tooling has no CSS-in-JS story at all (styles are always static CSS/Sass compiled ahead of time, per §1/§3), and Angular Material follows the same convention for its own components. Both this adapter and its underlying kit already point the same direction — there was never a choice to make here.

## 6. The generic styling escape hatch — resolved (2026-09, confirmed with Matt)

**This is the one place this adapter couldn't simply copy Mantine/Beam's `filterStylingProps()` pattern — Angular's own template bindings bypass it by construction — but it now has a deliberate, Angular-native resolution.**

Every prior adapter's generic escape hatch is a React prop object: `className`/`style` arrive as ordinary props, so `filterStylingProps()` can strip them from a plain JS object at runtime unless `overStyled: true` unlocks them, and TypeScript can `Omit<>` them from the public type otherwise. In Angular, `[class]`/`[ngClass]`/`[style]`/`[ngStyle]` are **template-level host bindings that operate on any element or component host regardless of the component's own declared `@Input()`s** — a caller writing `<rec-button [ngClass]="...">` is binding onto _this adapter's_ component selector using Angular's own template syntax, not passing a prop `RecButton` chose to accept, and even if it were interceptable, the binding lands on `<rec-button>`'s host element, not automatically on the `<button matButton>` nested inside its template (CSS inheritance only carries a handful of properties — color, font — not background/border/padding).

**Resolved: an explicit, greppable `@Input()` trio, not ambient host bindings.** Every component that wraps a Material element with a "look" to protect implements `RecursicaOverStyled` (`src/lib/utils/recursica-over-styled.ts`):

```ts
export interface RecursicaOverStyled {
  overStyled?: boolean;
  overClass?: string;
  overStyle?: Record<string, string>;
}
```

`overClass`/`overStyle` are forwarded onto the component's own wrapped Material element **only** when `overStyled` is `true` — the shared `resolveOverStyle()` helper centralizes that one check so every component enforces it identically. If `overStyled` is `false` or unset (the default), both are **discarded entirely**, even if a caller set them — mirroring the React adapters' "blocked unless explicitly unlocked" default exactly, just enforced via a dedicated input pair instead of runtime prop-object filtering. The name is deliberately greppable (`grep -r overStyled`) so every place a consumer reaches past Recursica's own design surface is a visible, auditable signal in the codebase, not a quiet one — same intent as every prior adapter's `overStyled`, translated to Angular's own idiom rather than copied verbatim.

Not every component needs this: `Layer`/`RecursicaThemeProvider` are Recursica's own styling plumbing, not a wrapped Material element with a protected look (same precedent as `Flex`/`Stack`/`Group`/`Grid` in the React adapters, which also skip the `RecursicaOverStyled` gatekeeper) — they already accept `class`/`style` unconditionally and don't implement this interface.

One narrower point was already settled, and remains simpler than any prior adapter: Angular components don't spread unknown caller props onto their rendered output the way a React component can with JSX rest-prop spreading. This adapter's own components declare an explicit `@Input()` for exactly the props Recursica's contract exposes — an appearance-affecting Material `@Input()` this adapter doesn't want to expose (e.g. `MatButton`'s `color`, which the integration report's Q4 notes is already a no-op under M3 theming) is blocked simply **by never declaring it**, with no runtime deletion step needed the way `omitUnsupportedProps()` provides for React's prop-spreading model.

## 7. Conclusion: how overstyling is prevented, end to end

1. **TypeScript**: this adapter hand-copies the portable, framework-agnostic parts of `@recursica/adapter-common`'s types (`RecursicaSpacing`, `RECURSICA_COMPONENTS`, etc. — see `ADAPTER_INTEGRATION_REPORT.md` Crosscutting Finding A) into this adapter's own `src/lib/utils`, since the real npm package can't be a dependency here (it hard-requires `react`/`react-dom` as peers). Each component's own `@Input()` surface is declared explicitly, not spread from an arbitrary object — see §6.
2. **Runtime, component-specific appearance props**: not applicable the way it is for React — see §6's point on Angular not spreading unknown props. Simply not declaring an `@Input()` for a blocked Material prop is sufficient; there's no equivalent of `omitUnsupportedProps()` needed for this layer.
3. **Runtime, generic styling vectors (`[ngClass]`/`[style]`/`[class]` host bindings)**: **resolved, per §6** — `RecursicaOverStyled`'s `overStyled`/`overClass`/`overStyle` trio, forwarded only when `overStyled` is `true`, via the shared `resolveOverStyle()` helper.

Verification for a new component isn't complete until this is checked against real rendered output — reading the code and confirming it "looks right" is not the same as forcing `overStyled` both ways through a running app and confirming the computed DOM/styles behave correctly in each case (discarded when `false`/unset, applied when `true`).
