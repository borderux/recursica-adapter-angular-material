# Panel — Implementation Notes

**Status**: REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

## `Category: REQUIRES WORK` re-confirmed — `MatSidenav`/`MatDrawer` not adopted

The stub's own `IMPLEMENTATION_NOTES.md` already flagged `MatDrawer` as
designed to live inside a `MatSidenavContainer` shell — "a heavier
structural commitment than a single drop-in `Panel` component". Re-confirmed
at build time: `MatSidenavContainer` requires wrapping page/app-level
markup around every place a Panel might be used, the same category of
structural prerequisite that sank `MatSelect`/`MatTabGroup` elsewhere in
this adapter. Not adopted.

## `MatDialog` adopted instead — same lifecycle as `Modal`, anchored to an edge

Panel's own declarative API (`opened`/`onClose`/`title`/`withOverlay`/
`withCloseButton`) is structurally identical to `Modal`'s — the real
difference is _where_ the content sits (anchored to a screen edge,
full-bleed along that edge), not the open/close/focus-trap/backdrop
mechanics. Reusing `MatDialog` (rather than a second, unrelated overlay
primitive) inherits the same real accessibility behavior `Modal`'s own
notes document, with no `MatSidenavContainer` structural commitment.
`MatDialogConfig.position` anchors the CDK pane to the requested edge
(`{ top: '0', right: '0' }` for `placement="right"`, etc.); full-bleed
edge sizing is expressed in `panel-overlay.css` via a placement-specific
`panelClass` entry, since `position` only sets the pane's origin corner.

## Global overlay CSS — same reachability finding as `Modal`/`Dropdown`/`HoverCard`

`panel-overlay.css` carries the real token styling, scoped under
`.rec-panel-panel-content` — see `modal.component.ts`'s own class doc
comment for the underlying CDK-portal reachability finding this repeats.

**Real, panel-specific finding**: `recursica_variables_scoped.css` only
defines `recursica_ui-kit_components_panel_properties_{min-width,
max-width}` — no `min-height`/`max-height` token pair the way Modal has
both dimensions. Confirmed directly against the token file, not assumed.
This reflects the design system treating Panel primarily as a left/right
side-drawer (height is always 100% of the viewport along that axis).
`top`/`bottom` placements are still functionally supported (own
`calc(100vh - 4rem)` viewport-safety cap, mirroring Modal's own fallback),
but have no dedicated design token to size against — flagged rather than
silently assumed covered.

## No scroll-divider directive — unlike `Modal`

`Panel.module.css` (the reference) has no scroll-divider treatment the way
`Modal.module.css` does, and no `scroll-divider-size`/`colors_scroll-divider`
token pair exists for Panel either (confirmed against both the reference
CSS and `recursica_variables_scoped.css` directly, not assumed from
Modal's own precedent). `ModalScrollDividerDirective` is not reused here —
`PanelComponent`'s own `.bodyWrapper`/`.scrollArea` split still keeps the
footer pinned outside the scrolling area, without the scroll-position
tracking Modal's version adds on top.

## Footer routing: named content projection, not `React.Children.forEach`

Same pattern as `ModalFooterComponent` — `<ng-content select="rec-panel-footer">`
declaratively routes `Panel.Footer` to a fixed-at-bottom slot outside the
scrolling body, instead of the reference's own runtime `children`-array
scanning. `PanelFooterComponent` gets a normal scoped `styleUrl` (real,
independently-instantiated component, not `PanelComponent`'s own portaled
`TemplateRef` chrome) — same reasoning `modal-footer.component.ts`'s own
class doc comment documents.

## Not built: the granular `Panel.Root`/`.Overlay`/`.Content`/`.Header`/

`.Title`/`.CloseButton`/`.Body`/`.Stack`

Confirmed by reading `Panel.stories.tsx` directly: all 4 golden stories
(Default, LeftPlacement, ScrollableContent, LongTitle) use only the
top-level `<Panel opened title placement>children<Panel.Footer>` shape —
none exercise the reference's own "advanced composition" escape hatch or
`Panel.Stack` (stacked-drawer context). Building 8 additional public
sub-components with no golden coverage would be speculative scope, the
same reasoning `Modal`'s own granular sub-components were skipped for.

## `@angular-eslint/prefer-inject`: used `inject()` from the start

Same discipline as `Modal`/`HoverCard` — `MatDialog` injection uses
`inject()` from the start.

## Verification

**Real signal, this session**: fresh `ng build`, `tsc --noEmit`, and
`eslint` all clean, first pass. All 4 golden-matching stories (Default,
LeftPlacement, ScrollableContent, LongTitle) confirmed registered and
compiling with zero webpack errors in a live Storybook dev server (port
6007, isolated from the developer's own 6006 instance).

**Not done, same flag as every component built this session**: no
browser/Playwright tooling available, so the actual slide-in animation,
edge-anchored positioning at real viewport sizes, focus trap, and
close-button/backdrop/Escape behavior were reasoned from the code (and
from `Modal`'s own already-working `MatDialog` foundation), not
click-verified.

## Always non-modal, with no props to change it

Decision (Matt Massey, 2026-10-08), matching the React adapter's Panel
(`PANEL_IMPLEMENTATION_NOTES.md` §10): the page behind a panel stays usable. A
panel is never modal and has no inputs to make it so.

- **No overlay:** `hasBackdrop: false`.
- **No focus trap:** `MatDialog` has no switch for its focus trap (the CDK
  container always renders two `cdk-focus-trap-anchor` sentinels), so the panel
  removes them after the first render. With no sentinels `Tab` leaves the panel
  into the page and back. This depends on CDK's class name; re-check it on CDK
  major upgrades.
- **No `aria-modal`:** `ariaModal: false`, and no `aria-hidden` on the rest of
  the page.
- **No scroll lock:** the `noop` scroll strategy.
- **Focus returns** to the opener on close (`restoreFocus: true`).
- **`Escape` always closes it.** Clicking the page behind never does.
  `MatDialog`'s own `disableClose` is turned on so closing goes through the one
  Escape handler (`keydownEvents()`).

The earlier `withOverlay`, `closeOnClickOutside`, `closeOnEscape`, `trapFocus`,
`lockScroll` and `returnFocus` inputs were removed. Previously
`closeOnClickOutside=false` also turned off Escape, because `MatDialog` has one
`disableClose` flag for both. Initial focus still lands on the panel container
(`autoFocus: "dialog"`), which has to take focus for assistive technology to
announce the panel.

## `wrapHeaderText`

`rec-panel` `[wrapHeaderText]` (default `true`, as in React). React picks `styles.titleTruncate` when `true` and `styles.title` when `false`. Reading `Panel.module.css`: `.titleTruncate` composes `.title` and adds `white-space: nowrap`, clipped overflow with `text-overflow: ellipsis`, `flex: 1`, `min-width: 0`; plain `.title` has only the typography tokens, so it wraps. So the name is inverted from the behaviour: `true` = single line with ellipsis, `false` = wraps. Here the truncation rules in `panel-overlay.css` apply only to `.title[data-truncate]`, which the template sets when `wrapHeaderText` is true; `false` omits it and the title wraps. The existing `flex: 1 1 auto; min-width: 0` stays in both cases (harmless when wrapping; keeps the close button at the end). No new tokens. Overlay behaviour is unchanged.
