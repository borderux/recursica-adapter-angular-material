# FormControlWrapper — Implementation Notes (pre-implementation stub)

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
- **Notes**: Required per Q8, for two independent reasons: (1) side-by-side label layout is architecturally unavailable from `MatFormField` at all — it would need to be faked by placing the label outside `<mat-form-field>`, losing its automatic `<label for>`/`aria-describedby` wiring; a `FormControlWrapper` that owns layout and manually wires that association itself is the only way to get a consistent side-by-side option across every control type. (2) `MatFormField` only covers text-like controls — `MatCheckbox`/`MatRadioButton`/`MatSlideToggle` are never `MatFormFieldControl`s, so even a purely-stacked adapter still needs a hand-built label+description+error layout for choice controls.

## First-pass `@Input()` surface (this stub only — not audited)

A minimal, best-effort guess at the Recursica-facing inputs this component
will likely need, based on the report findings above. Not exhaustive, not
verified against the real Material `.d.ts` — step 10's own audit
(`docs/CREATING_AN_ADAPTER.md` step 10 item 1) supersedes this list.

- `label`: `string`
- `description`: `string`
- `error`: `string`
- `required`: `boolean`
