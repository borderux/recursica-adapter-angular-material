import { Component, ViewEncapsulation } from "@angular/core";

/**
 * Recursica `MenuDivider` — Angular Material adapter.
 *
 * REAL implementation, part of `Menu`'s compound API (see
 * `menu.component.ts`'s class doc comment). No Material menu-specific
 * divider exists (`menu.d.ts` has no `MatMenuDivider`) — built from
 * scratch as a plain `role="separator"` element, matching the genesis
 * adapter's own `Menu.Divider` (itself also just a styled `<div>`, not a
 * complex component).
 */
@Component({
  selector: "rec-menu-divider",
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./menu-divider.component.css",
  template: `<div class="root" role="separator"></div>`,
})
export class MenuDividerComponent {}
