# TransferList — Implementation Notes

**Status**: REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

## `Category: DOES NOT EXIST` re-confirmed

The stub's own `IMPLEMENTATION_NOTES.md` already flagged this
(`MatSelectionList`/`MatListOption` give a multi-select list building
block, but no packaged dual-list transfer component exists) — re-confirmed
at build time. Hand-built by composing this adapter's own already-real
`Badge`/`Button`/`TextField`/`Checkbox` components, mirroring the
reference's own `TransferList.tsx` composition almost 1:1 — not a
Material-wrappable widget at all.

## `Checkbox`, not `CheckboxGroup` — a real divergence, not an oversight

The reference composes Mantine's own headless `CheckboxGroup` purely for
ARIA grouping — a thin wrapper with no visible chrome of its own. This
adapter's own `CheckboxGroupComponent` is not that: it composes
`FormControlWrapperComponent` directly (confirmed by reading its own class
doc comment), meaning nesting one inside each pane would render a second,
unwanted label/description/assistive-text/error chrome block per group —
the same category of mismatch that made `Dropdown` reject nesting
`FormControlWrapperComponent` internally. Each pane instead renders plain
`<rec-checkbox>` elements directly inside a `role="group"` div
(`aria-label` set to the group name for named groups) — real ARIA grouping
semantics with none of `CheckboxGroupComponent`'s own extra form-field
chrome.

## One shared `#paneTpl`, not two duplicated pane blocks

The reference's own `renderPane()` is a plain function called twice
(source, target). This component's Angular equivalent is one
`<ng-template #paneTpl let-pane>` instantiated twice via
`[ngTemplateOutletContext]`, each with a precomputed
`RecursicaTransferListPaneView` (filtered items, grouped/ungrouped split,
selection set, count text) computed in `buildPaneView()` — the same
"compute a view-model object, hand it to one shared template" shape this
adapter already uses for other repeated structure.

## Search field labeling: a real `<label for>`, not an inert `aria-label` attribute

An early draft bound `[attr.aria-label]` directly on the `<rec-text-field>`
custom-element tag — this is a real, live-caught bug, not a stylistic
choice: `TextFieldComponent` has no `ariaLabel` `@Input()` (confirmed by
reading `text-field.component.ts` directly), so an `aria-label` attribute
set on the _wrapper_ custom element never reaches the actual focusable
`<input>` inside it — a screen reader computes the accessible name from
the real focused element, not an unrelated ancestor's attribute. Fixed
with a real, visually-hidden `<label for="...">` paired to the input's own
`[id]` (`TextFieldComponent` does forward `id` to its internal `<input>`,
confirmed in the same file) — the same visually-hidden clip-rect technique
`switch.component.css`'s own `.input` rule already establishes in this
adapter.

## Read-only display: array `readOnlyValue`, `ReadOnlyFieldComponent` already joins it

`ReadOnlyFieldComponent`'s own `"text"` type formatting already joins an
array value with `", "` (confirmed by reading `read-only-field.component.ts`
directly) — passing the target pane's labels straight through as
`readOnlyValue` reproduces the reference's own
`readOnlyValue={effectiveData[1].map((item) => item.label)}` with no
custom `readOnlyTemplate` needed (unlike `Slider`, which needed one for
dedicated typography tokens this component has none of).

## Not built: drag-and-drop reordering/transfer

Confirmed by reading `TransferList.tsx` directly: the reference itself has
no drag-and-drop — items move only via the four transfer buttons or
(implicitly, per its own `Checkbox`/`onChange` wiring) checkbox selection.
Nothing to build or skip here; noted only because a "transfer list" name
sometimes implies drag-and-drop in other design systems, and this one
genuinely doesn't have it.

## Verification

**Real signal, this session**: fresh `ng build`, `tsc --noEmit`, and
`eslint` all clean — but not first pass. `rec-button`'s own `iconOnly`
input has no `booleanAttribute` transform (confirmed live: a bare
`iconOnly` attribute in the template type-checked as the literal string
`""`, not `true`, tripping a real `tsc` error), fixed by binding
`[iconOnly]="true"` explicitly. The `aria-label`-on-the-wrong-element bug
above was also caught and fixed before this pass, not left in. All 8
golden-matching stories (Default, Grouped, SideBySide, NoSearch,
StaticError, StaticDisabled, Empty, ReadOnly) confirmed registered and
compiling with zero webpack errors in a live Storybook dev server (port
6007, isolated from the developer's own 6006 instance).

**Not done, same flag as every component built this session**: no
browser/Playwright tooling available, so the actual checkbox-toggle/
transfer-button/search-filter interaction flow and real screen-reader
announcement of the `role="group"` blocks were reasoned from the code, not
click- or screen-reader-verified.
