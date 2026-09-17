# DatePicker — Implementation Notes (pre-implementation stub)

**Status**: stub (`docs/CREATING_AN_ADAPTER.md` step 9). No real behavior
is implemented — this component renders the shared
`<rec-in-development-stub>` placeholder and declares only a first-pass
`@Input()` surface.

**Seeded from**: `docs/ADAPTER_INTEGRATION_REPORT.md` §9's
component-by-component mapping table (and, for components with no row of
their own there, its "Additional notable findings" section / the relevant
numbered Q&A). **This is a pre-implementation survey, not a substitute for
step 10's own prop audit against `@angular/material`'s real `.d.ts` at
implementation time** — re-verify every claim below before building.

## Integration report findings

- **Category**: REQUIRES WORK
- **Angular Material / CDK candidate**: `MatDatepicker`/`MatDatepickerInput`/`MatCalendar`/`MatDateRangePicker` (`datepicker.d.ts`)
- **Notes**: The most capable starting point of any 'hard' component surveyed across any adapter so far — a real calendar popup, single and range selection, all built in. Still real integration work (needs a `DateAdapter` provider configured for locale/format handling, and Material's month/year-grid UI needs restyling to match Recursica tokens), but categorically easier than Beam's 'no calendar UI exists anywhere.'

## First-pass `@Input()` surface (this stub only — not audited)

A minimal, best-effort guess at the Recursica-facing inputs this component
will likely need, based on the report findings above. Not exhaustive, not
verified against the real Material `.d.ts` — step 10's own audit
(`docs/CREATING_AN_ADAPTER.md` step 10 item 1) supersedes this list.

- `label`: `string`
- `disabled`: `boolean`
- `min`: `Date`
- `max`: `Date`
