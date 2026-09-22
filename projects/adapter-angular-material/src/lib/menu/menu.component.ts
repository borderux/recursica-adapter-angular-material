import { Component, Input, ViewChild, ViewEncapsulation } from "@angular/core";
import { MatMenu, MatMenuModule } from "@angular/material/menu";
import { RecursicaOverStyled } from "../utils/recursica-over-styled";

export type RecursicaMenuPositionX = "before" | "after";
export type RecursicaMenuPositionY = "above" | "below";

/**
 * Recursica `Menu` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). Wraps
 * `MatMenu`/`MatMenuTrigger`/`MatMenuItem` (`docs/ADAPTER_INTEGRATION_REPORT.md`
 * §9's Menu row) — a mature, CDK-Overlay-backed compound API, but shaped
 * very differently from the genesis adapter's Mantine-based dot-notation
 * (`<Menu><Menu.Target>...</Menu.Target><Menu.Dropdown>...</Menu.Dropdown></Menu>`).
 *
 * ## Why there's no `<rec-menu-target>`
 *
 * Mantine's `Menu.Target` exists because React needs `cloneElement()` to
 * attach a ref/click-handler onto whatever single child is passed as the
 * trigger. Angular has no such need: `[recMenuTriggerFor]` (see
 * `menu-trigger-for.directive.ts`) is a directive that attaches directly to
 * the real trigger element (e.g. `<rec-button [recMenuTriggerFor]="menu">`)
 * the same way `matMenuTriggerFor` does — no wrapping component required.
 *
 * ## `<rec-menu>` = Mantine's `<Menu>` + `<Menu.Dropdown>` combined
 *
 * This component's template wraps a single `<mat-menu #panel="matMenu">` —
 * itself a `<ng-template>`-based panel with no visible DOM until a trigger
 * opens it (confirmed against the real compiled template:
 * `@angular/material/fesm2022/menu.mjs`). There's no separate "root
 * controls open state, dropdown renders content" split the way Mantine
 * needs (Mantine's root owns `opened`/context; Angular's trigger directive
 * owns open/close state instead) — one component covers both roles here.
 *
 * ## Styling: real global CSS, same pattern as `Tooltip`
 *
 * `MatMenu`'s panel renders through CDK Overlay, outside this component's
 * own template — `ViewEncapsulation.Emulated`-scoped CSS here can never
 * reach `.mat-mdc-menu-panel`/`.mat-mdc-menu-item` (confirmed against the
 * real compiled component: `ViewEncapsulation.None`, panel content created
 * via `ng-template`/`TemplateRef`, not a descendant of this component's own
 * rendered view). Real token styling ships in `menu-overlay.css`, gated
 * behind a `.rec-menu` class (via `MatMenu`'s own `panelClass`/`class`
 * input) and `[data-recursica-theme]`, exactly like `tooltip-overlay.css`.
 */
@Component({
  selector: "rec-menu",
  imports: [MatMenuModule],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./menu.component.css",
  template: `
    <mat-menu
      #panel="matMenu"
      [class]="panelClasses"
      [xPosition]="xPosition"
      [yPosition]="yPosition"
      [overlapTrigger]="overlapTrigger"
      [hasBackdrop]="hasBackdrop ?? true"
    >
      <ng-content />
    </mat-menu>
  `,
})
export class MenuComponent implements RecursicaOverStyled {
  @Input() xPosition: RecursicaMenuPositionX = "after";
  @Input() yPosition: RecursicaMenuPositionY = "below";
  @Input() overlapTrigger = false;
  @Input() hasBackdrop?: boolean;

  /**
   * `overClass` only — no `overStyle`, same reasoning as `Tooltip`: the
   * panel is created/destroyed by CDK on every open/close, so there's no
   * safe, stable `ElementRef` to hand inline styles to. `overClass` still
   * works because it's forwarded into the same `panelClass` binding used
   * for `.rec-menu`.
   */
  @Input() overStyled = false;
  @Input() overClass?: string;

  @ViewChild("panel", { static: true }) private readonly panel!: MatMenu;

  /** The underlying `MatMenu` instance — consumed by `[recMenuTriggerFor]`, never by application code directly. */
  get matMenuPanel(): MatMenu {
    return this.panel;
  }

  /** Forwarded to `MatMenu`'s `panelClass` — see class doc comment's global-CSS note. */
  get panelClasses(): string {
    const classes = ["rec-menu"];
    if (this.overStyled && this.overClass) classes.push(this.overClass);
    return classes.join(" ");
  }
}
