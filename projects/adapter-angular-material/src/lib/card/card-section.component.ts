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
 * Recursica `CardSection` — Angular Material adapter.
 *
 * REAL implementation, part of `Card`'s compound API (see
 * `card.component.ts`'s class doc comment). A generic edge-to-edge
 * structural wrapper, matching the genesis adapter's own `Card.Section`
 * (itself just a styled wrapper around Mantine's generic `Card.Section`,
 * not a Material-specific concept) — strips the card's own padding via
 * negative margins so content like an image or map can touch the border
 * seamlessly.
 */
@Component({
  selector: "rec-card-section",
  hostDirectives: [
    {
      directive: RecursicaAriaLabelling,
      inputs: ["ariaLabel", "aria-label", "ariaLabelledby", "aria-labelledby"],
    },
    { directive: RecursicaElementId, inputs: RECURSICA_ELEMENT_ID_INPUTS },
  ],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./card-section.component.css",
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
export class CardSectionComponent implements RecursicaOverStyled {
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
