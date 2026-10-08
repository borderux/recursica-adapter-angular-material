import { Component, Input, ViewEncapsulation, inject } from "@angular/core";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";
import {
  RECURSICA_ELEMENT_ID_INPUTS,
  RecursicaAriaLabelling,
  RecursicaElementId,
} from "../utils/recursica-aria";

/**
 * Recursica `CardHeader` — Angular Material adapter.
 *
 * REAL implementation, part of `Card`'s compound API (see
 * `card.component.ts`'s class doc comment — not a separate top-level
 * Recursica component, matching the genesis adapter's own `Card.Header`
 * sub-export). Built as a plain `<div>`, not `mat-card-header` — see
 * `card.component.ts`'s class doc comment for why.
 */
@Component({
  selector: "rec-card-header",
  hostDirectives: [
    {
      directive: RecursicaAriaLabelling,
      inputs: ["ariaLabel", "aria-label", "ariaLabelledby", "aria-labelledby"],
    },
    { directive: RecursicaElementId, inputs: RECURSICA_ELEMENT_ID_INPUTS },
  ],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./card-header.component.css",
  template: `
    <div
      [attr.id]="elementId.id ?? null"
      [attr.aria-label]="aria.ariaLabel ?? null"
      [attr.aria-labelledby]="aria.ariaLabelledby ?? null"
      class="root"
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
    >
      <ng-content />
    </div>
  `,
})
export class CardHeaderComponent implements RecursicaOverStyled {
  protected readonly aria = inject(RecursicaAriaLabelling);
  protected readonly elementId = inject(RecursicaElementId);

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }
}
