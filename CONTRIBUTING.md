<critical_agent_directive>
STOP AND READ THIS FIRST.
If you are an AI agent tasked with creating or modifying a component:

1. You MUST wrap the component's input surface against the ported `RecursicaOverStyled`-equivalent constraints where a component has one — see `OVERSTYLING.md` for what's implemented vs. still open for this adapter specifically.
2. **Styling is done exclusively via Angular's own scoping, not CSS Modules**: every component gets its own `<kebab-name>.component.css`, referenced via `styleUrl` and rendered with `ViewEncapsulation.Emulated` (Angular's default), applying `class="root"` to the component's root element. Never set `ViewEncapsulation.None`, never a CSS-in-JS library, never a `.module.css` — Angular's build tooling has no CSS-Modules-equivalent import convention (see `docs/STYLING_SYSTEM.md` §3).
3. You MUST NOT use hardcoded colors or sizing (e.g. `padding: 16px`) unless it's a documented, tokenless structural value (see `Layer/layer.component.css`'s own `HARDCODED VALUES` comment convention). Use the CSS variables from `recursica_variables_scoped.css`; where Angular Material exposes an overridable `--mat-<component>-*`/`--mat-sys-*` custom property for the same visual concern, redeclare that variable rather than writing a higher-specificity rule against Material's own class (`docs/STYLING_SYSTEM.md` §4).
4. If you do not see a relevant CSS variable in the design tokens, you must inform the developer and PAUSE implementation.
5. You MUST read `docs/COMPONENT_DEV_GUIDE.md` for specific implementation constraints — for this adapter, that document is substantial, not a thin delta, because Angular's own architecture differs from every prior (React) adapter in ways that matter for every component.
   </critical_agent_directive>

# Contributing to the Angular Material Adapter

First off, thank you for considering contributing to Recursica! It's people like you that make our community great. We welcome contributions of all kinds, from reporting bugs and suggesting enhancements to submitting pull requests for code changes or documentation improvements.

## 🤖 Instructions for AI Agents & Developers Building Components

If you are tasked with building, modifying, or reviewing components **inside** the `adapter-angular-material`, you must strictly adhere to our architectural philosophy and design constraints.

**DO NOT** begin writing or modifying component code until you have read and understood the following core documents, in order:

1. **Core Philosophy:** Read `docs/PHILOSOPHY.md` to understand why we aggressively block arbitrary styling, the status of the `overStyled` mechanism for this adapter, and why we never modify Angular Material natively.
2. **Styling System:** Read `docs/STYLING_SYSTEM.md` for how Angular Material styles itself, why this adapter uses `ViewEncapsulation.Emulated` instead of CSS Modules, the two-`mat.theme()`-calls theming decision, and the still-open generic-styling-escape-hatch question (§6).
3. **Reconnaissance:** Read `docs/ADAPTER_INTEGRATION_REPORT.md` — the full component-by-component mapping against `@angular/material`/`@angular/cdk`, the build order, and the four Crosscutting Findings (why there's no `@recursica/adapter-common` dependency, why Angular Material's theming has no runtime API, why most Material "components" are attribute directives, and why real form controls are driven by `ReactiveFormsModule`, not local state).
4. **Component Implementation:** Read `docs/COMPONENT_DEV_GUIDE.md` for the exact rules on structuring scoped styles, declaring the `@Input()` surface, and Angular-specific gotchas (lifecycle hooks, content-projection limits, form-control patterns). **Do not duplicate those rules here; follow them directly from the guide.**
5. **Storybook Requirements:** Read `docs/COMPONENT_STORYBOOK_GUIDE.md`. **Rule:** You must implement a Storybook story for every new component or variant you build. Verification is required — boot `npm run dev` and check real rendered output, not just that the code compiles.
6. **Public Usage Documentation:** Every real component MUST have a `USAGE.md` file living within its component folder (e.g., `projects/adapter-angular-material/src/lib/button/USAGE.md`) that documents how to import and use the component, highlighting any adapter-specific behaviors, layout constraints, and accessibility requirements. This is the main public integration reference. **Known gap, flag it if you hit it**: neither `Layer` nor `RecursicaThemeProvider` — the only two real components as of this writing — has a `USAGE.md` yet, despite both being past step 10. This is not a convention change; it's an outstanding item.
7. **Internal Implementation Notes:** Every component MUST have its own `IMPLEMENTATION_NOTES.md` file living within its component folder to document internal engineering decisions, Angular-idiom translation choices, and CSS/token-mapping details. This file is for internal technical tracking and is not publicly consumable. Every stub component already has one, seeded from `docs/ADAPTER_INTEGRATION_REPORT.md` §9 — expand it when you implement the component for real; don't discard and start over.
8. **Update `llms.txt`:** Whenever a component moves from stub to real (or is added/renamed/removed), update the package's root `llms.txt` to keep its status marker (🚧/✅) and, once the component has a real `USAGE.md`, its link in sync. `llms.txt` is the entry point external AI agents use to discover components, so a stale entry means that component is effectively invisible or mis-described to them.

## What's genuinely different here (read before assuming a React-adapter pattern applies)

