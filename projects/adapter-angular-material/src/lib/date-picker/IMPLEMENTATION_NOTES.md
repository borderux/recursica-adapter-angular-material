# DatePicker — Implementation Notes

**Status**: REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

## `MatDatepicker`/`MatDatepickerInput` adopted — the real calendar, kept

Unlike `MatTabGroup`/`MatSelect`/`MatChip`/`MatStepper`/`MatSlideToggle`
(all rejected because their `ViewEncapsulation.None` DOM had no usable
shape — wrong element fusion, index-based selection, hardcoded pixel
geometry), `MatDatepicker`'s calendar (`MatDatepickerContent` → `MatCalendar`
→ `MatMonthView`/`MatCalendarHeader`) genuinely _is_ `ViewEncapsulation.None`
too (confirmed directly against the compiled source), but the real behavior
underneath — keyboard grid navigation, month/year picking, min/max/disabled
dates, i18n via `DateAdapter` — was worth keeping. This is a _reachability_
problem, not a structural mismatch, so it gets the same treatment
`Dropdown`/`Menu`/`Tooltip` already use for "portaled content my own scoped
CSS can't reach": a global stylesheet targeting Angular Material's own
published class names, not a hand-rebuild. See
`date-picker-control.component.ts`'s own class doc comment for the full
adoption reasoning (points 1–3) — not repeated here.

## Real, narrower scoping gap than `Dropdown`/`Menu`/`Tooltip`'s overlay CSS

`Dropdown`'s own portaled panel is rendered from `DropdownComponent`'s own
template, so it can stamp a custom marker class directly onto it, keeping
every overlay-CSS selector scoped to Recursica's own instances only.
`MatDatepickerContent` (the popup surface) offers no equivalent hook — I
don't own its template, and `MatDatepicker.panelClass` only reaches
`<mat-calendar>` itself (confirmed by reading `MatDatepickerContent`'s
compiled template), not the `mat-datepicker-content` host. So
`date-picker-overlay.css` styles `mat-datepicker-content` by its real,
stable Angular Material class name directly — meaning a plain,
non-Recursica `<mat-datepicker>` used elsewhere inside a Recursica-themed
subtree would pick up this popup-surface styling too. `panelClass` _is_
used (`rec-date-picker-calendar`) to safely scope everything inside the
calendar itself (header, day cells). Documented as a real, narrower
limitation specific to this one component — not present anywhere else in
this adapter.

## Date format: fixed `MM/DD/YY` via a component-level `MAT_DATE_FORMATS` override

Angular's `DateAdapter` system formats via `Intl.DateTimeFormatOptions`
objects, not arbitrary pattern strings the way the reference's `dayjs`
`valueFormat` prop does. `provideNativeDateAdapter({...MAT_NATIVE_DATE_FORMATS,
display: {..., dateInput: {month: "2-digit", day: "2-digit", year: "2-digit"}}})`
is supplied as a **component-level** provider (scoped to just this
component's own view — confirmed this works, since `MatDatepickerInputBase`
resolves `DateAdapter`/`MAT_DATE_FORMATS` via plain `inject()` from its
nearest ancestor injector) so the component works standalone with no host-app
setup required. `Intl.DateTimeFormat("en-US", {month:"2-digit", day:"2-digit",
year:"2-digit"})` already produces exactly `MM/DD/YY`-shaped output
(verified: `08/26/26`), so no custom formatter was needed.

**Not exposed as a per-instance `valueFormat` input** — no golden story
needs a different format; building per-instance override plumbing on top of
Angular's app-level-oriented `DateAdapter` system would be speculative
scope.

**Typed-text parsing**: `NativeDateAdapter.parse()` just calls
`new Date(Date.parse(value))` — no custom format-string parser. Verified
directly: `Date.parse("08/26/26")` and `Date.parse("08/26/2026")` both
correctly parse as August 26 2026 in V8 (Node/Chrome). No golden story
exercises manually-typed edge cases beyond what the calendar itself
produces, so this wasn't pushed further.

## Read-only value: formatted, not `Date.toString()`

