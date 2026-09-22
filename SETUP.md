# Installing `@recursica/adapter-angular-material`

Follow these instructions to install and configure the Angular Material Adapter in your host project.

## 1. Install Dependencies

First, install the Recursica Angular Material Adapter package:

```bash
npm install @recursica/adapter-angular-material @angular/material @angular/cdk
```

### Peer Dependencies

This library requires the following peer dependencies. Ensure they are installed in your project (see this package's `package.json` for the authoritative version ranges):

```bash
npm install @angular/core @angular/common @angular/forms @angular/platform-browser rxjs
```

---

## 2. Set up Angular Material's own theming — required, not optional

Unlike every prior Recursica adapter (Mantine, Beam), **Angular Material has no runtime theming API at all** — no `useTheme()`, no `ThemeProvider`, no injectable "current theme" service. Theming is entirely a Sass build-time step. A component with no `mat.theme()` call anywhere in your app's compiled CSS renders structurally correct but visually broken (no color, no radius, no elevation) — nearly every Material component-level CSS variable falls back to a `--mat-sys-*` variable that plain installation never defines.

In your app's global stylesheet (e.g. an Angular CLI app's `styles.scss`):

```scss
@use "@angular/material" as mat;

html[data-recursica-theme="light"] {
  @include mat.theme(
    (
      color: (
        theme-type: light,
        // ...your palette config
      ),
      typography: Roboto,
      density: 0,
    )
  );
}

html[data-recursica-theme="dark"] {
  @include mat.theme(
    (
      color: (
        theme-type: dark,
        // ...your palette config
      ),
      typography: Roboto,
      density: 0,
    )
  );
}
```

Call `mat.theme()` **twice**, each scoped under the exact `[data-recursica-theme="light"|"dark"]` selector that `RecursicaThemeProvider` (`rec-theme-provider`, see step 5 below) sets on `document.documentElement`. This isn't cosmetic — because both selectors' compiled CSS is present in the document at once and the browser's cascade picks whichever one matches, a single already-necessary `RecursicaThemeProvider` attribute write drives **both** Recursica's own CSS and Angular Material's `--mat-sys-*` variables in lockstep, with no separate JS sync bridge (unlike Beam, which needs a hand-written sync component because `BeamThemeProvider`'s theme prop is mount-only). See [`docs/STYLING_SYSTEM.md`](docs/STYLING_SYSTEM.md) §4 for the full reasoning.

Also import the CDK's structural CSS — required by any component built on the CDK Overlay (Menu, Select, Autocomplete, Dialog, Tooltip, Datepicker, Timepicker, SnackBar, BottomSheet all depend on it):

```scss
@import "@angular/cdk/overlay-prebuilt.css";
@import "@angular/cdk/text-field-prebuilt.css";
@import "@angular/cdk/a11y-prebuilt.css";
```