- **Kebab-case, not PascalCase**: `projects/adapter-angular-material/src/lib/<kebab-name>/<kebab-name>.component.ts` (not `<Name>/<Name>.tsx`); element selector `rec-<kebab-name>` (enforced by `eslint.config.mjs`'s `@angular-eslint/component-selector` rule and `angular.json`'s `"prefix": "rec"`).
- **Standalone components only** — `imports: [...]` on `@Component`, no NgModules.
- **No `@recursica/adapter-common` dependency** — it's a React-only package. See `ARCHITECTURE.md` and `docs/ADAPTER_INTEGRATION_REPORT.md` Crosscutting Finding A for what's hand-ported instead, and why `Layer`/`RecursicaThemeProvider` are real, first-built components here rather than free re-exports.
- **No CSS Modules** — `ViewEncapsulation.Emulated` (Angular's default) is the scoping mechanism. See `docs/STYLING_SYSTEM.md` §3.
- **No generic `overStyled` escape hatch yet** — see `OVERSTYLING.md` and `docs/STYLING_SYSTEM.md` §6.
- **Angular Material's own theming is Sass build-time, not a runtime provider** — `RecursicaThemeProvider`'s Angular port is what makes both systems track a single `data-recursica-theme` attribute; see `docs/STYLING_SYSTEM.md` §4.
- **Real form controls implement `ControlValueAccessor`/`Validator`**, meant to be driven by `ReactiveFormsModule`, not local component state — a genuinely new design axis for every form-shaped component (`docs/ADAPTER_INTEGRATION_REPORT.md` Crosscutting Finding D).

## Visual Regression Testing

Not yet wired up for this adapter — `@recursica/adapter-tester` isn't installed here yet. See `docs/CREATING_AN_ADAPTER.md` step 7 item 7 for the plan (diffing this adapter's Storybook against `mantine-adapter`'s as the source of truth) once a meaningful number of real components exist.

## Keeping Shared Docs in Sync

`docs/COMPONENT_DEV_GUIDE.md` and `docs/COMPONENT_STORYBOOK_GUIDE.md` link to the canonical guides in the `recursica` monorepo (`packages/adapter-common/docs/`) for the shared architectural intent — but unlike `mantine-adapter`'s or `beam-adapter`'s own delta docs, these are **not thin deltas** here. Angular's own component model, styling mechanism, and forms integration differ enough from every prior (React) adapter that most of the canonical guide's literal mechanisms (CSS Modules, `filterStylingProps`, JSX-shaped examples) don't apply verbatim — treat the canonical doc as background on the _shared_ rules (prop-layering intent, token discipline, testing discipline), and this repo's own guides as the actual, authoritative mechanism for Angular. If you're changing a rule that reflects a philosophy shared by every adapter — not something genuinely Angular-specific — check whether the canonical doc or `mantine-adapter`'s/`beam-adapter`'s own delta docs need a corresponding update too.

`docs/PHILOSOPHY.md` is different: it's a **full, self-contained, published** document (it's in this package's `package.json` `"files"` array, unlike the two docs above), because it explains consumer-relevant behavior, not just contributor process. It is a genuine rewrite for Angular Material's own vocabulary, not a thin delta, and does **not** link to a canonical doc anywhere. If you change something in it that reflects a philosophy shared by every adapter, check whether `mantine-adapter`'s/`beam-adapter`'s own `docs/PHILOSOPHY.md` needs the equivalent change too. There's no automated or structural check for this; it's a manual discipline.

See [`docs/CREATING_AN_ADAPTER.md`](docs/CREATING_AN_ADAPTER.md) for how this repository's structure and pipeline map back to the `recursica` monorepo's `adapter-common → adapter → storybook-template → recursica-storybook` chain, and what's different because this is both a standalone repo and an Angular library.

## How Can I Contribute?

### Reporting Bugs

If you find a bug, please open an issue on our GitHub repository. When you are creating a bug report, please include as many details as possible. The information you provide helps us resolve issues faster.

### Suggesting Enhancements

If you have an idea for a new feature or an enhancement to an existing one, please open an issue on our GitHub repository. Describe your idea in as much detail as possible.

### Your First Code Contribution

Unsure where to begin? You can start by looking for issues tagged as `good first issue` or `help wanted`.

### Pull Request Process

We welcome your pull requests. Please follow these steps:

1.  Fork the repo and create your branch from `main`.
2.  Make your changes in a new git branch.
3.  Make sure your code type-checks (`npm run check-types`) and lints (`npm run lint`). There is no `npm test` script yet — don't add one speculatively without asking first (this adapter has revisited test infrastructure decisions more than once; see `docs/CREATING_AN_ADAPTER.md`'s decisions log for the pattern of asking rather than assuming).
4.  If your change affects the user (e.g., adds a feature, fixes a bug), you **must** add a changeset. See the section below.
5.  Issue that pull request!

## Using Changesets

This project uses [Changesets](https://github.com/changesets/changesets) to manage releases. All pull requests that fix a bug, add a feature, or otherwise impact the user must include a changeset file.

To create a changeset, run the following command in the root of the project:

```sh
npx changeset
```

This will launch an interactive CLI that will guide you through creating a changeset. You will be asked to provide a version type (`patch`, `minor`, or `major`) and write a summary of the change.

**Keep the summary to a maximum of 2 lines.** Changesets feed directly into the published `CHANGELOG.md`; long, detailed writeups belong in the PR description or commit message, not the changeset file.

Commit the generated changeset file along with your other changes. When your pull request is merged, our release workflow will use this information to automatically version, create changelogs, and publish the package.

## Code of Conduct

This project is governed by a Code of Conduct. By participating, you are expected to uphold this code.
