import { Component, ViewEncapsulation } from "@angular/core";

/**
 * `Table.Tbody` — element selector (`rec-table-tbody`), same reasoning as
 * `TableTheadComponent`'s own class doc comment (not repeated here):
 * `:host { display: table-row-group }` gives correct CSS table-layout
 * participation with no real `<tbody>` tag needed, `role="rowgroup"`
 * restores the implicit ARIA semantics that would otherwise be lost.
 */
@Component({
  selector: "rec-table-tbody",
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./table-tbody.component.css",
  host: { role: "rowgroup" },
  template: `<ng-content />`,
})
export class TableTbodyComponent {}
