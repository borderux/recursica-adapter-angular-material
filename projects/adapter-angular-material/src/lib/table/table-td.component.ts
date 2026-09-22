import { Component, Input, ViewEncapsulation } from "@angular/core";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";
import { RecursicaTableCellVariant } from "./table-th.component";

/**
 * `Table.Td` — element selector (`rec-table-td`), same "CSS `display:
 * table-cell` gives correct table-layout participation without a real
 * `<td>` tag, `role="cell"` restores implicit ARIA semantics" reasoning as
 * `TableTheadComponent`'s own class doc comment (not repeated here).
 *
 * Reproduces the reference's own row-level styling (`tr[data-selected]`/
 * `tr[data-disabled]`/`tr:hover`/`tr:nth-of-type(even)`, all originally
 * expressed as `.root tbody tr<state> td` descendant rules) via
 * `:host-context()` selectors that walk up past `TableTrComponent`'s own
 * component boundary to the ancestor `rec-table-tr`'s own state —
 * `:host-context()` matches ancestors regardless of which component
 * created them, the same technique this adapter's `[data-recursica-theme]`
 * gating already relies on throughout. Also reused inside `Table.Tfoot`
 * (confirmed by reading `Table.stories.tsx`'s own `CurrencyColumnWithFooter`
 * story directly) — `:host-context(rec-table-tfoot)` overrides the default
 * body-cell tokens with footer-specific ones.
 */
@Component({
  selector: "rec-table-td",
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./table-td.component.css",
  host: {
    role: "cell",
    "[attr.data-disabled]": "disabled ? 'true' : null",
    "[attr.data-currency]": "variant === 'currency' ? 'true' : null",
    "[class]": "resolvedOverStyle.class",
    "[style]": "resolvedOverStyle.style",
  },
  template: `<ng-content />`,
})
export class TableTdComponent implements RecursicaOverStyled {
  @Input() disabled = false;
  @Input() variant: RecursicaTableCellVariant = "default";

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
