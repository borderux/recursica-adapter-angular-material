# Avatar — Implementation Notes

**Status**: REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

## Genuinely does not exist — re-confirmed, not carried over

The stub's own `IMPLEMENTATION_NOTES.md` already flagged `Category: DOES
NOT EXIST` (`MatListItemAvatar`/`MatGridAvatarCssMatStyler`/
`[mat-card-avatar]` are CSS-class-application directives for slotting an
avatar image inside another component's own header, not a standalone
circular-image/icon/text component). Re-confirmed at build time, not
assumed — no adoption/rejection decision to make here since nothing exists
to adopt or reject. Full custom build, ported directly from the genesis
adapter's `Avatar.module.css`.

## Three display modes, computed like the reference — not caller-chosen

Matches `Avatar.tsx`'s own precedence exactly: `src` (while not yet
errored) wins, then `icon`, then plain projected text content. Broken-image
fallback (`imageErrored`) is this component's own addition — Mantine's
underlying `<Avatar>` handles that internally; a bare `<img>` needs an
explicit `(error)` handler to reproduce the same behavior.

## `initials` input from the stub's own guess: not built

The pre-implementation stub guessed a dedicated `initials: string` input.
The real reference has no such prop (confirmed by reading `Avatar.tsx`
directly) — it renders arbitrary `children` for the text mode (its own
`TextSolidDefault` story passes plain text `"JD"`, not a distinct
"initials" concept). This component uses plain `<ng-content>` for that
slot instead, matching the real API surface, per
`docs/CREATING_AN_ADAPTER.md` step 10's own instruction that the real audit
supersedes the stub's first-pass guess — not implemented as a gap, just
not a real prop.

## `icon` as a `TemplateRef`, not `<ng-content>`

The icon and text modes are mutually exclusive branches
(`@if`/`@else if`/`@else`) — `<ng-content>` can't be conditionally swapped
against them without instantiating whatever's projected regardless of
which branch is actually showing, the same "`TemplateRef`, not
`<ng-content>`" reasoning `WithReadOnlyWrapperComponent`'s own doc comment
documents for its active/read-only swap. `icon` matches `Button`'s/
`Dropdown`'s established `TemplateRef` convention for caller-supplied
markup instead.

## No polymorphism

The reference wraps its implementation in Mantine's
`createPolymorphicComponent` so callers can render Avatar as a different
root element via a `component` prop. Angular has no direct equivalent, and
no other component in this adapter offers one either — not implemented,
matching adapter-wide precedent rather than introducing a new pattern for
just this one component.

## Verification

**Real signal, this session**: fresh `ng build`, `tsc --noEmit`, and
`eslint` all clean. All 4 golden-matching stories (Default,
TextSolidDefault, ImageLarge, IconSmallGhost) confirmed registered and
compiling with zero webpack errors in a live Storybook dev server (port
6007, isolated from the developer's own 6006 instance).

**Not done, same flag as every component built this session**: no
browser/Playwright tooling available, so the broken-image fallback and the
actual rendered token values were reasoned from the code, not
click/visually verified.
