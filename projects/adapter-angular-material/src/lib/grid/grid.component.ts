import { Component, Input, ViewEncapsulation } from "@angular/core";
import { InDevelopmentStubComponent } from "../in-development-stub/in-development-stub.component";

/**
 * Recursica `Grid` — Angular Material adapter.
 *
 * STUB (docs/CREATING_AN_ADAPTER.md step 9): no real behavior is
 * implemented yet. Renders the shared `<rec-in-development-stub>`
 * placeholder. See IMPLEMENTATION_NOTES.md in this folder for the
 * integration-report findings this stub was seeded from.
 */
@Component({
  selector: "rec-grid",
  imports: [InDevelopmentStubComponent],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./grid.component.css",
  template: `<rec-in-development-stub componentName="Grid" />`,
})
export class GridComponent {
  @Input() columns?: number;
  @Input() gap?: string;
}
