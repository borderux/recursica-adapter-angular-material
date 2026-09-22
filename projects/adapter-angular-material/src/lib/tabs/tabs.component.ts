import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewEncapsulation,
  signal,
} from "@angular/core";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";
import { TABS_CONTEXT, TabsContext } from "./tabs-context";

export type RecursicaTabsVariant = "default" | "outline" | "pills";
export type RecursicaTabsOrientation = "horizontal" | "vertical";

/**
 * Recursica `Tabs` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). The
 * step-9 stub's own findings row (`MatTabGroup`/`MatTab`, category EASY)
 * turned out wrong on closer, structural inspection — this component is
 * **hand-built**, not a wrapper around `mat-tab-group`. See
 * IMPLEMENTATION_NOTES.md for the full investigation; short version:
 *
 * 1. `MatTabGroup`'s real compiled template (`@angular/material/fesm2022/tabs.mjs`)
 *    builds its entire visible tab-header DOM (`.mdc-tab`/`.mat-mdc-tab`/the
 *    ink bar) itself, inside **its own** component view. That view is
 *    `ViewEncapsulation.None` (confirmed in the same compiled source), so
 *    none of it ever carries this component's own `_ngcontent-<hash>`
 *    attribute — Emulated-scoped CSS written here could never reach it,
 *    identical in spirit to `Menu`/`Tooltip`'s CDK-Overlay problem but for
 *    a different reason (a nested component's own view boundary, not
 *    Overlay).
 * 2. `MatTab` fuses one tab's clickable label *and* its panel body into a
 *    single `<mat-tab>` element (`textLabel`/`[mat-tab-label]` for the
 *    label, its own `<ng-content>` for the body) — Recursica's contract
 *    needs `Tabs.Tab` (label only) and `Tabs.Panel` (body only) as
 *    independent, `value`-matched siblings, matching the genesis adapter's
 *    real `Tabs.tsx` exactly.
 * 3. `MatTabGroup` selects by numeric `selectedIndex`, not by Recursica's
 *    string `value` — reimplementing value↔index bookkeeping on top of
 *    `MatTabGroup` would have been more code than not using it at all.
 *
 * Given all three, this hand-built approach (this component +
 * `TabsListComponent`/`TabComponent`/`TabPanelComponent`) is simpler and
 * gives full control over the exact DOM shape (`.root`/`.list`/`.tab`/
 * `.panel`) the ported CSS (from the real source-of-truth
 * `Tabs.module.css`) expects — see `tabs.component.css`.
 *
 * State (`value`/`defaultValue`/`(valueChange)`) is provided to descendant
 * `TabComponent`/`TabPanelComponent`/`TabsListComponent` instances via
 * `TABS_CONTEXT` (see `tabs-context.ts`) — Angular's DI-based equivalent of
 * Mantine's `TabsProvider` React context.
 */
@Component({
  selector: "rec-tabs",
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./tabs.component.css",
  providers: [{ provide: TABS_CONTEXT, useExisting: TabsComponent }],
  template: `
    <div
      class="root"
      [attr.data-variant]="variant"
      [attr.data-orientation]="orientation"
      [attr.data-inverted]="inverted ? '' : null"
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
    >
      <ng-content />
    </div>
  `,
})
export class TabsComponent implements TabsContext, RecursicaOverStyled, OnInit {
  /** Recursica's `RecursicaTabsProps.variant` — layout/appearance style. */
  @Input() variant: RecursicaTabsVariant = "default";

  /**
   * Not part of the canonical `RecursicaTabsProps` contract — inherited in
   * the React reference from Mantine's own `TabsProps.orientation`, which
   * has no equivalent underlying type to inherit from here (same situation
   * as `Button`'s `loading`, see that component's own notes). Declared
   * directly on this component instead.
   */
  @Input() orientation: RecursicaTabsOrientation = "horizontal";

  /** `RecursicaTabsProps.inverted` — tab list at the bottom/right instead of top/left. Horizontal only, see IMPLEMENTATION_NOTES.md. */
  @Input() inverted = false;

  /**
   * Controlled active tab `value`. `undefined` (never bound) means
   * uncontrolled — this component tracks its own active value internally,
   * seeded from `defaultValue`. Explicitly setting `null`/a string makes
   * this a controlled component, same convention as Mantine's own
   * `value`/`defaultValue` split.
   */
  @Input() value?: string | null;

  /** Initial active tab `value` for the uncontrolled case. */
  @Input() defaultValue: string | null = null;

  /** Emitted whenever the active tab changes, whether controlled or uncontrolled. */
  @Output() valueChange = new EventEmitter<string | null>();

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  private readonly _uncontrolledValue = signal<string | null>(null);

  ngOnInit(): void {
    this._uncontrolledValue.set(this.defaultValue ?? null);
  }

  get activeValue(): string | null {
    return this.value !== undefined ? this.value : this._uncontrolledValue();
  }

  select(value: string): void {
    if (this.value === undefined) {
      this._uncontrolledValue.set(value);
    }
    this.valueChange.emit(value);
  }

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }
}
