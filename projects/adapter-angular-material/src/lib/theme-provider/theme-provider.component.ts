import { DOCUMENT } from "@angular/common";
import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewEncapsulation,
  inject,
} from "@angular/core";
import { LayerComponent } from "../layer/layer.component";

const THEME_ATTRIBUTE = "data-recursica-theme";

/**
 * Recursica `RecursicaThemeProvider` — Angular Material adapter.
 *
 * REAL implementation (not a stub). Ported from the React source of truth,
 * `packages/adapter-common/src/RecursicaThemeProvider/RecursicaThemeProvider.tsx`
 * in the `recursica` monorepo — see
 * `docs/ADAPTER_INTEGRATION_REPORT.md` Crosscutting Finding A / Q10 for why
 * this can't be re-exported from `@recursica/adapter-common` here (React-only
 * package) and has to be authored from scratch, and `docs/STYLING_SYSTEM.md`
 * §4 for the two-`mat.theme()`-calls-scoped-under-`[data-recursica-theme]`
 * theming decision this component's attribute is load-bearing for.
 *
 * Sets `data-recursica-theme="light"|"dark"` on `document.documentElement`
 * reactively (removed on destroy), and wraps `<ng-content>` in a layer-0
 * `<rec-layer>` by default (see `initLayer0`) so the base page surface/
 * border/elevation variables resolve without extra setup.
 *
 * **Composition note**: unlike the React source's
 * `initLayer0 ? <Layer layer={0}>{children}</Layer> : <>{children}</>`
 * conditional-element branching, this component always renders a single
 * `<rec-layer>` and toggles its `contentsOnly` input instead of branching
 * between two separate `<ng-content>` outlets. See this component's own
 * `IMPLEMENTATION_NOTES.md` for why: a template with `<ng-content>` inside
 * two conditional branches (tried with both the modern `@if`/`@else` block
 * syntax and classic `*ngIf`/`else`) reliably rendered empty content in
 * this repo's Storybook (JIT-compiled) setup — a real, reproduced finding,
 * not a guess. `contentsOnly` produces the same effective output as "no
 * Layer at all" (no box, no `data-recursica-layer` attribute, children
 * still participate in the cascade), so this is a faithful behavioral port
 * even though the DOM has one extra (invisible, `display: contents`)
 * wrapper element in the `initLayer0 = false` case that React's fragment
 * branch doesn't have.
 *
 * **Deliberate, flagged gap**: the React source unconditionally calls
 * `injectOverStyledStyles()`/`registerOverStyledConsoleCommand()` — dev-
 * tooling for the `overStyled` prop escape-hatch highlight feature. Those
 * two calls are intentionally NOT ported here. `docs/STYLING_SYSTEM.md` §6
 * leaves the entire `overStyled`/generic-styling-escape-hatch mechanism as
 * an open, undesigned item for this Angular adapter (`[ngClass]`/`[style]`/
 * `[class]` host bindings bypass Angular's `@Input()` surface in a way that
 * has no Angular-native answer yet); porting that mechanism's dev-tooling
 * ahead of the mechanism itself existing would be building on a foundation
 * that isn't there. This is a scoped omission, not a silent drop — revisit
 * once `docs/STYLING_SYSTEM.md` §6 is resolved.
 */
@Component({
  selector: "rec-theme-provider",
  imports: [LayerComponent],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./theme-provider.component.css",
  template: `
    <rec-layer [layer]="0" [contentsOnly]="!initLayer0">
      <ng-content />
    </rec-layer>
  `,
})
export class ThemeProviderComponent implements OnInit, OnChanges, OnDestroy {
  /** `'light' | 'dark'`. Defaults to `'light'` when omitted. */
  @Input() theme: "light" | "dark" = "light";

  /**
   * When true (the default), automatically wraps content in a
   * `<rec-layer [layer]="0">` so the base page surface/border/elevation
   * variables resolve without any extra setup. Set to `false` to place the
   * base `Layer` yourself (e.g. to use `contentsOnly`, or to control exactly
   * where in the tree layer 0 starts).
   */
  @Input() initLayer0 = true;

  private readonly document = inject(DOCUMENT);

  /**
   * `ngOnInit` (not just `ngOnChanges`) applies the theme on first render.
   * Angular only calls `ngOnChanges` for an `@Input()` that is actually
   * *bound* in the caller's template — `<rec-theme-provider>` with no
   * `[theme]` binding at all (relying on the `'light'` default) never fires
   * `ngOnChanges`, so relying on it alone would silently skip setting the
   * attribute for the common "just use the default" case. `ngOnChanges`
   * still does the reactive part — re-applying the attribute whenever a
   * *bound* `theme` input's value changes at runtime, the Angular-idiomatic
   * equivalent of the React source's `useEffect(() => { ... }, [theme])`.
   */
  ngOnInit(): void {
    this.applyTheme();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["theme"] && !changes["theme"].firstChange) {
      this.applyTheme();
    }
  }

  ngOnDestroy(): void {
    this.document.documentElement.removeAttribute(THEME_ATTRIBUTE);
  }

  private applyTheme(): void {
    this.document.documentElement.setAttribute(THEME_ATTRIBUTE, this.theme);
  }
}
