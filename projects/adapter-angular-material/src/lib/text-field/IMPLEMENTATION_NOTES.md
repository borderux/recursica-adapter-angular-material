# TextField — Implementation Notes (pre-implementation stub)

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
- **Angular Material / CDK candidate**: `matInput` directive + `MatFormField` (`form-field.d.ts`, `input.d.ts`)
- **Notes**: From the report's additional findings: `TextField` ≈ `matInput` + `MatFormField` (same composition tax as AutoComplete). `MatFormField` gives `appearance` (`fill`/`outline`), `floatLabel`, `subscriptSizing`, and content-projected `<mat-label>`/`<mat-hint>`/`<mat-error>` slots (Q7). Real form controls implement `ControlValueAccessor`/`Validator` and are meant to be driven by `ReactiveFormsModule` (Crosscutting Finding D) — a real per-component design decision for step 10, not resolved here.

## First-pass `@Input()` surface (this stub only — not audited)

A minimal, best-effort guess at the Recursica-facing inputs this component
will likely need, based on the report findings above. Not exhaustive, not
verified against the real Material `.d.ts` — step 10's own audit
(`docs/CREATING_AN_ADAPTER.md` step 10 item 1) supersedes this list.

- `label`: `string`
- `placeholder`: `string`
- `disabled`: `boolean`
- `required`: `boolean`
- `error`: `string`
