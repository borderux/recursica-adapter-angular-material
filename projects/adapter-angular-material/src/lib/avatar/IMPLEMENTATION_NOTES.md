# Avatar — Implementation Notes (pre-implementation stub)

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
- **Angular Material / CDK candidate**: _(none)_
- **Notes**: Confirmed: `MatListItemAvatar`/`MatGridAvatarCssMatStyler`/`[mat-card-avatar]` are CSS-class-application directives for slotting an avatar image inside List/Card/GridList headers — none of them provide the avatar visual itself (circular image, initials fallback, icon fallback). No standalone Avatar component anywhere in the package. Full custom build, a real regression vs. the genesis kit (Mantine has a native `Avatar`).

## First-pass `@Input()` surface (this stub only — not audited)

A minimal, best-effort guess at the Recursica-facing inputs this component
will likely need, based on the report findings above. Not exhaustive, not
verified against the real Material `.d.ts` — step 10's own audit
(`docs/CREATING_AN_ADAPTER.md` step 10 item 1) supersedes this list.

- `src`: `string`
- `alt`: `string`
- `initials`: `string`
