import { NgTemplateOutlet } from "@angular/common";
import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import {
  MatMenuItem,
  MatMenuModule,
  MatMenuTrigger,
} from "@angular/material/menu";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";
import { MenuComponent } from "./menu.component";

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
 *
 * ## `subMenu`: nested `<rec-menu>`, not a separate `Menu.Sub` compound API
 *
 * The genesis adapter's `Menu.Sub`/`Menu.Sub.Target`/`Menu.Sub.Item`/
 * `Menu.Sub.Dropdown` exist because Mantine needs a distinct context
 * provider for the nested popover. `MatMenuItem` has native submenu support
 * built in (`_triggersSubmenu`, confirmed in the compiled `menu.mjs`) that
 * activates automatically once a `MatMenuTrigger` is present on the *same*
 * host element as `[mat-menu-item]` — this is why `subMenu` binds
 * `matMenuTriggerFor` directly on this component's own internal `<button
 * mat-menu-item>` rather than going through `[recMenuTriggerFor]` (that
 * directive's `hostDirectives` composition attaches `MatMenuTrigger` to
 * whatever *outer* element it's applied to — `<rec-menu-item>` itself,
 * a different DOM node than the inner `<button mat-menu-item>` — so
 * `MatMenuItem` would never find a co-located trigger to detect). A caller
 * nests another `<rec-menu>` anywhere in the same template (Angular
 * template reference variables aren't order-dependent, so it can be
 * declared before or after the item that references it — same forward-
 * reference pattern this adapter's own top-level `[recMenuTriggerFor]`
 * stories already rely on) and passes it directly: `<rec-menu-item
 * [subMenu]="productsMenu">Products</rec-menu-item>` /
 * `<rec-menu #productsMenu>...</rec-menu>`. The submenu chevron icon,
 * hover-to-open, and keyboard nesting all come from `MatMenuItem`/
 * `MatMenuTrigger`'s own native behavior — no new *behavior* implemented
 * here, but real wiring below was required to actually reach it.
 *
 * ## Real fix required: `MAT_MENU_PANEL` never reaches projected menu content at all
 *
 * Even with `matMenuTriggerFor` correctly bound, submenu detection silently
 * failed at first — confirmed live via `ng.getComponent()`/`ng.getDirectives()`
 * on the actual button, not guessed: `MatMenuItem._parentMenu` and
 * `MatMenuTrigger._parentMaterialMenu` were both `null`/`undefined`, so
 * `_triggersSubmenu()` (which requires both, per the compiled `menu.mjs`)
 * always returned `false` — no chevron, and clicking just closed the parent
 * menu and opened an unrelated, unnested one instead of a real submenu.
 * Root cause, isolated by testing an `inject(MAT_MENU_PANEL, {optional:true,
 * skipSelf:true})` at every boundary from this component up to `<rec-menu
 * #productsMenu>` itself: the token is `null` at *every* level, not just
 * inside this component's own template. `MatMenu`'s own `providers: [{
 * provide: MAT_MENU_PANEL, useExisting: MatMenu }]` never reaches *any*
 * projected content here, because `<mat-menu>`'s actual panel content is a
 * deferred `<ng-template>` that CDK Overlay instantiates later via a
 * `TemplatePortal` rooted at the *trigger's* `ViewContainerRef`, not
 * `MatMenu`'s own component tree — a real CDK/Material architectural
 * property (present for every menu item, submenu or not; the top-level
 * ones just never needed `_parentMenu` for anything). Re-providing the
 * token at any component boundary was therefore a dead end.
 *
 * Fixed by setting the same fields Material's own `MatMenuTrigger`
 * constructor/`_menu` setter would have set, directly, once this item's own
 * `MatMenuTrigger`/`MatMenuItem` view children, `subMenu` (the menu this
 * item *opens*), and `enclosingMenu` (the menu this item *lives inside* —
 * see `setEnclosingMenu()` below, and `menu.component.ts`'s own class doc
 * comment for how that's obtained without DI either) are all available —
 * `_parentMaterialMenu` (a plain, non-`#private` field, and genuinely the
 * *enclosing* menu, not `subMenu`) and `_setTriggersSubmenu()` (a real, if
 * underscore-prefixed, method `MatMenuTrigger` itself calls for exactly
 * this purpose whenever `.menu` changes).
 *
 * **Confirmed live, click only**: chevron renders, and clicking the trigger
 * opens the submenu beside the parent (which stays open), matching native
 * nested-menu behavior — this is what the reference's own `WithSubmenus`
 * story exercises (a static `opened`-forced render, no interaction).
 *
 * **Keyboard nav, confirmed live**: `_parentMenu` was also null on every item, so
 * `MatMenu._directDescendantItems` (what its `FocusKeyManager` runs off) was empty —
 * no arrow-key nav at all, top-level included. `wireSubmenu()` now sets `_parentMenu` and
 * `MenuComponent.syncItems()` fills the list. ArrowUp/Down, ArrowRight/Enter (open submenu),
 * ArrowLeft (close) all verified. Hover-to-open not separately verified.
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
      [matMenuTriggerFor]="subMenu ? subMenu.matMenuPanel : null"
      #trigger="matMenuTrigger"
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
export class MenuItemComponent
  implements RecursicaOverStyled, AfterViewInit, OnChanges
{
  @Input() disabled = false;
  @Input() disableRipple?: boolean;

  /** Visually marks this item as the current selection (`data-selected`) — matching the genesis adapter's own `Menu.Item`. */
  @Input() selected = false;

  @Input() leftSection?: TemplateRef<unknown>;
  @Input() rightSection?: TemplateRef<unknown>;

  /** A `<rec-menu>` this item opens as a submenu — see class doc comment's "subMenu" section. */
  @Input() subMenu?: MenuComponent;

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  @ViewChild("trigger") private readonly trigger?: MatMenuTrigger;
  @ViewChild(MatMenuItem) private readonly menuItem?: MatMenuItem;

  /** The inner `MatMenuItem` — read by the enclosing `<rec-menu>` to register it for keyboard navigation. */
  get matMenuItem(): MatMenuItem | undefined {
    return this.menuItem;
  }
  private viewInitialized = false;
  private enclosingMenu?: MenuComponent;

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    this.wireSubmenu();
  }

  ngOnChanges(): void {
    this.wireSubmenu();
  }

  /** Called by the enclosing `<rec-menu>`'s own `ngAfterContentInit` — see that component's
   * class doc comment's `@ContentChildren` section for why this can't be plain DI. */
  setEnclosingMenu(menu: MenuComponent): void {
    this.enclosingMenu = menu;
    this.wireSubmenu();
  }

  /** See class doc comment's "Real fix required" section for why this can't be plain DI. */
  private wireSubmenu(): void {
    if (this.viewInitialized && this.menuItem && this.enclosingMenu) {
      // `MatMenuItem._parentMenu` comes from `inject(MAT_MENU_PANEL)`, which is always null here
      // (see class doc), so `MatMenu._directDescendantItems` — the list its `FocusKeyManager` and
      // `_hovered()` run off — stays empty. Register explicitly: keyboard nav for every item.
      (this.menuItem as unknown as { _parentMenu: unknown })._parentMenu =
        this.enclosingMenu.matMenuPanel;
      this.enclosingMenu.syncItems();
    }
    if (
      !this.viewInitialized ||
      !this.trigger ||
      !this.menuItem ||
      !this.subMenu ||
      !this.enclosingMenu
    ) {
      return;
    }
    const trigger = this.trigger as unknown as {
      _parentMaterialMenu?: unknown;
      _handleHover: () => void;
    };
    trigger._parentMaterialMenu = this.enclosingMenu.matMenuPanel;
    (
      this.menuItem as unknown as {
        _setTriggersSubmenu: (value: boolean) => void;
      }
    )._setTriggersSubmenu(true);
    // `MatMenuTrigger.ngAfterContentInit()` already called `_handleHover()` once, before
    // `_parentMaterialMenu` was set above (`ngAfterContentInit` runs before this component's own
    // `ngAfterViewInit`) — its hover-to-open subscription setup silently no-opped with nothing to
    // subscribe to. Re-running it now, with `_parentMaterialMenu` correctly set, is what actually
    // wires up hover-to-open and keyboard `ArrowRight` nesting (confirmed neither worked without
    // this second call, live).
    trigger._handleHover();
  }
}
