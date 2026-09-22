import { Component, Input, ViewEncapsulation } from "@angular/core";
import { LayerComponent } from "../src/lib/layer/layer.component";

/**
 * Storybook-only tooling — same "deliberately not part of the public
 * adapter API" reasoning `storybook-theme-sync.component.ts`'s own header
 * comment documents (not `rec-`-prefixed, lives in `.storybook/`, excluded
 * from the ng-packagr build).
 *
 * Ports the reference's own global `layer`/`withLayer` Storybook args
 * (`recursica-adapter-mantine-v8/.storybook/preview.tsx`: `args: { withLayer:
 * true, layer: 0 }`, plus a decorator wrapping every story in `<Layer
 * layer={layer} style={{ padding: "48px" }}>` when `withLayer` is true) —
 * confirmed by reading that file directly, not guessed. Used as a global
 * decorator (`.storybook/preview.ts`'s `decorators` array), nested INSIDE
 * `StorybookThemeSyncComponent` (theme provisioning has to be outermost so
 * `rec-layer`'s own theme+layer-scoped color tokens resolve), matching the
 * reference's own `MantineProvider > ColorSchemeWrapper > Layer` nesting
 * order.
 *
 * `<ng-content>` appearing in both the `@if` and `@else` branches is valid
 * Angular (confirmed via a real `ng build`, not assumed) — content
 * projection resolves once regardless of how many `<ng-content>` markers
 * reference it; this is unrelated to the old, genuinely-unsupported
 * `<ng-content *ngIf="...">` structural-directive-on-ng-content
 * restriction.
 */
@Component({
  selector: "storybook-layer-wrapper",
  imports: [LayerComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (withLayer) {
      <rec-layer [layer]="layer" style="padding: 48px; display: block;">
        <ng-content />
      </rec-layer>
    } @else {
      <ng-content />
    }
  `,
})
export class StorybookLayerWrapperComponent {
  @Input() withLayer = true;
  @Input() layer: 0 | 1 | 2 | 3 = 0;
}
