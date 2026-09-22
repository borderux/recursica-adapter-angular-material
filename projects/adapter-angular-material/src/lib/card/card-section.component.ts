import { Component, Input, ViewEncapsulation } from "@angular/core";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";

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
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./card-section.component.css",
  template: `
    <div
      class="root"
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
    >
      <ng-content />
    </div>
  `,
})
export class CardSectionComponent implements RecursicaOverStyled {
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
