# Label — Implementation Notes

**Status**: real implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

`MatLabel` (`selector: "mat-label"`) is not a usable standalone component —
confirmed against its real declaration (`form-field2.mjs`): it's a bare
marker directive with no template or `for`-handling logic of its own,
meant only to be placed inside `<mat-form-field>` so `MatFormField`'s own
`ContentChild` query relocates its projected content into Material's
internal floating-label slot. Same conclusion as `AssistiveElement` — no
real Material component to wrap. Built from scratch as a plain `<label>`,
matching the genesis adapter's real `Label.tsx`/`.module.css` structure and
tokens (flex + `order`-based layout for text/asterisk/optional-text/action
area) exactly.

`labelActionArea` is a `TemplateRef`, not a projected-content slot — same
translation as `Button`'s `icon` (no Angular equivalent for "pass a
renderable node as a plain `@Input()` value").

`data-size` is set on the host but this component's own CSS never reads
it — it's a DOM hook for `FormControlLayout`'s own CSS (`.leftSection[data-size=...]`
drives the label column's width), not for anything `Label` does to itself.

## Whether `MatFormField` could replace `FormControlWrapper`/`FormControlLayout` — investigated, no

`MatFormField`'s real compiled template (`form-field2.mjs`) renders its
label only inside `.mat-mdc-form-field-infix` (or the notched outline) —
the same flex container as the actual input, per Material's floating-label
model. There's no supported way to place it as an independent left column
(the side-by-side layout's requirement) — doing so would mean overriding
Material's internal DOM structure via `::ng-deep` with no stability
contract, the same class of fragility that led the genesis adapter to build
its own `FormControlWrapper` instead of Mantine's `Input.Wrapper`.
