import { NgTemplateOutlet } from "@angular/common";
import {
  Component,
  Input,
  TemplateRef,
  ViewEncapsulation,
  inject,
} from "@angular/core";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";
import { ACCORDION_ITEM_CONTEXT } from "./accordion-context";

/**
 * Recursica `Accordion.Control` — Angular Material adapter.
 *
 * REAL implementation, part of `Accordion`'s compound API (see
 * `accordion.component.ts`'s class doc comment for why this is hand-built
 * rather than wrapping `MatExpansionPanelHeader`). The clickable header —
 * always required, no hybrid auto-construction (see
 * `accordion.component.ts`'s class doc comment).
 *
 * A real native `<button>` — gets Tab-order focus and Enter/Space
 * activation for free from the browser, with no roving-tabindex/keyboard
 * manager needed. Unlike `Tabs` (where only the *active* tab is normally
 * in the page's Tab sequence, requiring `FocusKeyManager` to move focus
 * with arrow keys), the WAI-ARIA Accordion pattern keeps every header
 * independently focusable — this is the simpler case, not an oversight.
 *
 * `leftIcon`/`chevron` are `TemplateRef`s, not projected-content slots —
 * same translation as `Button`'s `icon` / `Tabs.Tab`'s
 * `leftSection`/`rightSection`. `chevron` resolution order: this
 * component's own `chevron` input, else the enclosing item's
 * `ACCORDION_ITEM_CONTEXT.chevron` (itself sourced from the root
 * `AccordionComponent.chevron`), else the built-in default chevron markup
 * below.
 *
 * ## `disabled`: own input, with a fallback to the item's `disabled`
 *
 * The source-of-truth's `AccordionControl` has its own real `disabled`
 * prop — the only thing that actually blocks click/keyboard activation
 * (Item-level `disabled` there only dims, via a note in that component's
 * own doc comment: "a manually-composed `<Accordion.Control>` needs
 * `disabled` passed explicitly"). This component keeps that same real
 * `disabled` input, but **also** falls back to the enclosing item's
 * `disabled` (via `ACCORDION_ITEM_CONTEXT`) when this component's own
 * `disabled` is left at its default `false` — so a caller who sets
 * `<rec-accordion-item disabled>` gets a genuinely non-interactive control
 * without having to repeat `disabled` a second time on
 * `<rec-accordion-control>`. A caller can still override independently
 * (set `disabled` explicitly `false` on the control while the item is
 * `disabled` — unusual, but not blocked) since this only *fills the gap*
 * when the control's own input is at its default.
 */
@Component({
  selector: "rec-accordion-control",
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./accordion-control.component.css",
  template: `
    <button
      type="button"
      class="control"
      [id]="controlId"
      [attr.aria-expanded]="isOpen"
      [attr.aria-controls]="panelId"
      [attr.data-active]="isOpen ? '' : null"
      [disabled]="isDisabled"
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
      (click)="onClick()"
    >
      @if (leftIcon) {
        <span class="iconLeftWrapper" aria-hidden="true">
          <ng-container [ngTemplateOutlet]="leftIcon" />
        </span>
      }
      <span class="label"><ng-content /></span>
      <span class="chevron" aria-hidden="true">
        @if (resolvedChevron) {
          <ng-container [ngTemplateOutlet]="resolvedChevron" />
        } @else {
          <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%">
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        }
      </span>
    </button>
  `,
})
export class AccordionControlComponent implements RecursicaOverStyled {
  @Input() leftIcon?: TemplateRef<unknown>;

  /** Overrides the resolved default chevron (own input > item/root context > built-in SVG) for
   * this control only. See class doc comment's chevron resolution order. */
  @Input() chevron?: TemplateRef<unknown>;

  /** See class doc comment's "disabled: own input, with a fallback to the item's disabled". */
  @Input() disabled = false;

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  private readonly itemCtx = inject(ACCORDION_ITEM_CONTEXT, {
    optional: true,
  });

  get isOpen(): boolean {
    return this.itemCtx?.isOpen ?? false;
  }

  get isDisabled(): boolean {
    return this.disabled || (this.itemCtx?.disabled ?? false);
  }

  get resolvedChevron(): TemplateRef<unknown> | undefined {
    return this.chevron ?? this.itemCtx?.chevron;
  }

  get controlId(): string {
    return `rec-accordion-control-${this.itemCtx?.value ?? ""}`;
  }

  get panelId(): string {
    return `rec-accordion-panel-${this.itemCtx?.value ?? ""}`;
  }

  onClick(): void {
    if (this.isDisabled) return;
    this.itemCtx?.toggle();
  }

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }
}
