import { Component, Input, ViewEncapsulation, inject } from "@angular/core";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";
import {
  ACCORDION_CONTEXT,
  ACCORDION_ITEM_CONTEXT,
  AccordionItemContext,
} from "./accordion-context";

/**
 * Recursica `Accordion.Item` — Angular Material adapter.
 *
 * REAL implementation, part of `Accordion`'s compound API (see
 * `accordion.component.ts`'s class doc comment). Structural wrapper only —
 * always expects an explicitly composed `<rec-accordion-control>` +
 * `<rec-accordion-panel>` pair as projected content (no hybrid
 * `title`/`leftIcon` auto-construction, see `accordion.component.ts`'s
 * class doc comment and IMPLEMENTATION_NOTES.md).
 *
 * Provides `ACCORDION_ITEM_CONTEXT` (`useExisting`) so its own
 * `<rec-accordion-control>`/`<rec-accordion-panel>` children — each a
 * separate component, not TypeScript-reachable as a DOM descendant the way
 * a single React component's children are — can read this item's `value`/
 * open-state/`disabled` without repeating `value` on every element. Reads
 * `ACCORDION_CONTEXT` (`@Optional()`) to compute its own open state and
 * request a toggle from the root.
 *
 * `disabled` here only dims the whole item (control + panel) via plain CSS
 * `opacity` inheritance on `.item[data-disabled]` — opacity cascades
 * visually to descendant DOM regardless of component/encapsulation
 * boundaries, so this needs no `:host-context()` trick to reach the
 * projected `<rec-accordion-control>`/`<rec-accordion-panel>` elements. It
 * does **not** by itself block interaction — see
 * `accordion-control.component.ts`'s own `disabled` handling, which reads
 * this item's `disabled` as a fallback so a caller doesn't have to repeat it
 * on both elements (a deliberate improvement over the source-of-truth,
 * which requires the caller to pass `disabled` to `Control` explicitly in
 * its own manually-composed path — see that component's own doc comment).
 */
@Component({
  selector: "rec-accordion-item",
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./accordion-item.component.css",
  providers: [
    { provide: ACCORDION_ITEM_CONTEXT, useExisting: AccordionItemComponent },
  ],
  template: `
    <div
      class="item"
      [class.noDivider]="!divider"
      [attr.data-active]="isOpen ? '' : null"
      [attr.data-disabled]="disabled ? '' : null"
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
    >
      <ng-content />
    </div>
  `,
})
export class AccordionItemComponent
  implements AccordionItemContext, RecursicaOverStyled
{
  /** Matches this item's open state to `Accordion`'s tracked value(s), and matches this item's
   * `<rec-accordion-control>`/`<rec-accordion-panel>` to each other via generated `id`s. Required
   * — omitting it on multiple items collapses them to the same identity (same rationale as the
   * source-of-truth's `RecursicaAccordionItemProps.value`, see that type's own doc comment). */
  @Input({ required: true }) value!: string;

  /** Toggle visibility of the divider below the item. */
  @Input() divider = true;

  /** Dims the whole item; see class doc comment for why this doesn't also block interaction. */
  @Input() disabled = false;

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  private readonly ctx = inject(ACCORDION_CONTEXT, { optional: true });

  get isOpen(): boolean {
    return this.ctx?.isOpen(this.value) ?? false;
  }

  get chevron() {
    return this.ctx?.chevron;
  }

  toggle(): void {
    this.ctx?.toggle(this.value);
  }

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }
}