> **Open item, not yet verified**: whether an Angular app using a hand-rolled esbuild/Vite build (rather than the Angular CLI's default Sass-capable builder) needs additional Sass tooling wired up hasn't been confirmed against a real non-CLI host app — see `docs/ADAPTER_INTEGRATION_REPORT.md` §2.

---

## 3. Integrate CSS

Order matters — load Recursica's own variables after Angular Material's theme output:

```scss
// styles.scss
@use "@angular/material" as mat;

html[data-recursica-theme="light"] {
  @include mat.theme((/* ... */));
}
html[data-recursica-theme="dark"] {
  @include mat.theme((/* ... */));
}

@import "@angular/cdk/overlay-prebuilt.css";
@import "@angular/cdk/text-field-prebuilt.css";
@import "@angular/cdk/a11y-prebuilt.css";

@import "./path/to/recursica_variables_scoped.css"; // Recursica theme variables
@import "@recursica/adapter-angular-material/tooltip-overlay.css";
@import "@recursica/adapter-angular-material/menu-overlay.css";
@import "@recursica/adapter-angular-material/dropdown-overlay.css";
@import "@recursica/adapter-angular-material/date-picker-overlay.css";
@import "@recursica/adapter-angular-material/auto-complete-overlay.css";
@import "@recursica/adapter-angular-material/hover-card-overlay.css";
@import "@recursica/adapter-angular-material/modal-overlay.css";
@import "@recursica/adapter-angular-material/panel-overlay.css";
@import "@recursica/adapter-angular-material/popover-overlay.css";
```

Most of this adapter's own component CSS is not a separate stylesheet to import — Angular's build pipeline compiles each component's `styleUrl` inline as part of that component's own module, scoped via `ViewEncapsulation.Emulated` (see `docs/STYLING_SYSTEM.md` §3). `Tooltip`/`Menu`/`Dropdown`/`DatePicker`/`AutoComplete`/`HoverCard`/`Modal`/`Panel`/`Popover` are the exceptions so far: each renders its interactive panel through CDK Overlay (or, for `DatePicker`, Angular Material's own `ViewEncapsulation.None` calendar), outside this adapter's own scoped-CSS reach, so their real token styling ships as genuine global stylesheets instead (see each one's own class doc comment).

---

## 4. Integrate Google Fonts

Integrating custom fonts depends on how you load fonts in your project and which fonts are specified in your `recursica_variables_scoped.css` (project-dependent). We suggest loading them via Google Fonts, as shown in this example:

```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
```

---

## 5. Wrap your app in `RecursicaThemeProvider` (`rec-theme-provider`)

`rec-theme-provider` sets `data-recursica-theme` on `document.documentElement` and, by default, wraps its content in a `<rec-layer [layer]="0">` (via `initLayer0`, which defaults to `true`) so the base page surface/border/elevation variables resolve automatically with no extra setup:

```html
<rec-theme-provider theme="light">
  <!-- Your app -->
</rec-theme-provider>
```

```ts
import { Component } from "@angular/core";
import { ThemeProviderComponent } from "@recursica/adapter-angular-material";

@Component({
  selector: "app-root",
  imports: [ThemeProviderComponent /* ... */],
  template: `
    <rec-theme-provider theme="light">
      <!-- Your app -->
    </rec-theme-provider>
  `,
})
export class AppComponent {}
```

To switch themes at runtime, bind `[theme]` to a component property instead of a literal string. `rec-theme-provider` reactively re-applies `data-recursica-theme` whenever a _bound_ `theme` input changes — and per step 2 above, that single attribute write already drives Angular Material's own theme too. There is no separate provider to wrap this one in (contrast with Beam, which needs both `BeamThemeProvider` and `RecursicaThemeProvider`, or Mantine, which needs `MantineProvider` and `RecursicaThemeProvider`) — Angular Material has no runtime provider component to wrap at all.

---

## 6. Configure PostCSS Plugin (Optional but Recommended)

It is highly recommended (but optional) to install the `@recursica/recursica-postcss-vars` plugin to verify that Recursica CSS variables are properly connected in case they change.

Install the plugin as a dev dependency:

```bash
npm install @recursica/recursica-postcss-vars --save-dev
```

Then, configure it in your `postcss.config.js`:

```javascript
export default {
  plugins: {
    "@recursica/recursica-postcss-vars": {
      cssPath: "./path/to/recursica_variables_scoped.css",
      strict: process.env.NODE_ENV === "production",
    },
  },
};
```

## 7. Configure ESLint Plugin (Optional but Recommended)

It is highly recommended (but optional) to install `eslint-plugin-recursica`, which flags use of the `overStyled` escape-hatch prop so it stays easy to audit.

See [OVERSTYLING.md](OVERSTYLING.md) and [`docs/STYLING_SYSTEM.md`](docs/STYLING_SYSTEM.md) §6 for this adapter's own `overStyled`/`overClass`/`overStyle` mechanism.

Install the plugin as a dev dependency:

```bash
npm install eslint-plugin-recursica --save-dev
```

Then, add it to your `eslint.config.js`:

```javascript
import recursica from "eslint-plugin-recursica";

export default [recursica.configs.recommended];
```
