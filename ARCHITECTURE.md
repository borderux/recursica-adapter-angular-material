# Architecture

## Overview

This document describes the high-level architecture of the `@recursica/adapter-angular-material` package.

## Dependencies

- **`@angular/material` / `@angular/cdk`** (peer, `^20.2.14`): the underlying UI kit.
- **`@angular/core` / `common` / `forms` / `platform-browser`** (peer, `^20.0.0 || ^21.0.0`): Angular itself.

## Key Design Decisions

- Components map closely to Angular Material's structure but enforce Recursica design tokens.
- We avoid over-styling; components only diverge from Angular Material's defaults when dictated by the Recursica design system.
- Adapter props are removed from the underlying UI kit when they'd lead to behavior Recursica doesn't support. For Angular this is structurally simpler than for a React adapter: Angular components don't spread unknown caller props onto their rendered output, so a Material `@Input()` this adapter blocks (e.g. `MatButton`'s `color`, a no-op under Material 3 theming anyway) is blocked simply by never declaring it — there's no runtime "delete the leaked prop" step to also implement.
- Many Angular Material "components" are attribute directives applied to a real native element (`<button matButton>`), not a distinct custom element the way Mantine's/Beam's components are. Recursica's own wrapper renders that real, Material-decorated native element internally (`docs/ADAPTER_INTEGRATION_REPORT.md` Crosscutting Finding C).
- Styling uses Angular's own `ViewEncapsulation.Emulated` — not CSS Modules, which has no equivalent in Angular's build tooling — as the mechanism for making this adapter's own styles non-trivially-targetable from outside. See [`docs/STYLING_SYSTEM.md`](docs/STYLING_SYSTEM.md).
- Theming is a Sass build-time step (`mat.theme()`), not a runtime provider — Angular Material has no `useTheme()`/`ThemeProvider`-equivalent API at all. `RecursicaThemeProvider` (`rec-theme-provider`) sets `data-recursica-theme` on `document.documentElement`, and the consuming app's own Sass calls `mat.theme()` twice, scoped under `[data-recursica-theme="light"|"dark"]` — one attribute write drives both Recursica's and Angular Material's theme in lockstep, with no separate JS sync bridge. See `docs/STYLING_SYSTEM.md` §4 and `docs/ADAPTER_INTEGRATION_REPORT.md` Q10.
- The generic styling escape hatch (`overStyled` in every other adapter) is not yet designed for this one — Angular's `[ngClass]`/`[style]`/`[class]` host bindings bypass a component's declared `@Input()` surface in a way no prior (React) adapter had to solve. See [`docs/STYLING_SYSTEM.md`](docs/STYLING_SYSTEM.md) §6 and [`OVERSTYLING.md`](OVERSTYLING.md).

## Standalone repository note

Like the other non-genesis adapters, this package does not live inside the `recursica` turborepo monorepo — it's a standalone repository so it can be cloned and maintained independently (see [docs/CREATING_AN_ADAPTER.md](docs/CREATING_AN_ADAPTER.md)). It ships its own CI/release pipeline (`.github/workflows/`, `.changeset/`) instead of inheriting the monorepo's Turborepo pipeline.

## Package structure

This is an Angular CLI workspace containing a single library project (`projects/adapter-angular-material/`), built with `ng-packagr` (`@angular/build:ng-packagr`), not a Vite library:

- `projects/adapter-angular-material/src/lib/<kebab-name>/` — one folder per component (`<kebab-name>.component.ts`, `.component.css`, `.stories.ts`, `IMPLEMENTATION_NOTES.md`). All components are Angular **standalone components** (`imports: [...]` on `@Component`, no NgModules).
- `projects/adapter-angular-material/src/public-api.ts` — the package's public entry point; re-exports everything from `src/lib`.
- `projects/adapter-angular-material/.storybook/` — `@storybook/angular` configuration (Angular-CLI-builder-based framework, not the Vite-based `@storybook/angular-vite`).
- `projects/adapter-angular-material/src/storybook-demos/` — Brand/Token demo stories ported from `@recursica/storybook-template`'s bundled React demos, and `RecursicaJsonService` (an Angular DI singleton, the Angular-idiomatic replacement for React Context's `RecursicaJsonProvider`). Not part of the public API.
- `angular.json` — the Angular CLI workspace config; the `storybook`/`build-storybook` architect targets attach directly to this one library project (there is no separate host application project — see `docs/CREATING_AN_ADAPTER.md`'s decisions log for why none was needed).
