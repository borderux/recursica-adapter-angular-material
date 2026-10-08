import { Component, Input, ViewEncapsulation, inject } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";
import {
  RECURSICA_ARIA_LABELLING_INPUTS,
  RECURSICA_ELEMENT_ID_INPUTS,
  RecursicaAriaLabelling,
  RecursicaElementId,
} from "../utils/recursica-aria";

/**
 * Recursica `Card` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). Wraps
 * `mat-card` (`docs/ADAPTER_INTEGRATION_REPORT.md` §9's Card row) — its
 * real compiled template is just `<ng-content></ng-content>` (confirmed in
 * `@angular/material/fesm2022/card.mjs`), so unlike `Menu`/`Tooltip` there's
 * no CDK Overlay involved and nothing structural to fight: `mat-card` is a
 * plain, always-in-document element this component's own scoped CSS
 * reaches normally.
 *
 * Material's `appearance` (`outlined`/`filled`/`raised`, the default) is
 * never exposed as an `@Input()` here — same "blocked by never declaring
 * it" convention as Button's `color` — Recursica's Card always applies its
 * own border/background/elevation tokens unconditionally, matching the
 * genesis adapter's own `Card.tsx` (`UNSUPPORTED_PROPS: ["radius",
 * "withBorder", "padding"]` strip the equivalent Mantine knobs for the same
 * reason).
 *
 * `Header`/`Footer`/`Content`/`Section` (see the sibling `card-*.component.ts`
 * files) are built as plain `<div>`s rather than Material's own
 * `mat-card-header`/`mat-card-content`/`mat-card-actions` — those carry
 * fixed structural assumptions (an avatar + title-group split, hardcoded
 * 16px paddings not token-driven) that don't match Recursica's simpler
 * flat header/footer/content/section model, the same reasoning the genesis
 * adapter's own `CardHeader`/`CardFooter`/`CardContent` already apply
 * (built as styled wrappers around Mantine's generic `Card.Section`/a plain
 * `<div>`, not any Mantine-specific header/title/avatar sub-components).
 */
@Component({
  selector: "rec-card",
  hostDirectives: [
    {
      directive: RecursicaAriaLabelling,
      inputs: RECURSICA_ARIA_LABELLING_INPUTS,
    },
    { directive: RecursicaElementId, inputs: RECURSICA_ELEMENT_ID_INPUTS },
  ],
  imports: [MatCardModule],
  host: { "[attr.role]": "null" },
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./card.component.css",
  template: `
    <mat-card
      [attr.id]="elementId.id ?? null"
      [attr.aria-label]="aria.ariaLabel ?? null"
      [attr.aria-labelledby]="aria.ariaLabelledby ?? null"
      [attr.aria-describedby]="aria.ariaDescribedby ?? null"
      [attr.role]="role ?? null"
      class="root"
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
    >
      <ng-content />
    </mat-card>
  `,
})
export class CardComponent implements RecursicaOverStyled {
  protected readonly aria = inject(RecursicaAriaLabelling);
  protected readonly elementId = inject(RecursicaElementId);

  /** Optional landmark role for the `mat-card`. `tabindex` and Material `appearance` are not exposed. */
  @Input() role?: "group" | "region";

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
