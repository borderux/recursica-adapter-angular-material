import { Component, Input, ViewEncapsulation } from "@angular/core";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";

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
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./card-header.component.css",
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
export class CardHeaderComponent implements RecursicaOverStyled {
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
