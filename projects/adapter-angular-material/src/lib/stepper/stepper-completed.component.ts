import { Component, ViewEncapsulation } from "@angular/core";

/**
 * Recursica `Stepper.Completed` — Angular Material adapter.
 *
 * REAL implementation, part of `Stepper`'s compound API. Deliberately
 * renders nothing: the source-of-truth's own `Stepper.module.css` ships
 * `.content { display: none; }` with the comment "Recursica Steppers are
 * purely navigational/structural. Content should be managed by the parent
 * layout outside of the Stepper DOM" — confirmed directly in
 * `recursica-adapter-mantine-v8/src/components/Stepper/Stepper.module.css`.
 * That means Mantine's `Stepper.Completed` children (and every
 * `Stepper.Step`'s own children/`content`) are already invisible in the
 * real source-of-truth, in every golden screenshot (none of
 * `ui-kit-stepper--*.png` show any "Completed" text). This component
 * matches that exactly: it accepts projected content (for API parity with
 * `<Stepper.Completed>...</Stepper.Completed>`, so existing call sites
 * compile unchanged) but never renders it into the DOM at all, rather than
 * rendering-then-hiding via CSS — the same visual outcome, reached more
 * directly since this adapter never had Mantine's own content/portal
 * machinery to begin with (see `stepper.component.ts`'s class doc comment).
 */
@Component({
  selector: "rec-stepper-completed",
  encapsulation: ViewEncapsulation.Emulated,
  template: ``,
})
export class StepperCompletedComponent {}
