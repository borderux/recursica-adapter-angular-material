# Angular Material Adapter Usage Guide

This guide outlines how human developers and AI agents should consume the `adapter-angular-material` library when building applications.

## 1. Setup and Integration

Before consuming the components, the application must be properly integrated with Recursica design tokens and Angular Material's own Sass theming. Please refer to [SETUP.md](SETUP.md) for full installation and integration instructions.

> [!IMPORTANT]
> If you are an AI agent, you must verify that all setup and integration steps described in [SETUP.md](SETUP.md) are fully followed before attempting to use or customize Recursica components in the application — in particular, the `mat.theme()` Sass step, which is required (not optional) for Angular Material to render correctly at all.

## 2. Importing Components

All UI components should be imported directly from `@recursica/adapter-angular-material` and added to the consuming component's own `imports` array — every component in this adapter is a standalone Angular component (no NgModule to import instead):

```ts
import { Component } from "@angular/core";
import {
  ButtonComponent,
  LayerComponent,
} from "@recursica/adapter-angular-material";

@Component({
  selector: "app-example",
  imports: [ButtonComponent, LayerComponent],
  template: `<rec-layer [layer]="1"><rec-button>Save</rec-button></rec-layer>`,
})
export class ExampleComponent {}
```

**Rule:** Do NOT import `@angular/material`/`@angular/cdk` components or directives directly (`MatButtonModule`, `matButton`, etc.) unless a specific exception has been documented. If you need a standard component, always check the adapter first.
**Rule:** Try to use only Recursica components as much as possible.

## 3. Passing Design Tokens & Layout Constraints

Our components strictly separate logical structural layout from visual design tokens.

- **DO NOT** rely on Angular's own `[ngClass]`/`[style]`/`[class]` template bindings on a Recursica component's host element to reach into its internal styling. These are framework-level template bindings, not props the component chooses to accept — see [OVERSTYLING.md](OVERSTYLING.md) for this adapter's styling escape hatch, `overStyled`.
- **DO** use the component's own declared `@Input()`s — a Recursica component in this adapter never declares an input for a blocked, appearance-affecting Angular Material prop (see [`docs/STYLING_SYSTEM.md`](docs/STYLING_SYSTEM.md) §6/§7), so there is nothing to "accidentally" pass through the way a React adapter's prop-spreading model allows.
- When passing sizes to layout wrappers (`Flex`/`Stack`/`Group`/`LayoutGrid`), use the `rec-` prefixed sizes (e.g., `"rec-sm"`, `"rec-default"`, `"rec-md"`, `"rec-lg"`, `"rec-xl"`). Angular Material itself has no native margin/gap/padding props on any component — spacing is entirely the caller's own CSS responsibility, so these layout primitives are the only place `rec-*` spacing tokens have anywhere to attach (`docs/ADAPTER_INTEGRATION_REPORT.md` Q4).
- **DO NOT** directly access Recursica CSS styles, CSS variables, or JSON token definitions to use in your own styling. These are not considered stable and will change between releases.

## 4. The `overStyled` Escape Hatch

Every Recursica adapter offers an explicit, greppable escape hatch for styling a component from outside. In this adapter it is a trio of inputs: `overStyled`, `overClass` and `overStyle`. `overClass`/`overStyle` are applied to the component's wrapped element only when `overStyled` is `true`, and are discarded otherwise.

```html
<rec-button
  overStyled
  overClass="my-class"
  [overStyle]="{ 'min-width': '200px' }"
  >Save</rec-button
>
```

Prefer design-system inputs and tokens first. See [OVERSTYLING.md](OVERSTYLING.md) for why it works this way in Angular and what it can and cannot prevent.

## 5. Fallback Behavior for Missing Components

If the adapter does not yet implement a required component (see `llms.txt` for the current component list), the preferred approach is to pause integration, navigate into the `adapter-angular-material` package, and natively build the missing wrapper component following the `CONTRIBUTING.md` guidelines. If this is not possible, then utilize the underlying Angular Material component/directive directly using the project's preferred styling approach (check `SETUP.md` for details).

## 6. Managing CSS Changes with PostCSS Plugin

When the `@recursica/recursica-postcss-vars` plugin is incorporated into your build process, it helps maintain sync between your application and the Recursica design system.

- **Missing Variables**: If Recursica CSS variables are used in the application but cannot be found in `recursica_variables_scoped.css`, the plugin will log a **warning** with the file, line and column in your build output. With `NODE_ENV=production` it **fails the build** instead (see `SETUP.md` §6). This typically means that tokens in the design system have been renamed or deleted.
- **Resolution**: When these errors occur, the developer (or AI agent) must locate the issue and reconnect the broken styling to the correct (new) CSS variables found in the updated `recursica_variables_scoped.css`. While this cannot be done automatically, the semantic naming of Recursica variables makes it relatively easy to infer intent and find the proper replacement.
- **New Variables**: Whenever a new version of the scoped CSS is imported, you should review if any new CSS variables have been added to the design system. If so, review these new tokens and consider integrating them into the associated components where appropriate.
