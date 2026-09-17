# Grid — Implementation Notes (pre-implementation stub)

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
- **Angular Material / CDK candidate**: _(none — `MatGridList`/`MatGridTile` is a fixed-row-height image/tile masonry widget, a false-friend name match, not a general CSS Grid primitive; see Q5)_
- **Notes**: Confirmed a false-friend: `MatGridList` is Material's historical photo-grid widget, not a general-purpose layout primitive. Build as a light wrapper around plain CSS Grid, as a real Angular component. `@angular/cdk/layout`'s `BreakpointObserver` is worth using internally if `Grid` grows responsive breakpoint props.

## First-pass `@Input()` surface (this stub only — not audited)

A minimal, best-effort guess at the Recursica-facing inputs this component
will likely need, based on the report findings above. Not exhaustive, not
verified against the real Material `.d.ts` — step 10's own audit
(`docs/CREATING_AN_ADAPTER.md` step 10 item 1) supersedes this list.

- `columns`: `number`
- `gap`: `string`
