# Tooltip — Implementation Notes

**Status**: real implementation (`docs/CREATING_AN_ADAPTER.md` step 10). Wraps `MatTooltip`.

## Why this component is architecturally different from Button/Loader

`matTooltip` is an attribute directive (`<button [matTooltip]="...">`), not a
component with its own template — this component's root is a
`<span class="root" [matTooltip]="label">` wrapping the projected trigger
(`display: contents`, so it's layout-transparent).

`MatTooltip`'s floating panel renders through CDK Overlay, appended outside
this adapter's own component tree — `ViewEncapsulation.Emulated`-scoped CSS
in `tooltip.component.css` can never reach it. Real token/beak styling lives
in `tooltip-overlay.css`, a global stylesheet shipped as a package asset
(`ng-package.json`'s `assets`) that a consuming app imports once (`SETUP.md`
step 3). Every rule there is scoped under `.rec-tooltip` (applied via
`matTooltipClass`) and gated behind `[data-recursica-theme]`.

## `position`

Recursica's `top`/`bottom`/`left`/`right` maps onto `MatTooltip`'s own
`above`/`below`/`left`/`right` (`TooltipPosition`). No `-start`/`-end`
alignment variants — `MatTooltip` doesn't have them, a real gap against
Mantine's full `FloatingPosition` union.

## `withBeak`

`MatTooltip` has no arrow/beak of its own — built from scratch as a rotated
square `::after` on the outer `.mat-mdc-tooltip` div, oriented via the CDK
overlay panel's own `.mat-mdc-tooltip-panel-{above,below,left,right}` class.

## `overStyled`

`overClass` only — no `overStyle`. There's no safe way to get a live
`ElementRef` to the overlay panel to apply inline styles to (it's created/
destroyed by CDK on every show/hide; the only reference is the private
`MatTooltip._tooltipInstance`, which this adapter won't depend on).
`overClass` is forwarded into the same `matTooltipClass` binding used for
`.rec-tooltip`/the beak.
