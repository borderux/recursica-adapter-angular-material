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
 * ## Real, live-caught bug: `<ng-content>` split across `@if`/`@else` renders nothing
 *
 * A first draft put `<ng-content>` in both the `@if` and `@else` branches
 * (one inside `<rec-layer>`, one bare) — this compiled cleanly (`ng build`
 * is a static/AOT check, not proof of correct runtime projection) but
 * broke at runtime: `@storybook/angular`'s own `componentWrapperDecorator`
 * generates this wrapper's real template by string-composing the story's
 * own template as this component's projected content (confirmed by reading
 * `componentWrapperDecorator`'s compiled source directly, not assumed) —
 * with two conditionally-included `<ng-content>` outlets, every story
 * rendered as a bare `rec-layer` with nothing inside it, live-confirmed by
 * the repo owner. Fixed by using a single, always-present, unconditional
 * `<ng-content>` — `rec-layer` always renders, toggling its own existing
 * `contentsOnly` input (already a real `@Input()` on `LayerComponent` —
 * `display: contents`, no box, no `data-recursica-layer` attribute) for the
 * `withLayer: false` case instead of conditionally omitting `<rec-layer>`/
 * `<ng-content>` from the render tree at all.
 */
@Component({
  selector: "storybook-layer-wrapper",
  imports: [LayerComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
    <rec-layer
      [layer]="layer"
      [contentsOnly]="!withLayer"
      [style]="withLayer ? 'padding: 48px; display: block;' : null"
    >
      <ng-content />
    </rec-layer>
  `,
})
export class StorybookLayerWrapperComponent {
  @Input() withLayer = true;
  @Input() layer: 0 | 1 | 2 | 3 = 0;
}
