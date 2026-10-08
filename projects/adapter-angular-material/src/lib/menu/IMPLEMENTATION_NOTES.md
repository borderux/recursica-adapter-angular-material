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

## `Menu.Sub` (nested submenus) — built 2026-09-29, via `subMenu` on `rec-menu-item`

The genesis adapter's `Menu.Sub`/`Menu.Sub.Target`/`Menu.Sub.Item`/
`Menu.Sub.Dropdown` have no direct equivalent — instead `rec-menu-item`
takes a `subMenu` input pointing at another `<rec-menu>` (see
`menu-item.component.ts`'s own class doc comment for the full story). Not
the simple wiring first assumed: `[recMenuTriggerFor]` couldn't be reused
(its `hostDirectives` composition puts `MatMenuTrigger` on the wrong DOM
node — the outer `<rec-menu-item>`, not the inner `<button mat-menu-item>`
`MatMenuItem` needs it co-located with), and worse, `MAT_MENU_PANEL`
constructor-time DI — the mechanism Material's own submenu detection
relies on — **never resolves for any content projected through this
adapter's menu components at all**, confirmed by testing `inject(
MAT_MENU_PANEL, {skipSelf:true})` at every boundary and finding it `null`
everywhere (root cause: `<mat-menu>`'s panel content is a deferred
`<ng-template>` CDK Overlay instantiates via a `TemplatePortal` rooted at
the _trigger's_ `ViewContainerRef`, not `MatMenu`'s own tree — a real
CDK/Material property, not an adapter bug). Fixed by directly setting the
same fields Material's own code would have (`_parentMaterialMenu`,
`_setTriggersSubmenu()`), sourcing the _enclosing_ menu via
`@ContentChildren` on `MenuComponent` (works regardless of the DI issue,
since content queries resolve from authored template structure, not
injector hierarchy — the same mechanism `MatMenu`'s own `_allItems`/`items`
queries already rely on).

**Confirmed working**: chevron renders, clicking a submenu-trigger item
opens the nested menu beside the parent (which stays open) — matches
native behavior and is exactly what the reference's own `WithSubmenus`
story (a static `opened`-forced render) needs.

**Known gap, attempted but not resolved**: hover-to-open and keyboard
`ArrowRight`/`Enter` submenu nesting don't work even after also fixing
`_parentMaterialMenu` to reference the correct (enclosing, not sub-) menu
and re-invoking `MatMenuTrigger`'s own `_handleHover()`. Deeper internal
dependencies (`MatMenu._directDescendantItems`/`_hovered()`, the keyboard-
routed synthetic-click path) weren't fully traced — not a regression
(`Enter` on a submenu-trigger item closes the whole menu today, same as
before this fix, when the item wasn't recognized as a submenu trigger at
all). Real follow-up work if hover/keyboard parity matters, not silently
dropped.

## `leftSection`/`rightSection`

`TemplateRef`s, not projected-content slots — same translation as
`Button`'s `icon`. `MatMenuItem`'s own template has only a single icon
slot (no leading/trailing split the way Recursica's tokens expect), so
`MenuItemComponent` renders its own wrapper spans instead of relying on it.

## Passthrough

| Input                                                                                | Forwarded to                                                        | Notes                                                    |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------- | -------------------------------------------------------- |
| `rec-menu` `ariaLabel`/`ariaLabelledby`/`ariaDescribedby` (and hyphenated spellings) | `mat-menu` `aria-label`/`aria-labelledby`/`aria-describedby` inputs | Land on the overlay panel `role="menu"`. Host directive. |
| `rec-menu-item` `ariaLabel`/`ariaLabelledby`/`ariaDescribedby`                       | inner `button[mat-menu-item]`                                       | Host directive.                                          |
| `rec-menu-item` `title`                                                              | inner `button[mat-menu-item]` `title`                               | Host `title` attribute is cleared.                       |
| `rec-menu-label` `id`                                                                | inner `div.root` `id`                                               | `RecursicaElementId`; host `id` is cleared.              |

Withheld:

- `disableRipple` (menu item): Material-only; removed from the public API.
- `hasBackdrop` (menu): Material-only; removed from the public API. The panel keeps `hasBackdrop` fixed to `true`, as before.
- `maxHeight`: canonical prop, not added in this pass (separate step).
- The trigger aria (`aria-haspopup`/`aria-expanded`/`aria-controls` from `recMenuTriggerFor`) is handled separately.
