import { Component, ViewEncapsulation } from "@angular/core";

/**
 * Recursica `MenuLabel` — Angular Material adapter.
 *
 * REAL implementation, part of `Menu`'s compound API (see
 * `menu.component.ts`'s class doc comment). No Material equivalent — built
 * from scratch as a plain, non-interactive `<div>`, matching the genesis
 * adapter's own `Menu.Label`.
 */
@Component({
  selector: "rec-menu-label",
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./menu-label.component.css",
  template: `<div class="root"><ng-content /></div>`,
})
export class MenuLabelComponent {}
