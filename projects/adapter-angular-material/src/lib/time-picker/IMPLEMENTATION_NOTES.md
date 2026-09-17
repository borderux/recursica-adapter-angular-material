# TimePicker — Implementation Notes (pre-implementation stub)

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

- **Category**: EASY–REQUIRES WORK
- **Angular Material / CDK candidate**: `MatTimepicker`/`MatTimepickerInput`/`MatTimepickerToggle` (`timepicker/index.d.ts`)
- **Notes**: Notable finding: Angular Material has a real `Timepicker` component (distinct from `Datepicker`), confirmed present at v20.2.14 — a better starting position than Beam had (Beam had nothing at all). Still needs real integration work (`matTimepicker` + `<mat-timepicker>` panel pairing, same composition shape as Autocomplete/Datepicker). Its inputs mix Signal-based (`InputSignal`/`InputSignalWithTransform`) and classic decorator styles — worth deciding deliberately for step 10.

## First-pass `@Input()` surface (this stub only — not audited)

A minimal, best-effort guess at the Recursica-facing inputs this component
will likely need, based on the report findings above. Not exhaustive, not
verified against the real Material `.d.ts` — step 10's own audit
(`docs/CREATING_AN_ADAPTER.md` step 10 item 1) supersedes this list.

- `label`: `string`
- `disabled`: `boolean`
- `interval`: `number`
