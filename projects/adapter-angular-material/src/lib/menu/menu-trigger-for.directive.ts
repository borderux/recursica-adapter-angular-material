import {
  AfterViewChecked,
  AfterViewInit,
  Directive,
  DoCheck,
  ElementRef,
  Input,
  OnChanges,
  inject,
} from "@angular/core";
import { MatMenuTrigger } from "@angular/material/menu";
import { ButtonComponent } from "../button/button.component";
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
export class MenuTriggerForDirective
  implements OnChanges, AfterViewInit, DoCheck, AfterViewChecked
{
  @Input({ required: true }) recMenuTriggerFor!: MenuComponent;

  /** Opens the menu once when the view first renders (used by stories that must be diffable without an interaction step). */
  @Input() recMenuInitiallyOpen = false;

  private readonly trigger = inject(MatMenuTrigger, { self: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly button = inject(ButtonComponent, {
    optional: true,
    self: true,
  });

  /**
   * `rec-button` host: Material's `aria-haspopup`/`aria-expanded`/`aria-controls` host
   * bindings would sit on the `<rec-button>` element, not the focused inner `<button>`, so
   * the same state is set on the Button's inputs instead. Runs before the Button's view is
   * refreshed, so it renders in the same pass. (Button uses default change detection.)
   */
  ngDoCheck(): void {
    const button = this.button;
    if (!button) return;
    const trigger = this.trigger;
    const menu = trigger.menu as { panelId?: string } | null;
    button.ariaHasPopup = menu ? "menu" : undefined;
    button.ariaExpanded = trigger.menuOpen;
    button.ariaControls = trigger.menuOpen ? menu?.panelId : undefined;
  }

  /** Material's host bindings rewrite the attributes whenever their value changes; drop them again. */
  ngAfterViewChecked(): void {
    if (!this.button) return;
    const el = this.host.nativeElement;
    el.removeAttribute("aria-haspopup");
    el.removeAttribute("aria-expanded");
    el.removeAttribute("aria-controls");
  }

  ngOnChanges(): void {
    this.trigger.menu = this.recMenuTriggerFor.matMenuPanel;
  }

  ngAfterViewInit(): void {
    if (this.recMenuInitiallyOpen) {
      Promise.resolve().then(() => this.trigger.openMenu());
    }
  }
}
