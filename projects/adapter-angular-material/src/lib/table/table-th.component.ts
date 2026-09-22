import { Component, Input, ViewEncapsulation } from "@angular/core";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";

export type RecursicaTableSorted = "asc" | "desc" | false;
export type RecursicaTableCellVariant = "default" | "currency";

/**
 * `Table.Th` — element selector (`rec-table-th`), same "CSS `display:
 * table-cell` gives correct table-layout participation without a real
 * `<th>` tag, `role="columnheader"` restores implicit ARIA semantics"
 * reasoning as `TableTheadComponent`'s own class doc comment (not
 * repeated here). `sorted` drives both `[data-sorted]` (styling) and
 * `[aria-sort]` (real semantics: `"ascending"`/`"descending"`, matching
 * the reference's own identical mapping) plus the chevron icon shown
 * after the projected label — this component's host *is* the header
 * cell, but `<ng-content/>` only projects the caller's label text; the
 * sort chevron is this component's own markup, appended after it, the
 * same "content projection plus own additional markup" shape
 * `form-control-wrapper.component.ts`'s label area already uses.
 */
@Component({
  selector: "rec-table-th",
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./table-th.component.css",
  host: {
    role: "columnheader",
    "[attr.data-sorted]": "sorted ? 'true' : null",
    "[attr.data-disabled]": "disabled ? 'true' : null",
    "[attr.data-currency]": "variant === 'currency' ? 'true' : null",
    "[attr.aria-sort]":
      "sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : null",
    "[class]": "resolvedOverStyle.class",
    "[style]": "resolvedOverStyle.style",
  },
  template: `
    <ng-content />
    @if (sorted === "asc") {
      <svg
        class="sortIcon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
    } @else if (sorted === "desc") {
      <svg
        class="sortIcon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    }
  `,
})
export class TableThComponent implements RecursicaOverStyled {
  @Input() sorted: RecursicaTableSorted = false;
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