Matches the reference's own bug-fix intent
(`DATEPICKER_IMPLEMENTATION_NOTES.md`, "Read-only value format bug fix,
2026-08-30"). `date-picker.component.ts`'s `formattedReadOnlyValue` getter
uses the identical `Intl.DateTimeFormat` options the editable display uses,
so read-only and editable rendering of the same value can never disagree.

## Real bug avoided before it shipped: click handler placement

First draft put `(click)="picker.open()"` on `.root` (a plain `<div>`), to
match the reference's "click anywhere in the field" UX. `eslint` correctly
flagged this (`interactive-supports-focus`/`click-events-have-key-events`):
a non-interactive element with its own click handler and no keyboard
equivalent is a real a11y gap, not a stylistic nag — `.root` isn't in the
tab order. Fixed by moving the handler onto the `<input>` itself (already
focusable, and the leading icon's `.section` box is `pointer-events: none`,
so clicks over it still land on the input underneath — same visual "click
anywhere" result, correct DOM target). Also confirmed
`MatDatepickerInput` already ships a fully-accessible **keyboard** path to
open the calendar (`Alt+↓`, via its own `_onKeydown` host listener) with no
wiring needed here at all — this component only had to add the
mouse-click affordance.

## No `leftSection`/icon on the reference's Mantine side needed a wrapping fix here

Mantine's `DatePickerInput` renders its value as a `<button>`'s block text
content, which wraps by default — the reference's own CSS needed an
explicit `white-space: nowrap`/ellipsis fix for it
(`DATEPICKER_IMPLEMENTATION_NOTES.md`, "Single-line enforcement"). This
component's value lives in a real `<input>` (`matInput`/`MatDatepickerInput`,
both bare directives — see the control component's class doc comment),
which never wraps text to begin with, so that whole bug class doesn't
apply here. A genuine, positive side effect of the Angular-vs-Mantine
primitive difference, not something fixed — there was nothing to fix.

## Not implemented, matching the reference's own scope limit

Range selection (`data-in-range`/`data-comparison-*` calendar states) isn't
styled — the reference's own `RecursicaDatePickerProps` doesn't discriminate
on `type` either, so range mode isn't reachable through either adapter's
public API (see `DATEPICKER_IMPLEMENTATION_NOTES.md` §3: "forward-compatible
groundwork, not a demoed feature"). `min`/`max`-driven disabled-date styling
is wired (`.mat-calendar-body-cell:disabled`/`.mat-calendar-body-disabled`)
but not exercised by any golden story.

**"Outside month" day dimming** (present in the Mantine reference) has no
Angular equivalent to style — a real, structural difference:
`MatMonthView` only renders the current month's real day cells, filling
the calendar-grid offset with blank label cells, not dimmed adjacent-month
day numbers. Not a simplification made here; there's nothing on the
Angular side to dim.

## Verification

**Real signal, this session**: fresh `ng build`, `tsc --noEmit`, and
`eslint` all clean (after the click-handler a11y fix above). All 8
golden-matching stories (Default, FormsSideBySide, WithLeadingIcon,
Disabled, ErrorState, OpenedCalendar, StaticReadOnly, EditableReadOnly)
confirmed registered and compiling with zero webpack errors in a live
Storybook dev server (port 6007, isolated from the developer's own 6006
instance — confirmed untouched, same PID, throughout).

**Not done, same flag as `TextArea`/`NumberInput`**: no browser/Playwright
tooling available this session, so the calendar actually opening on click,
the `Alt+↓` keyboard path, day-cell click selection, and the global overlay
CSS actually painting the popup correctly are all reasoned from the
compiled Angular Material source, not click-verified.

## New global stylesheet — wiring updated

`date-picker-overlay.css` added to both `angular.json` Storybook `styles`
arrays (matching `tooltip-overlay.css`/`menu-overlay.css`/
`dropdown-overlay.css`'s existing entries) and to `SETUP.md`'s import list.
**Incidental fix while there**: `SETUP.md`'s import list was missing
`menu-overlay.css` entirely (present in `angular.json` but never documented
for consuming apps) — added alongside this component's own new line, since
it's the same one-line gap in the same list I was already editing.
