# TimePicker — Implementation Notes

**Status**: REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

## `MatTimepicker` investigated and rejected — a design-fit rejection, not a `ViewEncapsulation` one

The stub's own `IMPLEMENTATION_NOTES.md` flagged a real `MatTimepicker`
exists at this Material version — re-checked directly against its `.d.ts`
before deciding, same rigor as every adoption/rejection call in this
adapter. Rejected because its actual design doesn't match this golden's
contract: `MatTimepicker` (`implements MatOptionParentComponent`, with
`interval`/`options` inputs) is fundamentally a _pick a full "H:MM AM/PM"
string from a scrollable preset list_ control, the same family as
`MatSelect`, just for times. The reference's own design (confirmed against
its golden screenshots) has **no dropdown-list affordance at all** on the
time field — a masked hour/minute(/second) entry sitting next to a
separate, always-visible AM/PM selector. Adopting `MatTimepicker` would
mean bolting on a preset-list feature the design never asked for. See
`time-picker-control.component.ts`'s own class doc comment for the full
reasoning.

## `rec-dropdown` reused directly for AM/PM

The genesis reference had to build a whole separate internal-only
`BareDropdown` component because its own public `Dropdown` wraps
`FormControlWrapper` internally. **Confirmed by reading
`dropdown.component.ts` directly**: this adapter's `DropdownComponent`
does _not_ wrap `FormControlWrapperComponent` internally at all — it's
already exactly the "bare" shape the reference had to build separately.
Reused directly here, sized down via `overStyled`/`overStyle` (the same
escape hatch the reference's own `styles={{ wrapper: { width: "fit-content" } }}`
served). No `RECURSICA_FORM_CONTROL` provider collision: `rec-dropdown` is
nested inside `TimePickerControlComponent`'s own template, invisible to
`FormControlWrapper`'s `@ContentChild` query on the outer projected content.

## Masking: simple digit parsing on blur, not full segmented masking

Mantine's `TimePicker` renders real per-segment masked sub-inputs with
arrow-key increment (`SpinInput`, one per hour/minute/second). Checked
`TimePicker.stories.tsx` directly: none of the 8 golden stories exercise
typing into a real value — `Default`/`WithSeconds`/`Disabled`/`ErrorState`/
`WithLeadingIcon` are all empty-value, and `StaticReadOnly`/`EditableReadOnly`
render through `ReadOnlyField`'s plain text, never this editable field. So
this is a single real `<input>`, parsed on blur (strips non-digits,
interprets as `H(H)MM(SS)?`, clamps hour 1–12/minute+second 0–59) —
genuinely functional, simpler than the reference, honestly scoped to what's
actually exercised rather than speculatively over-built.

## Value reconciliation: same logical shape as the reference, none of its Mantine-specific DOM hacks

The reference's `getHour`/`withHour`/`isPM` helpers and internal value
reconciliation between the time field and the AM/PM control are real,
necessary architecture — copied here in spirit. **Not copied**: ~40 lines
of the reference's own workarounds for Mantine's native hidden AM/PM
`<select>` never reporting a valid `onChange` until manually poked with a
simulated native-setter interaction (`TIMEPICKER_IMPLEMENTATION_NOTES.md`,
"rounds 3 and 6"). That's a Mantine internal-state quirk that doesn't exist
here — both sub-controls are driven by this component's own plain
`value`/`(valueChange)` bindings from the start, so there was nothing to
work around.

## Read-only value: formatted 12-hour + AM/PM

`formatReadOnlyTime` in `time-picker.component.ts` is a direct port of the
reference's identically-named helper — same reasoning (a read-only
`TimePicker` should show "2:30 PM", not the raw "14:30" internal value).

## Design tokens

No dedicated `min-height` token for `time-picker` (confirmed, same finding
as the reference) — `.timeWrapper` uses
`--recursica_ui-kit_globals_form_field_size_single-line-input-height`
instead, the same global `TextField`'s/`DatePicker`'s own token resolves
to, so all land on the same height without borrowing another component's
namespace. Unlike the reference, no `.fieldsGroup` height-collapse
workaround was needed — this component has one plain input, not three
`SpinInput`s each needing `height: 100%` against a concrete parent height.

## Verification

**Real signal, this session**: fresh `ng build`, `tsc --noEmit`, and
`eslint` all clean, first pass (no fixes needed, unlike `DatePicker`'s
click-handler a11y fix). All 8 golden-matching stories (Default,
FormsSideBySide, WithSeconds, Disabled, ErrorState, WithLeadingIcon,
StaticReadOnly, EditableReadOnly) confirmed registered and compiling with
zero webpack errors in a live Storybook dev server (port 6007, isolated
from the developer's own 6006 instance — confirmed untouched throughout).

**Not done, same flag as `TextArea`/`NumberInput`/`DatePicker`**: no
browser/Playwright tooling available this session, so the blur-parse
logic, the AM/PM `rec-dropdown` sync, and the visual result are all
reasoned from the code, not click-verified.
