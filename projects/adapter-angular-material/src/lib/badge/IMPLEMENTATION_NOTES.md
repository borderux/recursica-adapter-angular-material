# Badge — Implementation Notes

**Status**: REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

## Genuinely does not exist — re-confirmed, not carried over

The stub's own `IMPLEMENTATION_NOTES.md` already flagged `Category: DOES
NOT EXIST` (`MatBadge` is an overlay _directive_ — `[matBadge]="'4'"`
decorates a host element with a small corner dot/number, e.g. a
notification count on an icon — not a freestanding colored label/pill).
Re-confirmed at build time; no adoption/rejection decision to make since
nothing exists to adopt or reject. Full custom build, ported directly from
`Badge.module.css`.

## `content`/`color` from the stub's own guess: not built

The pre-implementation stub guessed `content: string`/`color: string`
inputs. The real reference takes plain `children` for the label and a
fixed `variant` union (`"alert" | "primary-color" | "success" | "warning"`,
driving `data-variant`-gated token colors), not a freeform color string —
confirmed by reading `Badge.tsx`/`Badge.module.css` directly. This
component uses `<ng-content>` for the label and a `variant` `@Input()`
instead, matching the real API.

## No `leftSection`/`rightSection`

Mantine's `Badge` technically accepts them via inherited passthrough, but
`Badge.module.css` has no styling for either (no icon-size/gap/color token
wiring at all), and no golden story exercises one. Not built — would be
unstyled, unexercised scope creep beyond what the reference itself
supports in practice.

## No polymorphism

Same reasoning as `Avatar`'s identical omission — the reference wraps
itself in Mantine's `createPolymorphicComponent`; Angular has no direct
equivalent, and no other component in this adapter offers one either.

## Verification

**Real signal, this session**: fresh `ng build`, `tsc --noEmit`, and
`eslint` all clean. All 6 golden-matching stories (Default, StaticAlert,
StaticPrimary, StaticSuccess, StaticWarning, LayerOneAlert) confirmed
registered and compiling with zero webpack errors in a live Storybook dev
server (port 6007, isolated from the developer's own 6006 instance).

**Not done, same flag as every component built this session**: no
browser/Playwright tooling available, so the actual rendered token colors
were reasoned from the code, not visually verified.
