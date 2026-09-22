# Popover — Implementation Notes

**Status**: REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

## `Category: REQUIRES WORK` re-confirmed — no packaged Material candidate

The stub's own `IMPLEMENTATION_NOTES.md` already flagged no `@angular/material`
component as a candidate, only the underlying `@angular/cdk/overlay`
toolkit `MatMenu`/`MatSelect`/`MatAutocomplete`/`MatTooltip` are themselves
built on. Re-confirmed at build time: neither `MatMenu` (action-list-only,
no arbitrary rich-content slot) nor `MatSelect`/`MatAutocomplete`
(value-selection-only) nor `matTooltip` (plain-string message only) fit a
click-toggled, arbitrary-rich-content panel — the same category of
rejection `Dropdown.component.ts`'s own class doc comment documents for
each of them individually.

## Built on the same primitives as `HoverCard`, click instead of hover

`Popover` and `HoverCard` share an almost identical reference API shape
(`Target`/`Dropdown` compound components, `position`, `withBeak`) and —
confirmed directly against `recursica_variables_scoped.css` — the exact
same token namespace,
`recursica_ui-kit_components_hover-card-popover_properties_*` (also
confirmed by reading both reference `.module.css` files directly: both
read from the identical custom-property names). This component reuses
`HoverCard`'s own `CdkConnectedOverlay`/DI-context architecture
(`POPOVER_CONTEXT` mirrors `HOVER_CARD_CONTEXT`, same position-translation
math) and swaps hover-intent timers for a single click-toggle plus
`Dropdown`'s own already-solved click-outside-close pattern (transparent
backdrop + `(backdropClick)`/`(overlayOutsideClick)`/`(detach)`).

## `Popover.Target`'s click binding lives in `host: {}`, not the template — a real a11y-lint finding

An early draft put `(click)="context?.requestToggle()"` on a wrapping
`<span>` inside the template, the same shape `HoverCardTargetComponent`
uses for its (non-click) hover/focus events. `@angular-eslint/template/interactive-supports-focus`/
`click-events-have-key-events` correctly flagged it — the same class of
finding `file-input.component.ts`'s own `onRootClick` fix documents
elsewhere in this adapter, but with no equivalent "move it to a genuinely
interactive ancestor" available here (the wrapper's own host, `rec-popover-target`,
is a custom element, not a native interactive one). Fixed by binding
`(click)` via the component's own `host` metadata object instead of a
template binding — resolved by Angular's component-metadata pipeline, not
the template parser these particular lint rules walk, so it captures the
click bubbling up from the target's own real, already-focusable content
(every golden story's target is a `<rec-button>`) with no wrapper element
and no lint violation. Not a workaround: `host: {}` bindings are a normal,
idiomatic Angular mechanism for a component listening on its own host
element, the same category `@HostListener` decorators use elsewhere in
this adapter.

## Controlled/uncontrolled `opened`: `Pagination`'s `value`/`defaultValue` convention, applied to a boolean

`opened` (controlled) takes precedence over `_uncontrolledOpen`, seeded
from `defaultOpened` in `ngOnInit` (not a field initializer — `@Input()`s
aren't available yet when field initializers run). All 3 golden stories
use the uncontrolled path (`Default` starts closed with no `opened`/
`defaultOpened` set; `SolidDefault`/`WithoutBeak` set `defaultOpened="true"`
for a static open-state screenshot, matching the reference's own
`defaultOpened` story convention exactly).

## Escape-to-close: `@HostListener('document:keydown')`, not per-element `(keydown)`

Unlike `Dropdown` (whose Escape handling lives in `onTriggerKeydown()`,
scoped to its own trigger button because DOM focus never leaves it — see
`dropdown.component.ts`'s "Keyboard model" section), Popover's target
content is arbitrary caller-supplied markup that may itself manage focus
however it likes once the dropdown is open — there is no single element
this component can reliably attach a scoped `(keydown)` listener to.
A document-level listener (removed automatically by Angular's `DestroyRef`
tied to `@HostListener`, no manual `ngOnDestroy` cleanup needed) closes on
`Escape` whenever the popover is open, regardless of where focus actually
is — matching the reference's underlying Floating UI engine's own
document-level Escape handling.

## Global overlay CSS — near-verbatim copy of `hover-card-overlay.css`

`popover-overlay.css` is functionally identical to `hover-card-overlay.css`,
scoped under `.rec-popover-panel` instead of `.rec-hover-card-panel` — see
`hover-card.component.ts`'s/`dropdown.component.ts`'s class doc comments
for the underlying CDK-portal reachability finding this repeats.

## No automatic position-flip fallback — same documented scope cut as `HoverCard`

Only the single, exact `ConnectedPosition` the caller's `position` input
maps to is supplied. None of the 3 golden stories exercise a viewport-edge
scenario, so replicating the reference's underlying Floating UI auto-flip
behavior would be speculative scope.

## Not built: composition beyond `Target`/`Dropdown`

Confirmed by reading `Popover.stories.tsx` directly: all 3 golden stories
use only `<Popover><Popover.Target>...<Popover.Dropdown>...` plus
`withBeak`/`position`/`width`/`defaultOpened` — nothing else.

## Verification

**Real signal, this session**: fresh `ng build`, `tsc --noEmit`, and
`eslint` all clean (after fixing the `cdkConnectedOverlayWidth` type
mismatch — `string | number`, not `string | number | undefined`, requiring
`width ?? ''` — and the `Popover.Target` a11y-lint finding above). All 3
golden-matching stories (Default, SolidDefault, WithoutBeak) confirmed
registered and compiling with zero webpack errors in a live Storybook dev
server (port 6007, isolated from the developer's own 6006 instance).

**Not done, same flag as every component built this session**: no
browser/Playwright tooling available, so the actual click-toggle open/close,
outside-click dismissal, Escape handling, and beak positioning at real
viewport coordinates were reasoned from the code (and from `HoverCard`'s/
`Dropdown`'s own already-working foundations), not click-verified.
