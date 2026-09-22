import { Component, Input, ViewEncapsulation, inject } from "@angular/core";
import { TABS_CONTEXT } from "./tabs-context";

/**
 * Recursica `Tabs.Panel` — Angular Material adapter.
 *
 * REAL implementation, part of `Tabs`'s compound API (see
 * `tabs.component.ts`'s class doc comment). Body content only — matched to
 * its sibling `<rec-tabs-tab [value]="...">` by `value`, never touching
 * `MatTab` (see that component's doc comment for why).
 *
 * Stays mounted (`[hidden]`, not `*ngIf`) while inactive, matching
 * Mantine's own `keepMounted` default (`true`) — this also means Angular
 * never destroys/recreates form state, scroll position, etc. inside an
 * inactive panel purely from switching tabs and back, unlike an `*ngIf`
 * approach would.
 */
@Component({
  selector: "rec-tabs-panel",
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./tabs-panel.component.css",
  template: `
    <div
      class="panel"
      role="tabpanel"
      [id]="panelId"
      [attr.aria-labelledby]="tabId"
      [hidden]="!isActive"
    >
      <ng-content />
    </div>
  `,
})
export class TabPanelComponent {
  /** Matches this panel to its sibling `<rec-tabs-tab [value]="...">`. */
  @Input({ required: true }) value!: string;

  private readonly ctx = inject(TABS_CONTEXT, { optional: true });

  get isActive(): boolean {
    return this.ctx?.activeValue === this.value;
  }

  get panelId(): string {
    return `rec-tabpanel-${this.value}`;
  }

  get tabId(): string {
    return `rec-tab-${this.value}`;
  }
}
