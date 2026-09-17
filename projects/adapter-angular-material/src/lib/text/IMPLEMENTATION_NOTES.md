# Text — Implementation Notes (pre-implementation stub)

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
- **Angular Material / CDK candidate**: _(none — Sass typography mixins only, not a component; see Q6)_
- **Notes**: Material's typography system (`_typography.scss`'s `body-small`/`title-large`/etc. mixins) is 100% a build-time Sass authoring convenience for an app's own stylesheets, not a UI-kit component Recursica could wrap. There is no `<mat-text>` element, no `matText` directive, nothing importable at the TS/component level. `Text`/`Heading` need to be built as genuinely new Angular components from scratch, rendering a native element with Recursica's own `recursica_brand_typography_*` classes applied directly.

## First-pass `@Input()` surface (this stub only — not audited)

A minimal, best-effort guess at the Recursica-facing inputs this component
will likely need, based on the report findings above. Not exhaustive, not
verified against the real Material `.d.ts` — step 10's own audit
(`docs/CREATING_AN_ADAPTER.md` step 10 item 1) supersedes this list.

- `variant`: `string`
- `weight`: `string`
