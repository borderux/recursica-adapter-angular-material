import { Component, ViewEncapsulation } from "@angular/core";

/**
 * `Table.Tfoot` — element selector (`rec-table-tfoot`), same reasoning as
 * `TableTheadComponent`'s own class doc comment. Every real footer-cell
 * rule lives in `TableTdComponent`'s own `:host-context(rec-table-tfoot)`
 * block (see that component's class doc comment), since `Table.Td` is
 * reused inside `Table.Tfoot` rather than a separate footer-cell
 * component existing.
 */
@Component({
  selector: "rec-table-tfoot",
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./table-tfoot.component.css",
  host: { role: "rowgroup" },
  template: `<ng-content />`,
})
export class TableTfootComponent {}
