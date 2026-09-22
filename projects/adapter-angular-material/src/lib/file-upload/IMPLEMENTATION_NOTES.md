# FileUpload — Implementation Notes

**Status**: REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

## Genuinely does not exist — same finding as `FileInput`

The stub's own `IMPLEMENTATION_NOTES.md` already confirmed `Category: DOES
NOT EXIST`. Re-confirmed at build time. A dropzone sibling to `FileInput`,
sharing its validation/roving-tabindex machinery behind a different
presentation.

## Reuses `FileInput`'s item type and `fileMatchesAccept` directly

`RecursicaFileUploadItem`/`fileMatchesAccept` are imported from
`../file-input/file-input-item` rather than duplicated — the genesis
reference's own `FileUpload.tsx` and `FileInput.tsx` both import the
identical types/helper from `@recursica/adapter-common` for exactly this
reason. Same documented cross-component dependency
`auto-complete-control.component.ts` already has on `Dropdown`'s option
types, for the same underlying cause (no shared-utils package in this
adapter).

## Real, meaningful difference from `FileInput`: only the Browse button opens the picker

Confirmed by reading `FileUpload.tsx` directly, not assumed from
`FileInput`'s own behavior: `.dropzone` has no click handler of its own —
only the `Browse files` button does. The dropzone still accepts
drag-and-drop across its whole surface, but a plain click on empty
dropzone space does nothing. Reproduced exactly, not defaulted to
`FileInput`'s click-anywhere behavior.

## `readOnly` hides the dropzone entirely, doesn't just disable it

Confirmed by reading `FileUpload.tsx`: `{!readOnly && <div className={styles.dropzone}>...}`
— read-only mode renders only the non-interactive file chip list, no
dropzone/browse-button/hidden-input at all. A real structural difference
from `disabled` (dropzone stays visible but non-functional). Reproduced
via `@if (!readOnly)`, matching `FileUpload.tsx`'s own conditional
rendering exactly rather than reusing `FileInput`'s always-visible-but-
disabled-looking approach.

## `role="group"` on the file list from the start — learned from `FileInput`'s own fix

`FileInput`'s own build hit a real `eslint` a11y violation from a keydown
handler on a non-interactive container (`.chipRow`) and fixed it with
`role="group"`. Applied here from the start on `.fileList` rather than
re-discovering the same issue.

## Verification

**Real signal, this session**: fresh `ng build`, `tsc --noEmit`, and
`eslint` all clean, first pass. All 10 golden-matching stories (Default,
WithFiles, EmptyState, Disabled, ErrorState, CustomIcon, LongFilenames,
ReadOnly, AcceptRestriction, MaxFilesRestriction) confirmed registered and
compiling with zero webpack/template-parser errors in a live Storybook dev
server (port 6007, isolated from the developer's own 6006 instance).

**Not done, same flag as every component built this session**: no
browser/Playwright tooling available, so real drag-and-drop, the roving
chip-delete-icon focus, and the accept/maxSize/maxFiles validation logic
are all reasoned from the code, not click-verified.
