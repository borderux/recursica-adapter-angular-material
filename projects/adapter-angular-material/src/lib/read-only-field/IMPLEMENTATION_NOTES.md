# ReadOnlyField — Implementation Notes (pre-implementation stub)

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
- **Angular Material / CDK candidate**: _(none)_
- **Notes**: No Material equivalent for 'swap the interactive control for a plain, non-interactive display of its value' as a distinct presentational mode — native `readonly`/`disabled` HTML attributes exist but don't produce Recursica's distinct read-only visual treatment. Matches what was almost certainly true for mantine-adapter's own build of it against Mantine too (not a Material-specific regression).

## First-pass `@Input()` surface (this stub only — not audited)

A minimal, best-effort guess at the Recursica-facing inputs this component
will likely need, based on the report findings above. Not exhaustive, not
verified against the real Material `.d.ts` — step 10's own audit
(`docs/CREATING_AN_ADAPTER.md` step 10 item 1) supersedes this list.

- `label`: `string`
- `value`: `string`
