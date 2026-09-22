import { NgTemplateOutlet } from "@angular/common";
import {
  Component,
  Input,
  TemplateRef,
  ViewEncapsulation,
} from "@angular/core";
import { MatMenuModule } from "@angular/material/menu";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";

/**
 * Recursica `MenuItem` — Angular Material adapter.
 *
 * REAL implementation, part of `Menu`'s compound API (see
 * `menu.component.ts`'s class doc comment — this isn't a separate
 * top-level Recursica component, matching the genesis adapter's own
 * `Menu.Item` sub-export). Wraps `[mat-menu-item]`
 * (`docs/ADAPTER_INTEGRATION_REPORT.md` §9's Menu row).
 *
 * `leftSection`/`rightSection` are `TemplateRef`s, not projected-content
 * slots — same translation as `Button`'s `icon`. `MatMenuItem`'s own
 * template only has a single `<ng-content select="mat-icon, [matMenuItemIcon]">`
 * slot (no separate leading/trailing concept the way Recursica's design
 * tokens expect) — this component renders its own leading/trailing
 * wrappers instead of relying on Material's single icon slot.
 *
 * `.itemRow` wraps all of this component's own content: `MatMenuItem`'s
 * real compiled template projects the *default* `<ng-content>` slot (i.e.
 * everything this component puts inside `<button mat-menu-item>`) into its
 * **own** `<span class="mat-mdc-menu-item-text">` wrapper — confirmed live
 * (Playwright DOM inspection) that this wrapper is not itself a flex
 * container, so `.itemSection`/`.itemLabel` stacked vertically as plain
 * inline content until `.itemRow` supplied the flex row itself.
 */
@Component({
  selector: "rec-menu-item",
  imports: [MatMenuModule, NgTemplateOutlet],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./menu-item.component.css",
  template: `
    <button
      mat-menu-item
      class="root"
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
      [disabled]="disabled"
      [disableRipple]="disableRipple ?? false"
      [attr.data-selected]="selected ? '' : null"
    >
      <span class="itemRow">
        @if (leftSection) {
          <span class="itemSection" data-position="left">
            <ng-container [ngTemplateOutlet]="leftSection" />
          </span>
        }
        <span class="itemLabel"><ng-content /></span>
        @if (rightSection) {
          <span class="itemSection" data-position="right">
            <ng-container [ngTemplateOutlet]="rightSection" />
          </span>
        }
      </span>
    </button>
  `,
})
export class MenuItemComponent implements RecursicaOverStyled {
  @Input() disabled = false;
  @Input() disableRipple?: boolean;

  /** Visually marks this item as the current selection (`data-selected`) — matching the genesis adapter's own `Menu.Item`. */
  @Input() selected = false;

  @Input() leftSection?: TemplateRef<unknown>;
  @Input() rightSection?: TemplateRef<unknown>;

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }
}
