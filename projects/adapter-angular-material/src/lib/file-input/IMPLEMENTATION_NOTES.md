# FileInput — Implementation Notes

**Status**: REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

## Genuinely does not exist — re-confirmed, not carried over

The stub's own `IMPLEMENTATION_NOTES.md` already confirmed `Category: DOES
NOT EXIST` (no file-upload/file-input component anywhere in
`@angular/material`/`@angular/cdk`). Re-confirmed at build time. Full
custom build on a native `<input type="file" hidden>`, matching the
reference's own architecture — a `TextField`-shaped clickable/droppable
control with a hidden native file input behind it.

## Composes `FormControlWrapper` internally — matches the reference exactly

Unlike `TextField`/`Dropdown` (external composition) or `TextArea`/
`NumberInput`/etc. (internal composition via `rec-with-read-only-wrapper`),
`FileInput`'s reference renders `<FormControlWrapper>` directly with no
read-only-field indirection at all — confirmed by reading `FileInput.tsx`.
`readOnly` here doesn't route through `ReadOnlyField` — the reference just
renders the same chip-list UI non-interactively
(`interactive = !disabled && !readOnly`), so this component does the same.

## Roving tabindex across chip delete icons — reuses `Chip`'s own escape hatch

`ChipComponent`'s `deleteTabIndex` input is documented on the component
itself as a "roving-tabindex escape hatch for a caller-managed chip group"
— exactly this use case. Only the active chip's delete icon is a real tab
stop; arrow keys move it, mirroring the reference's own `activeChipIndex`/
`deleteIconRefs` mechanism. Since `ChipComponent` doesn't expose its
internal delete-button `ElementRef` directly, focus is moved via
`nativeElement.querySelector('.deleteIcon')` against each chip host
(queried through `@ViewChildren`) — `.deleteIcon` is real light DOM, not
Shadow DOM, so this is a legitimate way to reach it from outside, not a
hack reaching past encapsulation that isn't really there.

## Real a11y fix: click delegation moved to the root, not stopPropagation on children

First draft stopped chip/clear-button clicks from also opening the file
picker the same way the reference does — `stopPropagation()` directly on
`.chipWrapper`/`.chipRow`. `eslint` correctly flagged both
(`interactive-supports-focus`/`click-events-have-key-events`): neither
element is an actual interactive control, so attaching click/keydown
handlers to them for pure event-bubbling management is a real a11y
violation, not a style nag. Fixed by checking the click's real
`event.target` in the root's own click handler instead (`onRootClick`,
`target.closest(".chipRow, .trailingIcon")`) — same net behavior, no
handler on a non-interactive element. `.chipRow` also picked up a real
`role="group"` (a group of removable file chips) — the same reasoning
`tabs-list.component.ts`'s own `role="tablist"` uses to satisfy the
linter for its own keydown-delegation container.

## `accept` re-validated on drop, not just relied on for the native picker

`fileMatchesAccept` (`file-input-item.ts`) is a direct port of the
reference's own `@recursica/adapter-common` helper (read from its compiled
output, since only a `.d.ts` ships in `node_modules` — not the source) —
the native `accept` attribute only filters the file-picker _dialog_, never
a `drop` event, so without re-validating drops manually, `accept` would
silently do nothing for drag-and-drop.

## `controlMaxWidth`/`controlMinWidth`: resolved in TS, not a CSS bridge variable

The reference sets a fixed `controlMaxWidth="var(--file-input-control-max-width)"`
on `FormControlWrapper`, with the _actual_ stacked/side-by-side value
resolved separately in `.layoutOverride[data-form-layout="side-by-side"]`
CSS. This component instead computes the resolved `var(...)` reference
directly in TypeScript (`resolvedControlMaxWidth`/`resolvedControlMinWidth`,
keyed off `formLayout`) — the same pattern `TextArea`/`NumberInput`/
`DatePicker`/etc. already use, simpler than reproducing the reference's
separate CSS-variable bridge for the same result.

## Verification

**Real signal, this session**: fresh `ng build`, `tsc --noEmit`, and
`eslint` all clean (after the click-delegation a11y fix above). All 9
golden-matching stories (Default, WithFile, MultipleFiles, SideBySide,
Disabled, ErrorState, ReadOnly, AcceptRestriction, MaxFilesRestriction)
confirmed registered and compiling with zero webpack/template-parser
errors in a live Storybook dev server (port 6007, isolated from the
developer's own 6006 instance).

**Not done, same flag as every component built this session**: no
browser/Playwright tooling available, so real drag-and-drop, the roving
chip-delete-icon focus, and the accept/maxSize/maxFiles validation logic
are all reasoned from the code, not click-verified.
