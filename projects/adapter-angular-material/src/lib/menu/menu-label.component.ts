import { Component, ViewEncapsulation, inject } from "@angular/core";
import {
  RECURSICA_ELEMENT_ID_INPUTS,
  RecursicaElementId,
} from "../utils/recursica-aria";

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
  hostDirectives: [
    { directive: RecursicaElementId, inputs: RECURSICA_ELEMENT_ID_INPUTS },
  ],
  styleUrl: "./menu-label.component.css",
  template: `<div class="root" [attr.id]="elementId.id ?? null">
    <ng-content />
  </div>`,
})
export class MenuLabelComponent {
  protected readonly elementId = inject(RecursicaElementId);
}
