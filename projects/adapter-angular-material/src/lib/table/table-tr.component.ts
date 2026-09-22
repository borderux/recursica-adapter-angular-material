import { Component, Input, ViewEncapsulation } from "@angular/core";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";

/**
 * `Table.Tr` — element selector (`rec-table-tr`), same "CSS `display:
 * table-row` gives correct table-layout participation without a real
 * `<tr>` tag, `role="row"` restores implicit ARIA semantics" reasoning as
 * `TableTheadComponent`'s own class doc comment (this repo's eslint config
 * enforces element-type selectors for real components — see that doc
 * comment for the full reasoning, not repeated here).
 *
 * `selected`/`disabled` set `[data-selected]`/`[data-disabled]` on this
 * component's own host. The reference's own `.root tbody tr[data-selected]
 * td`/`tr[data-disabled] td` rules reach across from `<tr>` into a
 * *different* element's styling — `TableTdComponent`'s own CSS reproduces
 * that reach with `:host-context([data-selected])`/
 * `:host-context([data-disabled])` (an ancestor-chain lookup that crosses
 * component boundaries by design, the same technique this adapter's
 * `[data-recursica-theme]` gating already relies on throughout), not a
 * `<tr>`-side rule — `<tr>`'s own scoped CSS cannot reach into a `<td>` a
 * *different* component renders.
 *
 * All host-level bindings (`[attr.data-*]`, `overStyled`'s `[class]`/
 * `[style]`) live in the `host: {}` metadata object, not the template —
 * `<ng-content />` is the entire template, with no separate root element
 * inside it to bind attributes on.
 */
@Component({
  selector: "rec-table-tr",
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./table-tr.component.css",
  host: {
    role: "row",
    "[attr.data-selected]": "selected ? 'true' : null",
    "[attr.data-disabled]": "disabled ? 'true' : null",
    "[class]": "resolvedOverStyle.class",
    "[style]": "resolvedOverStyle.style",
  },
  template: `<ng-content />`,
})
export class TableTrComponent implements RecursicaOverStyled {
  @Input() selected = false;
  @Input() disabled = false;

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
