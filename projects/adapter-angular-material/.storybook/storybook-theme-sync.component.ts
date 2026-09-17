import { Component, Input, ViewEncapsulation } from "@angular/core";
import { ThemeProviderComponent } from "../src/lib/theme-provider/theme-provider.component";

/**
 * Storybook-only tooling — deliberately NOT part of the public adapter API:
 * not exported from `public-api.ts`, and lives in `.storybook/` (excluded
 * from the ng-packagr build, see `tsconfig.lib.json`'s `include`) rather
 * than `src/lib/`, so it can never end up shipped in the published package.
 * Its selector is intentionally not `rec-`-prefixed (see this repo's
 * `eslint.config.mjs` override for `.storybook/**\/*.ts`) to keep it visibly
 * distinct from real, public Recursica component selectors.
 *
 * Wires Storybook's global light/dark toolbar toggle to the REAL
 * `RecursicaThemeProvider` (`ThemeProviderComponent`, `rec-theme-provider`)
 * — this component does not duplicate any of `ThemeProviderComponent`'s
 * `data-recursica-theme` attribute logic itself; it only forwards whichever
 * theme Storybook's toolbar currently has selected. This is a genuinely
 * better port than the React reference adapter's own `ColorSchemeWrapper`
 * (`recursica-adapter-mantine-v8/src/utils/ColorSchemeWrapper.tsx`), which
 * re-implements the
 * `document.documentElement.setAttribute("data-recursica-theme", theme)`
 * side effect itself instead of routing through its own
 * `RecursicaThemeProvider` component.
 *
 * **Driven by Storybook's native `globalTypes`/toolbar mechanism, not the
 * third-party `storybook-dark-mode` addon** — see `main.ts`'s own comment
 * for why that addon is currently broken against this repo's pinned
 * `@storybook/angular@9.1.20` (a real, reproduced incompatibility, not a
 * guess). Storybook 9 ships this toolbar mechanism itself, no addon
 * required: `preview.ts`'s `globalTypes.theme` config adds the actual
 * sun/moon toggle button to Storybook's toolbar, and
 * `componentWrapperDecorator`'s second (`props`) argument reads the
 * toolbar's current selection (`storyContext.globals["theme"]`) on every
 * render and passes it to this component as a plain `@Input()` — Storybook
 * itself re-renders every story (and therefore this wrapper) whenever the
 * toolbar selection changes, so no manual event-channel subscription or
 * forced change detection is needed the way listening for a third-party
 * addon's own event would require.
 *
 * Used as a **global decorator** (see `.storybook/preview.ts`'s
 * `decorators` array) so it wraps every story in the whole Storybook
 * instance, not just `ThemeProviderComponent`'s own stories. Verified live
 * against a running Storybook instance by actually clicking the real
 * toolbar toggle button and confirming both `document.documentElement`'s
 * `data-recursica-theme` attribute and the rendered `rec-layer` background
 * color flip accordingly.
 */
@Component({
  selector: "storybook-theme-sync",
  imports: [ThemeProviderComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
    <rec-theme-provider [theme]="theme">
      <ng-content />
    </rec-theme-provider>
  `,
})
export class StorybookThemeSyncComponent {
  @Input() theme: "light" | "dark" = "light";
}
