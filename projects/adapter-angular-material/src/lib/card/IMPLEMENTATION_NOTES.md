# Card — Implementation Notes

**Status**: real implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

Wraps `mat-card` for the root only — its real compiled template is just
`<ng-content></ng-content>` (confirmed in `@angular/material/fesm2022/card.mjs`),
no CDK Overlay involved, so this adapter's scoped CSS reaches it normally
like any plain element.

`appearance` (`outlined`/`filled`/`raised`) is never exposed — Recursica's
Card always applies its own border/background/elevation tokens
unconditionally, matching the genesis adapter's own `UNSUPPORTED_PROPS`
strip of the equivalent Mantine knobs.

## `Header`/`Footer`/`Content`/`Section`: built from scratch, not `mat-card-*`

Material's `mat-card-header`/`mat-card-content`/`mat-card-actions` carry
fixed structural assumptions (an avatar + title-group split, hardcoded
16px paddings not token-driven) that don't match Recursica's flat
header/footer/content/section model — same reasoning the genesis adapter
already applies (its own `CardHeader`/`CardFooter`/`CardContent` are styled
wrappers around Mantine's generic `Card.Section`/a plain `<div>`, not any
Mantine-specific header/title/avatar sub-components).

## Edge-to-edge bleed: replicated from Mantine's real compiled CSS

The genesis adapter's `CardHeader`/`CardFooter`/`CardSection` all compose
Mantine's own generic `Card.Section`, which bleeds edge-to-edge via
negative margins (confirmed in the real compiled
`@mantine/core/styles/Card.css`: `margin-inline: calc(var(--card-padding) * -1)`,
plus conditional negative `margin-top`/`margin-bottom` on
`:first-child`/`:last-child`). Since there's no Material equivalent to
compose with here, this behavior is reproduced directly: `card.component.ts`
declares a `--card-padding` custom property (inherited by any real DOM
descendant regardless of Angular component boundaries), and
Header/Footer/Section each apply the matching negative margins.

`CardSection` specifically needs `:host(:first-child)`/`:host(:last-child)`,
not plain `:first-child`/`:last-child` on its own inner `.root` — `.root` is
always the sole child of its own component's single-element template, never
a sibling among other `<rec-card-section>`s; `:host()` correctly tests this
component's own host element's position among _its_ siblings inside
`<rec-card>`'s projected content.
