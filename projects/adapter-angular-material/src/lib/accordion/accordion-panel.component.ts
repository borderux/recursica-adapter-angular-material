import { Component, Input, ViewEncapsulation, inject } from "@angular/core";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";
import { ACCORDION_ITEM_CONTEXT } from "./accordion-context";

/**
 * Recursica `Accordion.Panel` — Angular Material adapter.
 *
 * REAL implementation, part of `Accordion`'s compound API (see
 * `accordion.component.ts`'s class doc comment). Body content only —
 * matched to its sibling `<rec-accordion-control>` by both belonging to the
 * same enclosing `<rec-accordion-item [value]="...">`, via
 * `ACCORDION_ITEM_CONTEXT` (never touching `MatExpansionPanel`'s own body
 * wrapper — see `accordion.component.ts`'s class doc comment for why).
 *
 * Animated collapse via CSS `grid-template-rows: 0fr → 1fr` (the same
 * technique Angular Material's own `MatExpansionPanel` uses internally,
 * confirmed in its compiled `expansion.mjs` styles — borrowing the
 * technique, not the component) rather than the simpler `[hidden]` toggle
 * `Tabs.Panel` uses. Deliberately not `[hidden]`/`*ngIf`: `[hidden]` forces
 * `display: none`, which cannot participate in a CSS transition at all, and
 * `*ngIf` would destroy/recreate this panel's content (losing scroll
 * position, uncommitted form state, etc.) every time it closes — same
 * reasoning `Tabs.Panel`'s own doc comment gives for staying mounted, just
 * without `[hidden]`'s inert-and-untransitionable side effect blocking
 * animation. `[attr.inert]` (not `[hidden]`) keeps the collapsed content out
 * of the tab order/accessibility tree instead.
 */
@Component({
  selector: "rec-accordion-panel",
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./accordion-panel.component.css",
  template: `
    <div
      class="panel"
      [class.panelOpen]="isOpen"
      role="region"
      [id]="panelId"
      [attr.aria-labelledby]="controlId"
      [attr.inert]="isOpen ? null : ''"
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
    >
      <div class="content"><ng-content /></div>
    </div>
  `,
})
export class AccordionPanelComponent implements RecursicaOverStyled {
  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  private readonly itemCtx = inject(ACCORDION_ITEM_CONTEXT, {
    optional: true,
  });

  get isOpen(): boolean {
    return this.itemCtx?.isOpen ?? false;
  }

  get panelId(): string {
    return `rec-accordion-panel-${this.itemCtx?.value ?? ""}`;
  }

  get controlId(): string {
    return `rec-accordion-control-${this.itemCtx?.value ?? ""}`;
  }

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }
}
