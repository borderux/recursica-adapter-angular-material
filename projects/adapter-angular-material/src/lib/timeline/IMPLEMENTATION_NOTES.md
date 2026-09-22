# Timeline — Implementation Notes

**Status**: REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

## `Category: DOES NOT EXIST` re-confirmed

The stub's own `IMPLEMENTATION_NOTES.md` already flagged this — no
`@angular/material`/`@angular/cdk` export resembling a connected event
list exists. Re-confirmed at build time. Hand-built, the same approach
`Stepper` (also effectively `DOES NOT EXIST` once `MatStepper` was
rejected) already establishes in this adapter.

## `TIMELINE_CONTEXT` + index assignment — same architecture as `Stepper`

`active: number` is provided to every `TimelineItemComponent` via
`TIMELINE_CONTEXT` (`useExisting`) — the same DI-context translation
`STEPPER_CONTEXT` establishes for Mantine's implicit `cloneElement`-based
prop drilling (see `timeline-context.ts`'s own doc comment). Each item's
own `index`/`isLast` is assigned by `TimelineComponent` from real
`ContentChildren` order in `ngAfterContentInit` — the identical
`assignStepIndices()` pattern `stepper.component.ts` already establishes,
reused here rather than inventing a second technique for the same shape of
problem.

## `active` semantics: `index <= active` — a real, confirmed-not-guessed threshold

Confirmed by reading `Timeline.module.css` directly: title/description/
timestamp/connector/bullet colors are ALL driven by a single
`[data-active]`-gated rule set per item, applied to _every_ item with
index at or below the reference's own `active={1}` golden-story value
(both stories use `active={1}` with 4 items, and the module CSS gates
every visual property — not just the bullet — on this same per-item
boolean) — i.e. "completed/passed" steps, not just the single step
_currently at_ `active`. Reproduced as `index <= active` in
`TimelineItemComponent`'s own `isActive` getter.

## No cross-component `--tl-bullet-size`/`--tl-line-width` sync needed — this component owns the connector directly

The reference syncs bullet size with connector-line positioning via
Mantine's own internal CSS custom properties, because Mantine's _own_
unstyled `Timeline` component owns the connector geometry the reference
has to steer from outside. This adapter hand-builds the connector itself
(`.item::before`, a real `border-left` positioned behind the bullet) —
`[data-variant]` switches all bullet-sizing tokens directly in
`TimelineItemComponent`'s own stylesheet, with no cross-component custom
property indirection needed at all.

## `timestamp` wraps `<ng-content>` in `.description` only when set — matches the reference's own conditional structure

`TimelineItem.tsx`'s own `content = timestamp ? (<>{children && <div
className={styles.description}>{children}</div>}<div
className={styles.timestamp}>{timestamp}</div></>) : children` is
reproduced literally: the projected description only gets its own
`.description` wrapper when `timestamp` is supplied, otherwise it renders
unwrapped — not always wrapped, which would diverge from the reference's
own conditional DOM shape with no golden-story coverage to justify it (all
golden stories in this adapter's own `timeline.stories.ts` set
`timestamp` on every item, so the unwrapped branch is untested but kept
for API-contract completeness, not deleted).

## `display: contents` host — same technique as `StepComponent`

`TimelineItemComponent`'s host is `display: contents` so its own `.item`
becomes a real flex-item sibling inside `<rec-timeline>`'s `.root` column
directly, matching the reference's own flat DOM shape — the identical
reasoning `stepper-step.component.ts`'s own class doc comment documents
for the same technique.

## Verification

**Real signal, this session**: fresh `ng build`, `tsc --noEmit`, and
`eslint` all clean, first pass. Both golden-matching stories (Default,
BulletVariants) confirmed registered and compiling with zero webpack
errors in a live Storybook dev server (port 6007, isolated from the
developer's own 6006 instance).

**Not done, same flag as every component built this session**: no
browser/Playwright tooling available, so the actual connector-line
positioning/alignment across bullet variants, and the visual active/
inactive color transitions, were reasoned from the code and CSS, not
click- or screenshot-verified.
