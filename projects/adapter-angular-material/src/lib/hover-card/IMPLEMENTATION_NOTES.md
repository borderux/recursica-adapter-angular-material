# HoverCard — Implementation Notes

**Status**: REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

## `Category: REQUIRES WORK` re-confirmed — built directly on CDK Overlay

The stub's own `IMPLEMENTATION_NOTES.md` already flagged this ("same
toolkit as Popover; no packaged hover-triggered variant exists, needs a
manual `mouseenter`/`FocusMonitor`-driven open state on top of the same
Overlay primitives"). Built on `@angular/cdk/overlay`'s
`CdkConnectedOverlay`, the same primitive `Dropdown`/`AutoComplete` use —
not `MatTooltip`, which only accepts a plain string message with no slot
for `HoverCard.Dropdown`'s arbitrary rich content (confirmed, same class
of rejection `Dropdown`'s own `MatSelect` finding documents).

## Compound API via DI, matching `Tabs`' established pattern

`<rec-hover-card>`/`<rec-hover-card-target>`/`<rec-hover-card-dropdown>`
mirrors the reference's own dot-notation composition. `HOVER_CARD_CONTEXT`
(`hover-card-context.ts`) is the same DI-based translation of an implicit
React context `TABS_CONTEXT`/`STEPPER_CONTEXT` already establish — see
`tabs/tabs-context.ts`'s own doc comment for the full reasoning.

## Hover-intent coordination: both target and dropdown keep it open

Confirmed by reading `HOVERCARD_IMPLEMENTATION_NOTES.md` directly (not
assumed): "the dropdown stays open while the user hovers over it."
`requestOpen()`/`requestClose()` are called from both
`HoverCardTargetComponent` and the dropdown panel itself, each cancelling
the other's pending timer, so moving the pointer from target to dropdown
never flickers closed in between.

## Full 12-position support — a real capability `Tooltip` doesn't have

Unlike `Tooltip` (wraps `MatTooltip`, capped at 4 positions — no
`-start`/`-end` alignment, confirmed in `@angular/material/tooltip`'s
compiled declarations), this component computes a real `ConnectedPosition`
for all 12 `top`/`bottom`/`left`/`right` × `-start`/`-end`/none
combinations directly, since it's hand-built on the overlay primitive with
no Material capability ceiling to hit.

## Two real, documented scope cuts

- **No automatic position-flip fallback**: only the single `ConnectedPosition`
  matching the caller's `position` input is supplied — `Dropdown`'s own
  2-entry fallback array isn't reproduced, since none of the 3 golden
  stories exercise a viewport-edge scenario that would need it.
- **Beak precision**: the beak (a real CSS border-triangle, not a sized
  element the way Mantine's JS-driven `arrowSize` works — this adapter has
  no Mantine here to mirror a prop from) is centered on the panel's edge
  for all `-start`/`-end` alignment variants rather than pixel-precisely
  offset toward the aligned corner for all 8 diagonal combinations. None of
  the 3 golden stories use anything but plain `top`, so building that
  precision would be speculative scope — same reasoning `Tabs`' own
  "Outline uses the same bottom-border as Default" simplification
  documents for a different component.

## Real, honest trade-off: dropdown content isn't fully lazy-instantiated

`HoverCardDropdownComponent` wraps its own `<ng-content>` in a local
`<ng-template>`, extracted via `@ViewChild` and rendered elsewhere via
`ngTemplateOutlet` — this defers where the content is _rendered into the
DOM_, but Angular still _instantiates_ `<ng-content>`-projected content as
part of the caller's view the moment `<rec-hover-card-dropdown>` itself is
created, unlike `WithReadOnlyWrapperComponent`'s own `activeTemplate`
`@Input()` (a true `TemplateRef` passed in from outside, never
instantiated until used). The compound `<rec-hover-card-dropdown>...</rec-hover-card-dropdown>`
API shape (callers write literal projected content, not a `#ref`) makes a
true `TemplateRef` `@Input()` impossible here without changing the API
shape entirely — flagged as a real, inherent limitation of this
composition pattern, not an oversight. Acceptable for the small, static
informational content every golden story actually uses.

## `@angular-eslint/prefer-inject`: used `inject()` from the start

Several already-shipped components in this adapter (`checkbox`/`radio`/
`stepper-step`/`switch`/`tabs-list`/`tabs-panel`/`tabs-tab`) predate this
lint rule and still use constructor-parameter injection — pre-existing,
out of scope to fix here. This component's own DI (`HoverCardTargetComponent`/
`HoverCardDropdownComponent` injecting `HOVER_CARD_CONTEXT`) uses `inject()`
from the start instead of adding a new instance of the same debt.

## Verification

**Real signal, this session**: fresh `ng build`, `tsc --noEmit`, and
`eslint` all clean (after switching to `inject()`). All 3 golden-matching
stories (Default, WithoutBeak, RichContent) confirmed registered and
compiling with zero webpack errors in a live Storybook dev server (port
6007, isolated from the developer's own 6006 instance).

**Not done, same flag as every component built this session**: no
browser/Playwright tooling available, so the hover-intent open/close
timing, the beak rendering, and the full 12-position math are all reasoned
from the code, not click-verified.
