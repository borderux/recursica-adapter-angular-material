# Badge — Implementation Notes (pre-implementation stub)

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
- **Angular Material / CDK candidate**: `MatBadge` (`badge.d.ts`)
- **Notes**: `MatBadge` is an overlay directive (`[matBadge]="'4'"` decorates a host element with a small corner dot/number, e.g. a notification count on an icon) — not a freestanding colored label/pill component the way Mantine's `Badge` is. There is no Material component for 'a standalone badge/tag element' at all; needs a full custom build.

## First-pass `@Input()` surface (this stub only — not audited)

A minimal, best-effort guess at the Recursica-facing inputs this component
will likely need, based on the report findings above. Not exhaustive, not
verified against the real Material `.d.ts` — step 10's own audit
(`docs/CREATING_AN_ADAPTER.md` step 10 item 1) supersedes this list.

- `content`: `string`
- `color`: `string`
