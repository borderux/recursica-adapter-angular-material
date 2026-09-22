# AutoComplete — Implementation Notes

**Status**: REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

## `MatAutocomplete` investigated and rejected — same class of finding as `Dropdown`'s `MatSelect`

The stub's own `IMPLEMENTATION_NOTES.md` flagged `MatAutocomplete` as a
real candidate — re-confirmed against the compiled source before building.
`MatAutocomplete` (the panel) is `ViewEncapsulation.None` and renders via
CDK Overlay with a fixed `ContentChildren(MatOption)` content model —
identical structural shape to `MatSelect`, which `Dropdown` already
rejected for the same reason (no slot for the "icon + two-line label"
rich-option shape). Built directly on `@angular/cdk/overlay`'s
`CdkConnectedOverlay`/`CdkOverlayOrigin` instead, the same primitive
`Dropdown` uses.

## Reuses `Dropdown`'s option data model directly — a real, flagged wrinkle

`RecursicaDropdownOption`/`RecursicaDropdownData`/`normalizeDropdownOption`
are imported from `../dropdown/dropdown-option` rather than duplicated.
The genesis reference's own `AutoComplete.tsx` and `Dropdown.tsx` share a
single `RecursicaComboboxItem` type from `@recursica/adapter-common` for
exactly this reason (confirmed: identical `value`/`label`/`leadingIcon`/
`supportingText` shape in both files). This adapter has no shared-utils
package equivalent, so `AutoComplete` now has a real source-level
dependency on `Dropdown`'s own folder — flagged honestly rather than
silently duplicating the type. Moving it to a shared location would be a
larger refactor touching an already-shipped component, out of scope here.

## Overlay CSS: same live-verified finding as `Dropdown`, ported directly

`auto-complete-overlay.css` follows `dropdown-overlay.css`'s exact
pattern (a `<ng-template cdkConnectedOverlay>` declared in this
component's own template still gets a _different_ `_ngcontent-*` attribute
once CDK Overlay reparents it — see `dropdown.component.ts`'s own "a
global stylesheet is needed after all" section for the original live
finding), scoped under `.rec-autocomplete-panel` instead of
`.rec-dropdown-panel`. Panel-level tokens are `autocomplete`'s own;
per-option padding/icon/gap/selected-state tokens reuse `menu`/`menu-item`
tokens — confirmed this is the reference's own mapping too (its
`AutoComplete.module.css` reuses the identical `menu-item` token names for
`.option`), not a simplification made here.

## Real differences from `Dropdown`, not oversights

- **Free text, not a closed set**: `value` is never constrained to match
  an option — this is a text field that happens to suggest matches, not an
  enum picker. `Dropdown`'s trigger is a `<button>`; this one is a real,
  always-editable `<input>`.
- **Filtering**: case-insensitive "label contains the typed value",
  recomputed on every keystroke — matches the reference's own default
  Mantine `Combobox` filter behavior (confirmed: neither the reference's
  stories nor its own `AUTOCOMPLETE_IMPLEMENTATION_NOTES.md` call for a
  different one).
- **Selecting an option sets `value` to its `label`, not its `value` key**
  — consistent with this being a text field: typing "Jane" and picking the
  "Jane Doe" rich option should leave "Jane Doe" typed in the field.
- **`(mousedown)` + `preventDefault()` on each option, not `(click)`** — a
  real correctness fix, not a style choice. This component closes the
  panel on `(blur)`; without `preventDefault()` on `mousedown`, the input
  would blur (and the panel would close) before the subsequent `click`
  event ever reached the option, so a mouse click on a suggestion would
  silently do nothing. `Dropdown` doesn't hit this because its trigger is
  a `<button>`, with no blur-driven close path competing against option
  clicks.
- **Opens on focus**, not just on click/keydown — conventional autocomplete
  UX shows suggestions as soon as the field is focused, even before typing.
- **No backdrop** (`cdkConnectedOverlayHasBackdrop` is `false`, unlike
  `Dropdown`'s `true`) — closing on outside-click doesn't need one here:
  clicking anywhere else on the page just blurs the input normally
  (browser-native focus behavior), which already triggers this
  component's own `(blur)="close()"` handler.

## Stories: two reference stories intentionally not mirrored

`RichOptionRowPreview`/`RichOptionRowPreviewWrapped` in the reference
render option rows directly, bypassing the real portal entirely, purely
for style-review stability in their own CI pipeline. `WithRichOptions`/
`WithRichOptionsWrapped` here already exercise the same rich-option
rendering through the real component and portal, so the bypass variant
would be redundant, not missing coverage.

## Verification

**Real signal, this session**: fresh `ng build`, `tsc --noEmit`, and
`eslint` all clean. All 10 golden-matching stories (Default,
FormsSideBySide, WithLeadingIcon, WithTrailingIcon, WithRichOptions,
WithRichOptionsWrapped, Disabled, ErrorState, StaticReadOnly,
EditableReadOnly) confirmed registered and compiling with zero webpack
errors in a live Storybook dev server (port 6007, isolated from the
developer's own 6006 instance — confirmed untouched throughout). The
rich-options stories' `[data]="[...]"` inline-array-literal-with-a-`#ref`
syntax (referencing a `<ng-template #userIcon>` declared earlier in the
same template) is a direct port of `dropdown.stories.ts`'s own established
pattern for the identical problem — not reinvented.

**Not done, same flag as every component built this session**: no
browser/Playwright tooling available, so the CDK overlay actually opening
on focus, the mousedown/blur race-condition fix actually working, and the
keyboard nav are all reasoned from the code and Angular's documented event
ordering, not click-verified.
