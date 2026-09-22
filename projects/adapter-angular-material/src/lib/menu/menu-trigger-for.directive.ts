import { Directive, Input, OnChanges, inject } from "@angular/core";
import { MatMenuTrigger } from "@angular/material/menu";
import { MenuComponent } from "./menu.component";

/**
 * Attaches a `<rec-menu>` to any trigger element — e.g.
 * `<rec-button [recMenuTriggerFor]="menu">Open</rec-button>`, referencing a
 * `<rec-menu #menu>` elsewhere in the template.
 *
 * Built via Angular's `hostDirectives` (composing Material's own real
 * `MatMenuTrigger` onto this directive's host element) rather than
 * reimplementing open/close/positioning/keyboard-navigation logic —
 * `MatMenuTrigger` already is exactly the right mechanism, this directive
 * only exists to accept this adapter's own `MenuComponent` (not a raw
 * `MatMenu`) as its input, keeping Material's own trigger API from leaking
 * into this adapter's public surface. See `menu.component.ts`'s class doc
 * comment for why there's no `<rec-menu-target>` wrapping component the
 * way the genesis adapter needs `Menu.Target` — this directive attaches
 * directly to the real trigger element instead.
 */
@Directive({
  selector: "[recMenuTriggerFor]",
  hostDirectives: [
    {
      directive: MatMenuTrigger,
      outputs: ["menuOpened: recMenuOpened", "menuClosed: recMenuClosed"],
    },
  ],
})
export class MenuTriggerForDirective implements OnChanges {
  @Input({ required: true }) recMenuTriggerFor!: MenuComponent;

  private readonly trigger = inject(MatMenuTrigger, { self: true });

  ngOnChanges(): void {
    this.trigger.menu = this.recMenuTriggerFor.matMenuPanel;
  }
}
