import {
  AfterContentInit,
  Component,
  ContentChildren,
  OnDestroy,
  QueryList,
  ViewEncapsulation,
  inject,
} from "@angular/core";
import { FocusKeyManager } from "@angular/cdk/a11y";
import { Subscription } from "rxjs";
import { TabComponent } from "./tabs-tab.component";
import { TABS_CONTEXT } from "./tabs-context";

/**
 * Recursica `Tabs.List` — Angular Material adapter.
 *
 * REAL implementation, part of `Tabs`'s compound API (see
 * `tabs.component.ts`'s class doc comment for why `Tabs` is hand-built).
 * Purely a structural/naming wrapper — `MatTabGroup` has no equivalent
 * "list" container of its own to wrap (its tab header is built entirely by
 * its own view, see `tabs.component.ts`), so unlike `Tabs`/`Tab`/`Panel`
 * there's no underlying Material element being composed here at all. This
 * exists only for API-shape parity with the genesis adapter's real
 * `Tabs.List` (`role="tablist"` + the roving-tabindex keyboard manager
 * below), matching the same "exists for parity, not structural necessity"
 * reasoning `Menu`'s notes give for *not* having a `<rec-menu-target>`.
 *
 * Owns the `FocusKeyManager<TabComponent>` that drives arrow-key/Home/End
 * roving-tabindex navigation across every projected `<rec-tabs-tab>` —
 * `ContentChildren` with `descendants: true` finds them even though this
 * component's own template is just `<ng-content>` (no intermediate view
 * boundary problem here, unlike `Tabs`/`MatTabGroup` — `TabComponent`s are
 * real content children of this component's own view, not built by a
 * different component's internal template).
 *
 * Navigation activates on focus ("automatic activation", matching the
 * genesis adapter's real Mantine-backed keyboard behavior) — moving focus
 * with an arrow key calls `ctx.select()` immediately, not just moving
 * `:focus` without changing the active tab.
 */
@Component({
  selector: "rec-tabs-list",
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./tabs-list.component.css",
  template: `
    <div
      class="list"
      role="tablist"
      tabindex="-1"
      [attr.aria-orientation]="ctx?.orientation ?? 'horizontal'"
      (keydown)="onKeydown($event)"
      (focusin)="onFocusIn($event)"
    >
      <ng-content />
    </div>
  `,
})
export class TabsListComponent implements AfterContentInit, OnDestroy {
  @ContentChildren(TabComponent, { descendants: true })
  private readonly tabs!: QueryList<TabComponent>;

  private keyManager?: FocusKeyManager<TabComponent>;
  private changeSubscription?: Subscription;

  readonly ctx = inject(TABS_CONTEXT, { optional: true });

  ngAfterContentInit(): void {
    const vertical = this.ctx?.orientation === "vertical";
    this.keyManager = new FocusKeyManager(this.tabs)
      .withWrap()
      .withHomeAndEnd()
      .withVerticalOrientation(vertical)
      .withHorizontalOrientation(vertical ? null : "ltr");

    this.changeSubscription = this.keyManager.change.subscribe(() => {
      const active = this.keyManager?.activeItem;
      if (active) this.ctx?.select(active.value);
    });
  }

  onKeydown(event: KeyboardEvent): void {
    this.keyManager?.onKeydown(event);
  }

  /**
   * `FocusKeyManager`'s own `activeItemIndex` is internal cursor state,
   * completely separate from real DOM `:focus` — it only ever moves via its
   * own `setActiveItem()`/`onKeydown()` calls, never automatically in sync
   * with a plain mouse click on a tab. Confirmed live: without this
   * listener, clicking "Gallery" then pressing → left the manager's cursor
   * at its initial `-1`, so the next arrow key just activated index 0
   * ("Gallery" again) instead of advancing to "Messages" — silently
   * indistinguishable from "nothing happened" in a manual check. Listening
   * for `focusin` (bubbles from whichever tab `<button>` receives real
   * focus, by click or Tab key) and calling `updateActiveItem` — not
   * `setActiveItem`, which would re-call `.focus()` and risk a loop — keeps
   * the manager's cursor accurate for whatever triggers focus next.
   */
  onFocusIn(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    const tab = this.tabs?.find((t) => t.nativeElement === target);
    if (tab) this.keyManager?.updateActiveItem(tab);
  }

  ngOnDestroy(): void {
    this.changeSubscription?.unsubscribe();
    this.keyManager?.destroy();
  }
}
