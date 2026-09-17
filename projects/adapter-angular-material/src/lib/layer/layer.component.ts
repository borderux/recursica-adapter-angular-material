import { Component, Input, ViewEncapsulation } from "@angular/core";

/**
 * Recursica `Layer` — Angular Material adapter.
 *
 * REAL implementation (not a stub). Ported from the React source of truth,
 * `packages/adapter-common/src/components/Layer/Layer.tsx` +
 * `Layer.module.css` in the `recursica` monorepo — see
 * `docs/ADAPTER_INTEGRATION_REPORT.md` Crosscutting Finding A / Q10 for why
 * this can't just be re-exported from `@recursica/adapter-common` here (it's
 * a React-only package) and has to be authored from scratch for Angular.
 *
 * Renders a root element carrying `data-recursica-layer="<0|1|2|3>"` (omitted
 * entirely when `contentsOnly` is true) so scoped CSS theme+layer blocks in
 * `recursica_variables_scoped.css` (e.g.
 * `[data-recursica-theme="light"][data-recursica-layer="1"]`) set this
 * layer's generic `--recursica_brand_layer_N_*` variables on this element;
 * descendants inherit them. Pair with a theme set on `document.documentElement`
 * (see `RecursicaThemeProvider`/`ThemeProviderComponent`).
 *
 * This component has no UI-kit (Angular Material) dependency at all — it's
 * pure Recursica plumbing, faithfully ported from React with no
 * "how does Material do this differently" question to resolve (see the task
 * that introduced this component for that framing).
 */
@Component({
  selector: "rec-layer",
  imports: [],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./layer.component.css",
  template: `
    <div
      class="root"
      [class.contents]="contentsOnly"
      [attr.data-recursica-layer]="contentsOnly ? null : layer"
    >
      <ng-content />
    </div>
  `,
})
export class LayerComponent {
  /**
   * Layer (0–3). Sets `data-recursica-layer` on the root so descendants use
   * this layer's styles.
   */
  @Input({ required: true }) layer!: 0 | 1 | 2 | 3;

  /**
   * When true, the root uses `display: contents` (no box, not styled) and
   * `data-recursica-layer` is omitted so Recursica layer styling is not
   * applied. Children still participate in the cascade.
   */
  @Input() contentsOnly?: boolean;
}
