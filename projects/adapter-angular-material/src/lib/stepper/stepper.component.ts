import {
  AfterContentInit,
  Component,
  ContentChildren,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  QueryList,
  ViewEncapsulation,
} from "@angular/core";
import { Subscription } from "rxjs";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";
import { STEPPER_CONTEXT, StepperContext } from "./stepper-context";
import { StepComponent } from "./stepper-step.component";

export type RecursicaStepperSize = "small" | "large";
export type RecursicaStepperOrientation = "horizontal" | "vertical";

/**
 * Recursica `Stepper` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). The step-9
 * stub's own findings row (`MatStepper`, category EASY — "Direct, rich
 * match: `orientation`... `labelPosition`, `headerPosition`, per-step
 * completion/error state via `MatStep`") did not survive reading the real
 * compiled source (`node_modules/@angular/material/fesm2022/stepper.mjs`),
 * the same lesson `Tabs`'s own notes already recorded for `MatTabGroup`:
 *
 * 1. **`MatStepper`'s own template builds its entire header AND content
 *    DOM itself**, inside its own component view — confirmed
 *    `encapsulation: ViewEncapsulation.None` on both `MatStepper` and
 *    `MatStepHeader` in the real compiled metadata. Every `.mat-step-icon`/
 *    `.mat-step-label`/`.mat-horizontal-stepper-header` element it renders
 *    belongs to *its own* view, never this adapter's — the identical
 *    `ViewEncapsulation.Emulated`-can-never-reach-it problem `Tabs`'s notes
 *    already document for `MatTabGroup`'s header, just for a stepper's
 *    header instead of a tab list's.
 * 2. **`MatStep` fuses one step's label/state *and* its lazily-rendered
 *    body into a single `<mat-step>` element** (`ContentChild(MatStepLabel)`
 *    for the label, `<ng-content>` + a `CdkPortalOutlet` for the body,
 *    confirmed in the real `MatStep`/`MatStepper` template) — there is no
 *    way to get "just the header, no body machinery" out of one
 *    `<mat-step>` the way this component's real contract needs. This
 *    matters *more* here than it did for `Tabs`, not less: the
 *    source-of-truth's own `Stepper.module.css` ships `.content { display:
 *    none; }` with the comment "Recursica Steppers are purely
 *    navigational/structural" (confirmed directly in
 *    `recursica-adapter-mantine-v8/src/components/Stepper/Stepper.module.css`)
 *    — Recursica's `Stepper` **never renders step body content at all**,
 *    so `MatStep`'s entire lazy-content/`CdkPortalOutlet`/animated-container
 *    system (the bulk of `MatStepper`'s real compiled template) would be
 *    pure unused machinery wrapped around a component that only ever needed
 *    the header.
 * 3. **`MatStepper` selects by numeric `selectedIndex`**, which *does*
 *    match Recursica's own `active: number` contract (confirmed against the
 *    real `@mantine/core` `StepperProps.active`/`StepperStepProps.state`)
 *    — the one place the stub's guess was directionally right. Doesn't
 *    change the outcome given (1) and (2) above.
 *
 * **Decision**: build `Stepper` from scratch — this component (`rec-stepper`,
 * state owner: `active`/`(stepClick)`) + `StepComponent` (`rec-stepper-step`,
 * the clickable step button + icon + label/description) +
 * `StepperCompletedComponent` (`rec-stepper-completed`, API-parity-only —
 * see its own doc comment for why it renders nothing). Full control over
 * the exact `.root`/`.steps`/`.step`/`.separator`/`.verticalSeparator` DOM
 * shape the ported CSS (from the real source-of-truth `Stepper.module.css`)
 * expects, with zero fighting against `MatStepper`'s content/animation
 * subsystem this component structurally cannot use anyway.
 *
 * State is provided to `StepComponent` via `STEPPER_CONTEXT`
 * (`stepper-context.ts`), the same DI-context pattern `TABS_CONTEXT`
 * established for `Tabs`. Unlike `Tabs` (string `value`, caller-supplied),
 * `Stepper` is index-based — each `StepComponent`'s `index`/`isLast` is
 * assigned here, from real `ContentChildren` order, in `ngAfterContentInit`.
 */
@Component({
  selector: "rec-stepper",
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./stepper.component.css",
  providers: [{ provide: STEPPER_CONTEXT, useExisting: StepperComponent }],
  template: `
    <div
      class="root"
      [attr.data-size]="size"
      [attr.data-orientation]="orientation"
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
    >
      <div class="steps" [attr.data-orientation]="orientation">
        <ng-content />
      </div>
    </div>
  `,
})
export class StepperComponent
  implements StepperContext, RecursicaOverStyled, AfterContentInit, OnDestroy
{
  /** `RecursicaStepperProps` (Mantine-inherited) `active` — index of the active step. */
  @Input() active = 0;

  /** `RecursicaStepperProps.size` — visual size variant. */
  @Input() size: RecursicaStepperSize = "large";

  /**
   * Not part of the canonical `RecursicaStepperProps` contract — inherited
   * in the React reference from Mantine's own `StepperProps.orientation`,
   * which has no equivalent underlying type to inherit from here (same
   * situation `Tabs`'s own `orientation` notes already document).
   */
  @Input() orientation: RecursicaStepperOrientation = "horizontal";

  /** Mantine's `StepperProps.allowNextStepsSelect` (default `true`). */
  @Input() allowNextStepsSelect = true;

  /** Mantine's `StepperProps.onStepClick`. */
  @Output() stepClick = new EventEmitter<number>();

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  @ContentChildren(StepComponent, { descendants: true })
  private readonly stepsQuery!: QueryList<StepComponent>;

  private stepsSubscription?: Subscription;

  ngAfterContentInit(): void {
    this.assignStepIndices();
    this.stepsSubscription = this.stepsQuery.changes.subscribe(() =>
      this.assignStepIndices(),
    );
  }

  ngOnDestroy(): void {
    this.stepsSubscription?.unsubscribe();
  }

  private assignStepIndices(): void {
    const steps = this.stepsQuery.toArray();
    steps.forEach((step, index) => {
      step.index = index;
      step.isLast = index === steps.length - 1;
    });
  }

  get activeIndex(): number {
    return this.active;
  }

  /**
   * Real `typeof onStepClick !== "function"` check from `Stepper.mjs`,
   * translated to Angular's `EventEmitter`/RxJS `Subject.observed`.
   */
  get hasClickListener(): boolean {
    return this.stepClick.observed;
  }

  selectStep(index: number): void {
    this.stepClick.emit(index);
  }

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }
}
