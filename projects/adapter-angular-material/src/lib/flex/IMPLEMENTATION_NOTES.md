# Flex — Implementation Notes (pre-implementation stub)

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

- **Category**: DOES NOT EXIST
- **Angular Material / CDK candidate**: _(none; see Q5)_
- **Notes**: Confirmed absent from both `@angular/material` and `@angular/cdk` (Q5) — no export anywhere resembling a generic flex/grid layout wrapper. `@angular/cdk/layout` only offers `BreakpointObserver`/`MediaMatcher` (responsive breakpoint detection, no markup/CSS). `Flex`/`Stack`/`Group`/`Grid` all need to be built as light wrappers around plain CSS flexbox/grid, as real Angular components (nothing to wrap).

## First-pass `@Input()` surface (this stub only — not audited)

A minimal, best-effort guess at the Recursica-facing inputs this component
will likely need, based on the report findings above. Not exhaustive, not
verified against the real Material `.d.ts` — step 10's own audit
(`docs/CREATING_AN_ADAPTER.md` step 10 item 1) supersedes this list.

- `gap`: `string`
- `direction`: `string`
- `wrap`: `boolean`
