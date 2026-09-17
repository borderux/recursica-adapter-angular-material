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

## 6. The generic styling escape hatch is architecturally different from every prior adapter — open design item, not yet resolved

**This is the one place this adapter cannot simply copy Mantine/Beam's `filterStylingProps()` pattern, and it's flagged here explicitly rather than glossed over.**

Every prior adapter's generic escape hatch is a React prop object: `className`/`style` arrive as ordinary props, so `filterStylingProps()` can strip them from a plain JS object at runtime, and TypeScript can `Omit<>` them from the public type. In Angular, `[class]`/`[ngClass]`/`[style]`/`[ngStyle]` are **template-level host bindings that operate on any element or component host regardless of the component's own declared `@Input()`s** — a caller writing `<rec-button [ngClass]="...">` is binding onto _this adapter's_ component selector using Angular's own template syntax, not passing a prop `RecButton` chose to accept. Blocking this isn't a matter of typing `Omit<>` on a props interface; it depends on how this adapter's own component template is structured (specifically, whether/how a binding on the Recursica host element propagates to the underlying `matButton`-decorated element inside it).

**Not resolved here — this needs its own design pass at step 10, per component**, starting with `Layer`/`RecursicaThemeProvider`/`Button` (the first three in the build order). Whatever mechanism is chosen there should get written up as an addendum to this section, not left implicit in each component's own code.

One narrower point _is_ settled, and simpler than any prior adapter: Angular components don't spread unknown caller props onto their rendered output the way a React component can with JSX rest-prop spreading. This adapter's own components will declare an explicit `@Input()` for exactly the props Recursica's contract exposes — an appearance-affecting Material `@Input()` this adapter doesn't want to expose (e.g. `MatButton`'s `color`, which the integration report's Q4 notes is already a no-op under M3 theming) is blocked simply **by never declaring it**, with no runtime deletion step needed the way `omitUnsupportedProps()` provides for React's prop-spreading model. The generic-escape-hatch problem above is specifically about `[ngClass]`/`[style]`/`[class]`, which bypass this by construction — that's the part still open.

## 7. Conclusion: how overstyling is prevented, end to end (partial — one layer open)

1. **TypeScript**: this adapter hand-copies the portable, framework-agnostic parts of `@recursica/adapter-common`'s types (`RecursicaOverStyled<T>`, `RecursicaSpacing`, `RECURSICA_COMPONENTS`, etc. — see `ADAPTER_INTEGRATION_REPORT.md` Crosscutting Finding A) into this adapter's own `src/utils`/`src/types`, since the real npm package can't be a dependency here (it hard-requires `react`/`react-dom` as peers). Each component's own `@Input()` surface is declared explicitly, not spread from an arbitrary object — see §6.
2. **Runtime, component-specific appearance props**: not applicable the way it is for React — see §6's point on Angular not spreading unknown props. Simply not declaring an `@Input()` for a blocked Material prop is sufficient; there's no equivalent of `omitUnsupportedProps()` needed for this layer.
3. **Runtime, generic styling vectors (`[ngClass]`/`[style]`/`[class]` host bindings)**: **open, per §6.** This is the layer every future component's implementation needs to close deliberately, and the first real component built should settle the mechanism for all the rest to follow.

Verification for a new component isn't complete until this is checked against real rendered output — reading the code and confirming it "looks right" is not the same as forcing a blocked binding through a running app and confirming the computed DOM/styles didn't change.
