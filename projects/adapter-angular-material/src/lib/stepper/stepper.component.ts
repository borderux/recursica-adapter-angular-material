import { Component, Input, ViewEncapsulation } from "@angular/core";
import { InDevelopmentStubComponent } from "../in-development-stub/in-development-stub.component";

/**
 * Recursica `Stepper` — Angular Material adapter.
 *
 * STUB (docs/CREATING_AN_ADAPTER.md step 9): no real behavior is
 * implemented yet. Renders the shared `<rec-in-development-stub>`
 * placeholder. See IMPLEMENTATION_NOTES.md in this folder for the
 * integration-report findings this stub was seeded from.
 */
@Component({
  selector: "rec-stepper",
  imports: [InDevelopmentStubComponent],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./stepper.component.css",
  template: `<rec-in-development-stub componentName="Stepper" />`,
})
export class StepperComponent {
  @Input() orientation?: "horizontal" | "vertical";
  @Input() labelPosition?: "bottom" | "end";
  @Input() headerPosition?: "top" | "bottom";
}
