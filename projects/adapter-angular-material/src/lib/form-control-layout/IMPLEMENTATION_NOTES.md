# FormControlLayout — Implementation Notes (pre-implementation stub)

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
- **Angular Material / CDK candidate**: _(none — build new, per Q8)_
- **Notes**: Recommendation from Q8: for text-like controls, keep using `<mat-form-field>` internally for the stacked case, and only bypass it for the side-by-side case; for choice controls, bypass `MatFormField` entirely in both layouts. `formLayout: 'stacked'|'side-by-side'` has never existed natively in any UI kit surveyed so far (Mantine included) — this is a recommendation for step 8/10 to finalize with a human, not a decision this report closes.

## First-pass `@Input()` surface (this stub only — not audited)

A minimal, best-effort guess at the Recursica-facing inputs this component
will likely need, based on the report findings above. Not exhaustive, not
verified against the real Material `.d.ts` — step 10's own audit
(`docs/CREATING_AN_ADAPTER.md` step 10 item 1) supersedes this list.

- `orientation`: `'stacked' | 'side-by-side'`
