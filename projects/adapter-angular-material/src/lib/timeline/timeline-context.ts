import { InjectionToken } from "@angular/core";

/**
 * DI-based replacement for the reference's implicit prop-drilling (Mantine's
 * `<Timeline active={n}>` passes `active` down to each `<Timeline.Item>`
 * via `React.cloneElement` internally) — same `useExisting` pattern
 * `STEPPER_CONTEXT`/`TABS_CONTEXT` already establish in this adapter, see
 * `stepper/stepper-context.ts`'s own doc comment for the full "why DI, not
 * `@Input()`" reasoning, not repeated here.
 *
 * Each `TimelineItemComponent`'s own `index`/`isLast` is assigned by
 * `TimelineComponent` from real `ContentChildren` order
 * (`timeline.component.ts`'s `ngAfterContentInit`), the identical
 * `StepComponent`-index-assignment pattern `stepper.component.ts` already
 * establishes — not supplied by the caller.
 */
export interface TimelineContext {
  /** Index of the last "active"/completed item — items with `index <= active` render as active. */
  readonly active: number;
}

export const TIMELINE_CONTEXT = new InjectionToken<TimelineContext>(
  "RecursicaTimelineContext",
);
