import { InjectionToken } from "@angular/core";

/**
 * DI-based replacement for Mantine's `Stepper`/`StepperStep` React-context
 * pairing (`Stepper.context.ts`'s `StepperProvider`/`useStepperContext`),
 * the same translation `TABS_CONTEXT` (`tabs/tabs-context.ts`) already
 * established. `StepperComponent` provides itself under this token
 * (`useExisting`) — `StepComponent` injects it `@Optional()` (never
 * required — a `<rec-stepper-step>` used outside `<rec-stepper>` degrades to
 * "always upcoming, never clickable" rather than throwing).
 *
 * Unlike `TabsContext` (matched by a caller-supplied string `value`),
 * Recursica's `Stepper` contract is **index-based** (`active: number`,
 * `onStepClick(index: number)` — see the real
 * `@mantine/core/.../Stepper/Stepper.d.ts`), matching the source-of-truth's
 * own Mantine-inherited behavior exactly. Each `StepComponent`'s `index` is
 * therefore assigned by `StepperComponent` from real content-child order
 * (`stepper.component.ts`'s `ngAfterContentInit`), not supplied by the
 * caller — there is no equivalent of `TabComponent`'s caller-provided
 * `value` here.
 */
export interface StepperContext {
  /** `RecursicaStepperProps`'s (Mantine-inherited) `active` — the currently active step index. */
  readonly activeIndex: number;
  readonly orientation: "horizontal" | "vertical";
  readonly size: "small" | "large";
  /** Mantine's `StepperProps.allowNextStepsSelect` (default `true`) — see `Stepper.mjs`'s real `shouldAllowSelect()`. */
  readonly allowNextStepsSelect: boolean;
  /**
   * Mirrors Mantine's own `typeof onStepClick !== "function"` check
   * (`Stepper.mjs`) — steps render as non-interactive (not just visually,
   * `tabIndex="-1"` and clicks are no-ops) whenever nothing is listening for
   * a step click, exactly like the source-of-truth's real behavior.
   */
  readonly hasClickListener: boolean;
  /** Called by a clickable `StepComponent` on click — emits `StepperComponent`'s `(stepClick)`. */
  selectStep(index: number): void;
}

export const STEPPER_CONTEXT = new InjectionToken<StepperContext>(
  "RecursicaStepperContext",
);
