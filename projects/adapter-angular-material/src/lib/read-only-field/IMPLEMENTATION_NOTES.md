# ReadOnlyField — Implementation Notes

**Status**: REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10).
Ported from the genesis adapter's `ReadOnlyField.tsx` +
`ReadOnlyTextField.tsx` + `ReadOnlyField.module.css`.

Two components live in this folder — see each one's own class doc comment
for full reasoning, summarized here:

## `ReadOnlyFieldComponent` (`rec-read-only-field`)

**Composes `FormControlWrapper` internally — unlike `TextField`/`Dropdown`**.
Every other real field component in this adapter deliberately does _not_
render `FormControlWrapperComponent` internally, because the React
reference's version relies on `React.cloneElement()` to graft `id`/`aria-*`
onto an opaque interactive child — Angular has no equivalent
(`RECURSICA_FORM_CONTROL`/`ContentChild` replaces it, but only works when
the _caller_ composes `<rec-form-control-wrapper>` externally).
`ReadOnlyField` doesn't have that problem: its own "control" is a plain
`<p>` text node it generates itself — nothing opaque to clone attributes
onto, nothing needing `id`/`aria-describedby` (a `<p>` isn't a form
control). So, matching the real `ReadOnlyField.tsx` exactly
(`return <FormControlWrapper>{content}</FormControlWrapper>`), this
component renders `<rec-form-control-wrapper>` directly.

**Data-type formatting**: `type` only changes rendering for `"boolean"`
(`True`/`False`) and `"switch"` (`On`/`Off`) — `"text"`/`"number"`/`"date"`
all render the raw `value` stringified (arrays joined with `", "`),
confirmed against the reference's own `DataTypes` story (passes
already-formatted strings for `number`/`date` — those are presentational
categories only, not a signal this component runs its own
`Intl.NumberFormat`/date formatting).

**Empty-value handling**: mirrors the reference's `EmptyValueRenderer`
two-part API (a `.check()` predicate + fallback renderer) with two
Angular-native escape hatches (no equivalent to passing an arbitrary
polymorphic `React.ElementType` as a prop value): `emptyText` (overrides
just the fallback string, default `"N/A"`) and `emptyValueTemplate` +
optional `emptyValueCheck` (a `TemplateRef` with the empty value in its
`$implicit` context, overriding what counts as "empty"). The emptiness
check always runs against the raw `value`, before type-mapping — `false`
(a valid `boolean`/`switch` value) is never treated as empty.

## `WithReadOnlyWrapperComponent` (`rec-with-read-only-wrapper`)

Angular translation of the genesis adapter's `WithReadOnlyWrapper.tsx` —
the piece other real field components (`TextField`, `Dropdown`, `Checkbox`,
`Radio`, `Switch`) are meant to compose to get a real read-only display
mode. **Not retrofitted into those five** — they were all built before
this component existed and currently approximate `readOnly` with static
disabled-token rendering (see each one's own `IMPLEMENTATION_NOTES.md`,
"Known gap"/"ReadOnlyField gap" section). Retrofitting them is an explicit
follow-up, out of scope here.

`TextArea`, `NumberInput`, `DatePicker`, and `TimePicker` (built after this
component landed) all compose it directly and get genuine ReadOnlyField
parity from day one, matching the reference's own architecture instead of
approximating.

Uses a `TemplateRef` `@Input()` (`activeTemplate`/`readOnlyTemplate`), not
`<ng-content>`, for the active/read-only swap — the React reference hands
over two fully-rendered elements and picks one to mount, so the unmounted
branch's component logic never runs at all. `<ng-content>`-projected
content is already instantiated before this component's own change
detection runs, so hiding it behind `@if` would still construct the
interactive control and run its lifecycle even while inactive. A
`TemplateRef`, rendered via `*ngTemplateOutlet` only in the selected
branch, gives real swap semantics matching the reference — the inactive
branch's view is never created.

## Verification

**Real signal, this session**: fresh `ng build`, `tsc --noEmit`, and
`eslint` all clean. All 8 `ReadOnlyField` stories (Default, EmptyValue,
CustomEmptyText, CustomEmptyRenderer, StackedDefault, SideBySide,
WithEditIcon, DataTypes) + all 3 `WithReadOnlyWrapper` stories (Editable,
ReadOnly, ReadOnlyWithCustomTemplate) confirmed registered and compiling
with zero webpack errors in a live Storybook dev server (port 6007,
isolated from the developer's own 6006 instance).

**Not done**: no browser/Playwright tooling was available this session to
do the click-and-inspect interaction verification (`TextArea`'s launch
message documents this gap first; it applies here too, and to every
component built afterward in this session).
