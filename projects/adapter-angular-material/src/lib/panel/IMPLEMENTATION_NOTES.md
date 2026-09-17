# Panel — Implementation Notes (pre-implementation stub)

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
- **Angular Material / CDK candidate**: `MatSidenav`/`MatDrawer` (`sidenav.d.ts`)
- **Notes**: `MatDrawer`'s `mode` (`over/push/side`) and `position` give real drawer/side-panel semantics, but it's designed to live inside a `MatSidenavContainer` shell — a heavier structural commitment than a single drop-in `Panel` component; real composition work, not a 1:1 wrap.

## First-pass `@Input()` surface (this stub only — not audited)

A minimal, best-effort guess at the Recursica-facing inputs this component
will likely need, based on the report findings above. Not exhaustive, not
verified against the real Material `.d.ts` — step 10's own audit
(`docs/CREATING_AN_ADAPTER.md` step 10 item 1) supersedes this list.

- `mode`: `'over' | 'push' | 'side'`
- `position`: `'start' | 'end'`
