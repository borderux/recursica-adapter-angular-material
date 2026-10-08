import { Component, Input, ViewEncapsulation, inject } from "@angular/core";
import {
  RECURSICA_ARIA_LABELLING_INPUTS,
  RecursicaAriaLabelling,
} from "../utils/recursica-aria";
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
  hostDirectives: [
    {
      directive: RecursicaAriaLabelling,
      inputs: RECURSICA_ARIA_LABELLING_INPUTS,
    },
  ],
  styleUrl: "./tabs-panel.component.css",
  template: `
    <div
      class="panel"
      role="tabpanel"
      [id]="panelId"
      [attr.aria-label]="aria.ariaLabel ?? null"
      [attr.aria-labelledby]="
        aria.ariaLabelledby ?? (aria.ariaLabel ? null : tabId)
      "
      [attr.aria-describedby]="aria.ariaDescribedby ?? null"
      [attr.tabindex]="panelTabIndex ?? null"
      [hidden]="!isActive"
    >
      <ng-content />
    </div>
  `,
})
export class TabPanelComponent {
  /** Matches this panel to its sibling `<rec-tabs-tab [value]="...">`. */
  @Input({ required: true }) value!: string;

  /** `tabindex` of the inner `div[role=tabpanel]`. */
  @Input() panelTabIndex?: number;

  private readonly ctx = inject(TABS_CONTEXT, { optional: true });
  protected readonly aria = inject(RecursicaAriaLabelling);

  get isActive(): boolean {
    return this.ctx?.activeValue === this.value;
  }

  get panelId(): string {
    return (
      this.ctx?.panelId(this.value) ??
      `rec-tabpanel-${this.value.trim().replace(/\s+/g, "-")}`
    );
  }

  get tabId(): string {
    return (
      this.ctx?.tabId(this.value) ??
      `rec-tab-${this.value.trim().replace(/\s+/g, "-")}`
    );
  }
}
