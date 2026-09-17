import { Component, Input, ViewEncapsulation } from "@angular/core";
import { InDevelopmentStubComponent } from "../in-development-stub/in-development-stub.component";

/**
 * Recursica `Loader` — Angular Material adapter.
 *
 * STUB (docs/CREATING_AN_ADAPTER.md step 9): no real behavior is
 * implemented yet. Renders the shared `<rec-in-development-stub>`
 * placeholder. See IMPLEMENTATION_NOTES.md in this folder for the
 * integration-report findings this stub was seeded from.
 */
@Component({
  selector: "rec-loader",
  imports: [InDevelopmentStubComponent],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./loader.component.css",
  template: `<rec-in-development-stub componentName="Loader" />`,
})
export class LoaderComponent {
  @Input() mode?: "determinate" | "indeterminate";
  @Input() value?: number;
  @Input() diameter?: number;
  @Input() strokeWidth?: number;
}
