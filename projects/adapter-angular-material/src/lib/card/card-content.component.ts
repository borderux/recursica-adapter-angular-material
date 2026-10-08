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
 * Recursica `CardContent` — Angular Material adapter.
 *
 * REAL implementation, part of `Card`'s compound API (see
 * `card.component.ts`'s class doc comment). Built as a plain `<div>`, not
 * `mat-card-content` — see `card.component.ts`'s class doc comment for why
 * (Material's version has fixed 16px paddings, not token-driven).
 */
@Component({
  selector: "rec-card-content",
  hostDirectives: [
    {
      directive: RecursicaAriaLabelling,
      inputs: ["ariaLabel", "aria-label", "ariaLabelledby", "aria-labelledby"],
    },
    { directive: RecursicaElementId, inputs: RECURSICA_ELEMENT_ID_INPUTS },
  ],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./card-content.component.css",
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
export class CardContentComponent implements RecursicaOverStyled {
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
