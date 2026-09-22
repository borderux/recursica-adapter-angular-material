import { Component, Input, ViewEncapsulation, inject } from "@angular/core";
import { STEPPER_CONTEXT } from "./stepper-context";

export type RecursicaStepState = "completed" | "progress" | "upcoming";

/**
 * Recursica `Stepper.Step` — Angular Material adapter.
 *
 * REAL implementation, part of `Stepper`'s compound API (see
 * `stepper.component.ts`'s class doc comment for why this is hand-built
 * rather than wrapping `MatStep`/`MatStepHeader`).
 *
 * Host is `display: contents` (`stepper-step.component.css`) so this
 * component's own two top-level template elements — the clickable
 * `.step` button and, for horizontal orientation, a trailing `.separator`
 * — become real flex-item siblings of `<rec-stepper>`'s `.steps` container
 * directly, exactly matching the DOM shape the source-of-truth's real
 * `Stepper.mjs` produces (`items.push(step); if (horizontal && !last)
 * items.push(separator)`, both siblings of one `.steps` flex row/column).
 * `display: contents` makes this possible without needing `.steps` itself
 * to reach *into* a different component's view the way `Tabs` had to solve
 * for `MatTabGroup` — everything here stays inside `StepComponent`'s own
 * `ViewEncapsulation.Emulated` scope, so no `:host-context()` crossing is
 * needed for `.step`/`.separator` to see each other, only for either to
 * read `<rec-stepper>`'s own `[data-orientation]`/`[data-size]` (a genuine
 * different-component-view boundary, same category `tabs-tab.component.css`
 * already documents).
 *
 * For **vertical** orientation, Mantine renders no separate `.separator`
 * sibling at all — the connecting line (`.verticalSeparator`) lives
 * *inside* each step's own `.stepWrapper`, confirmed directly from the real
 * `StepperStep.mjs`. This component matches that: `.verticalSeparator` is
 * only ever added to the DOM when `ctx.orientation === 'vertical'`, one
 * `<rec-stepper-step>` at a time — no `.separator` sibling render path
 * exists for vertical at all, matching the source-of-truth's own DOM shape
 * exactly rather than reusing the horizontal separator's markup.
 */
@Component({
  selector: "rec-stepper-step",
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./stepper-step.component.css",
  template: `
    <button
      type="button"
      class="step"
      [attr.data-completed]="state === 'completed' ? '' : null"
      [attr.data-progress]="state === 'progress' ? '' : null"
      [attr.data-allow-click]="isClickable ? '' : null"
      [attr.aria-current]="state === 'progress' ? 'step' : null"
      [tabIndex]="isClickable ? 0 : -1"
      (click)="onClick()"
    >
      <span class="stepWrapper">
        <span
          class="stepIcon"
          [attr.data-completed]="state === 'completed' ? '' : null"
          [attr.data-progress]="state === 'progress' ? '' : null"
        >
          @if (state === "completed") {
            <span class="stepCompletedIcon">
              <svg
                viewBox="0 0 10 7"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M4 4.586L1.707 2.293A1 1 0 1 0 .293 3.707l3 3a.997.997 0 0 0 1.414 0l5-5A1 1 0 1 0 8.293.293L4 4.586z"
                  fill="currentColor"
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                />
              </svg>
            </span>
          } @else {
            <span>{{ index + 1 }}</span>
          }
        </span>
        @if (ctx?.orientation === "vertical" && !isLast) {
          <span
            class="verticalSeparator"
            [attr.data-active]="state === 'completed' ? '' : null"
          ></span>
        }
      </span>
      @if (label || description) {
        <span class="stepBody">
          @if (label) {
            <span class="stepLabel">{{ label }}</span>
          }
          @if (description) {
            <span class="stepDescription">{{ description }}</span>
          }
        </span>
      }
    </button>
    @if (ctx?.orientation !== "vertical" && !isLast) {
      <div
        class="separator"
        [attr.data-active]="state === 'completed' ? '' : null"
      ></div>
    }
  `,
})
export class StepComponent {
  /** Mantine's `StepperStepProps.label` — rendered after the icon. Plain string only, see IMPLEMENTATION_NOTES.md for the `StepFragmentComponent` render-prop gap. */
  @Input() label?: string;

  /** Mantine's `StepperStepProps.description`. */
  @Input() description?: string;

  /**
   * Mantine's `StepperStepProps.allowStepSelect` — explicit per-step
   * override. `undefined` (default) defers to `Stepper`'s own
   * `allowNextStepsSelect`/completed-state default, matching the real
   * `shouldAllowSelect()` in `Stepper.mjs` exactly.
   */
  @Input() allowStepSelect?: boolean;

  /**
   * Assigned by the parent `StepperComponent` from real content-child order
   * (`stepper.component.ts`'s `ngAfterContentInit`) — not caller-provided,
   * matching Mantine's own `index` (array position, not an `@Input()` on
   * `Stepper.Step`).
   */
  index = 0;

  /** Also assigned by the parent — suppresses the trailing separator/vertical line on the last step. */
  isLast = false;

  readonly ctx = inject(STEPPER_CONTEXT, { optional: true });

  /**
   * Mirrors the real `Stepper.mjs`: `active === index ? "stepProgress" :
   * active > index ? "stepCompleted" : "stepInactive"` — renamed to this
   * adapter's own `RecursicaStepState` union, same three-way logic.
   */
  get state(): RecursicaStepState {
    const active = this.ctx?.activeIndex ?? 0;
    if (this.index < active) return "completed";
    if (this.index === active) return "progress";
    return "upcoming";
  }

  /** Real `shouldAllowSelect()` from `Stepper.mjs`, translated 1:1. */
  get isClickable(): boolean {
    if (!this.ctx?.hasClickListener) return false;
    if (this.allowStepSelect !== undefined) return this.allowStepSelect;
    return (
      this.state === "completed" || (this.ctx?.allowNextStepsSelect ?? true)
    );
  }

  onClick(): void {
    if (!this.isClickable) return;
    this.ctx?.selectStep(this.index);
  }
}
