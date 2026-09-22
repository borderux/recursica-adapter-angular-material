# Menu — Implementation Notes

**Status**: real implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

Wraps `MatMenu`/`MatMenuTrigger`/`MatMenuItem` — a mature, CDK-Overlay-backed
compound API, but shaped differently from the genesis adapter's Mantine dot
notation. `rec-menu` covers both Mantine's `<Menu>` root and `<Menu.Dropdown>`
(one `<mat-menu>` wraps both roles); `rec-menu-item`/`rec-menu-divider`/
`rec-menu-label` mirror `Menu.Item`/`Menu.Divider`/`Menu.Label`.

## No `<rec-menu-target>`

Mantine's `Menu.Target` exists to `cloneElement()` a ref/click-handler onto
the trigger. Angular doesn't need this — `[recMenuTriggerFor]`
(`menu-trigger-for.directive.ts`) attaches directly to the real trigger
element via Angular's `hostDirectives` (composing Material's own real
`MatMenuTrigger`, not reimplementing its open/close/positioning/keyboard
logic). This directive only exists so callers pass this adapter's own
`MenuComponent`, never a raw `MatMenu`.

## Styling: split between component-scoped CSS and a global stylesheet

`MatMenuItem`'s `<button mat-menu-item>` **is** `MenuItemComponent`'s own
template output — Angular stamps its Emulated encapsulation attribute on it
regardless of where content projection ultimately renders it, so
`menu-item.component.css`'s normal scoped rules reach it exactly like
`button.component.css` reaches its own `<button matButton>`.

`MatMenu`'s panel container (`.mat-mdc-menu-panel`/`.mat-mdc-menu-content`)
is different: it's Material's own internal component, rendered via CDK
Overlay outside any of this adapter's own views (same situation as
`Tooltip` — see its `IMPLEMENTATION_NOTES.md`). Its styling ships in
`menu-overlay.css`, a global package asset scoped under `.rec-menu`
(`MatMenu`'s own `panelClass` input, aliased to `class`) and gated behind
`[data-recursica-theme]`.

## `overStyled`: `overClass` only — no `overStyle`

Same reasoning as `Tooltip`: the panel is created/destroyed by CDK on every
open/close, no safe stable `ElementRef` to hand inline styles to.

## Not yet implemented: `Menu.Sub` (nested submenus)

The genesis adapter's `Menu.Sub`/`Menu.Sub.Target`/`Menu.Sub.Item`/
`Menu.Sub.Dropdown` have no equivalent here yet. `MatMenuItem` has native
submenu-trigger support (`_triggersSubmenu`) and nesting a second
`<rec-menu>` likely composes via the same `[recMenuTriggerFor]` directive
applied to a `rec-menu-item`, but this hasn't been built or verified —
real follow-up work, not silently dropped.

## `leftSection`/`rightSection`

`TemplateRef`s, not projected-content slots — same translation as
`Button`'s `icon`. `MatMenuItem`'s own template has only a single icon
slot (no leading/trailing split the way Recursica's tokens expect), so
`MenuItemComponent` renders its own wrapper spans instead of relying on it.
