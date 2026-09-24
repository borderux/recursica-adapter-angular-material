# Accordion — Implementation Notes

**Status**: real implementation (`docs/CREATING_AN_ADAPTER.md` step 10). This
component didn't exist at all before this change (no stub, no
`src/lib/accordion/` directory).

## `MatExpansionPanel`/`MatAccordion` investigation — rejected, same category as `Tabs`' `MatTabGroup` rejection

Investigated the real compiled source
(`node_modules/@angular/material/fesm2022/expansion.mjs`,
`@angular/material@20.2.14`) before writing any code, the same rigor
`Tabs`/`Dropdown`/`Stepper`/`Chip` already applied to their own Material
candidates (see each one's own `IMPLEMENTATION_NOTES.md`). It doesn't
survive contact, for three compounding reasons:

1. **`MatExpansionPanel` and `MatExpansionPanelHeader` both declare
   `encapsulation: ViewEncapsulation.None`** (confirmed directly in the
   compiled metadata: `args: [{ selector: 'mat-expansion-panel', ...,
encapsulation: ViewEncapsulation.None, ...}]` and the identical flag on
   `mat-expansion-panel-header`). Same structural blocker as `MatTabGroup`
   (see `tabs/IMPLEMENTATION_NOTES.md`) and `MatSelect` (see
   `dropdown/IMPLEMENTATION_NOTES.md`) — a Material component's own view
   boundary means this adapter's own `ViewEncapsulation.Emulated`-scoped CSS
   could never reach DOM built by that view.

2. **The header fuses title, description, and a built-in chevron into one
   fixed template**, confirmed in the same compiled source:

   ```html
   <span class="mat-content" [class.mat-content-hide-toggle]="!_showToggle()">
     <ng-content select="mat-panel-title"></ng-content>
     <ng-content select="mat-panel-description"></ng-content>
     <ng-content></ng-content>
   </span>
   @if (_showToggle()) {
   <span class="mat-expansion-indicator">
     <svg ...>
       <path d="M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z" />
     </svg>
   </span>
   }
   ```

   Recursica's real contract needs a `control`/`label`/`chevron`/
   `iconLeftWrapper` split (from the source-of-truth `Accordion.module.css`)
   with an independently swappable chevron (`RecursicaAccordionProps.chevron`,
   overridable per-control) and a dedicated leading-icon slot
   (`RecursicaAccordionControlProps.leftIcon`) — `MatExpansionPanelHeader`'s
   fixed `mat-content` wrapper plus its own always-present indicator SVG
   (only togglable on/off via `hideToggle`, never replaceable) has no clean
   way to express either.

3. **Fixed, non-token-driven sizing.** `MatExpansionPanelHeader`'s compiled
   styles hardcode `height: var(--mat-expansion-header-collapsed-state-height,
48px)` / `64px` (expanded) and `padding: 0 24px` — Recursica's
   `accordion-header_properties_vertical-padding`/`horizontal-padding`
   tokens drive padding directly with no fixed-height model at all. Working
   around Material's fixed height (removing the CSS var, hoping nothing
   else depends on it) would fight the component rather than use it.

**Decision**: build `Accordion` from scratch — `AccordionComponent`
(`rec-accordion`, state owner) + `AccordionItemComponent`
(`rec-accordion-item`) + `AccordionControlComponent`
(`rec-accordion-control`) + `AccordionPanelComponent`
(`rec-accordion-panel`) — the same category of decision `Tabs` already made
against `MatTabGroup`/`MatTab`, triggered by the same root cause
(`ViewEncapsulation.None` + a fused, non-reshapeable DOM template), plus a
third, sizing-specific blocker `Tabs` didn't have to deal with. This gives
full, direct control over the exact `.item`/`.control`/`.label`/`.chevron`/
`.iconLeftWrapper`/`.panel`/`.content` DOM shape the ported CSS (from the
real `Accordion.module.css`) expects, with zero fighting against Material's
own internals. `MatAccordion` (the directive that coordinates open/close
across sibling `MatExpansionPanel`s) is rejected along with it — it only
coordinates `MatExpansionPanel` instances specifically (via
`_MatExpansionPanelBase`/an injected `MAT_ACCORDION` token), so there's
nothing left for it to coordinate once its panel is rejected.

## Hybrid API vs. explicit composition — chose explicit composition

**Decision:** `<rec-accordion-control>` is **always** required, explicitly
composed by the caller. There is no Angular equivalent of the
source-of-truth's hybrid convenience API (passing `title`/`leftIcon`
directly to `<Accordion.Item>` to auto-generate the internal `Control`).

**Why this is a real choice, not a forced one:** unlike some prior
JSX-implicit-children situations in this adapter, Angular's `<ng-content>`
_can_ technically express the same conditional shape the React reference
uses — `AccordionItemComponent` could accept `title: string`/
`leftIcon: TemplateRef<unknown>` inputs and branch:

```html
@if (title) {
<rec-accordion-control [leftIcon]="leftIcon">{{ title }}</rec-accordion-control>
<rec-accordion-panel><ng-content /></rec-accordion-panel>
} @else {
<ng-content />
}
```

This isn't blocked by the `<ng-content>`-in-a-conditional-branch gotcha
either (`docs/COMPONENT_DEV_GUIDE.md`) — there is exactly one `<ng-content>`
reachable per render (either the raw fallback, or the one nested inside the
`@if` branch feeding `Panel`), never two active at once.

**Reasons chosen anyway:**

1. **Consistency with the closest structural precedent.** `Tabs` — the
   component this adapter's own build brief identifies as the closest match
   for parent/child open-state coordination — made the identical call for
   its own `Tab`/`Panel` pair and never grew a hybrid shortcut
   (`tabs/IMPLEMENTATION_NOTES.md` has no such section at all; `Tab`/`Panel`
   are simply always explicit). Two adjacent, structurally similar
   components in the same adapter disagreeing on whether a convenience layer
   exists would be a real API-surface inconsistency for consumers to learn
   around, for a one-line-per-item savings.
2. **The convenience layer would need its own type compromise to be worth
   building.** The source-of-truth's `title` accepts a full `React.ReactNode`
   — any JSX, not just text. An Angular `title` input that's genuinely
   equivalent would need to be a `TemplateRef<unknown>` (matching this
   adapter's own established translation for "arbitrary renderable content
   passed as a prop", e.g. `Button.icon`/`Tabs.Tab.leftSection`), at which
   point the "convenience" is `[title]="titleTpl"` plus a separate
   `<ng-template #titleTpl>...</ng-template>` declaration elsewhere in the
   caller's template — not meaningfully less code than just writing
   `<rec-accordion-control>...</rec-accordion-control>` directly in place.
   A `title: string`-only input would be strictly less capable than the
   reference (no rich content, no `leftIcon` interleaving flexibility) while
   still requiring all the same auto-construction machinery.
3. **One code path, not two, to keep correct.** Every future fix/feature to
   `Control`/`Panel` (chevron override plumbing, the `disabled` fallback
   below, ARIA `id` wiring) would need to be verified against both the
   auto-built path and the manual path, doubling the surface for a
   convenience that — per point 2 — barely saves any code in the Angular
   version anyway.

`leftIcon` and a custom `chevron` remain available directly on
`<rec-accordion-control>` (and `chevron` additionally cascades from the
root `<rec-accordion>` — see that component's own doc comment), so the
convenience gap this closes is genuinely just "one extra line of template
per item," not any lost capability.

## State: DI-based context, not React's implicit DOM state

Angular has no context API, and no equivalent of the source-of-truth's
implicit-DOM-state approach (Mantine's own notes: "we defer to Mantine's
inherent DOM mapping... rather than syncing React `useState` hooks", see the
source-of-truth's own note #5). Two DI tokens (`accordion-context.ts`), one
level deeper than `Tabs`' single `TABS_CONTEXT`:

- `ACCORDION_CONTEXT` — provided by `AccordionComponent` (`useExisting`),
  exposes `isOpen(value)`/`toggle(value)`/the root `chevron` override.
  Injected `@Optional()` by `AccordionItemComponent`.
- `ACCORDION_ITEM_CONTEXT` — provided by `AccordionItemComponent`
  (`useExisting`), exposes this specific item's `value`/`isOpen`/
  `disabled`/resolved `chevron`, plus a `toggle()` that already knows this
  item's `value`. Injected `@Optional()` by `AccordionControlComponent` and
  `AccordionPanelComponent`.

The second token exists because `Control`/`Panel` need to know _which
item's_ open-state they belong to without repeating `value` a second (and
third) time on every element — `Tabs` didn't need this because its state is
a single shared active value at the root, not genuinely per-item.

Open items are tracked internally as `string[]` unconditionally (empty
array = nothing open), regardless of `multiple` — simpler than mirroring
the source-of-truth's split `string | null` (single) vs. `string[]`
(multiple) value shape internally. Normalized back to the public
`value`/`defaultValue`/`valueChange` contract (`string | string[] | null`,
widened from the canonical `RecursicaAccordionProps.value`'s
`string | string[]` to also accept `null` for "nothing open" — same
harmless widening `Tabs.value` already applies for its own single-value
case) only at the `AccordionComponent` input/output boundary
(`accordion.component.ts`'s `normalize()`/`toggle()`).

## `multiple`: governs single-vs-multi-open, ported directly from `RecursicaAccordionProps.multiple`

`AccordionComponent.toggle()`:

- `multiple = true`: toggling an open item removes it from the open set;
  toggling a closed item adds it — any number of items can be open
  together.
- `multiple = false` (default): toggling an already-open item closes it
  (open set becomes empty); toggling any other item replaces the open set
  with just that item — opening one always closes whichever other item was
  open, matching the source-of-truth's real `Accordion` (`multiple` boolean,
  ported as-is per the task brief).

Verified live — see Verification section.

## Keyboard/ARIA: native `<button>`, no roving-tabindex manager needed

Unlike `Tabs` (`FocusKeyManager` — see `tabs/IMPLEMENTATION_NOTES.md`),
`Accordion` needs no custom keyboard-navigation code at all. Every
`<rec-accordion-control>` renders a real `<button type="button">` — Tab
moves focus through every header independently (matching the WAI-ARIA
Accordion Pattern, which keeps every header in the page's normal Tab
sequence, unlike Tabs' single-tab-stop roving-tabindex model), and
Enter/Space activate it natively with no extra wiring. `aria-expanded`
(on the control) / `aria-controls`→`id` / `aria-labelledby`→`id` (control↔
panel) / `role="region"` (panel) are set directly from
`ACCORDION_ITEM_CONTEXT`. `disabled` uses the real HTML `disabled`
attribute (blocks click, focus, and keyboard activation with no extra
guards needed — same reasoning the source-of-truth's own note #7 gives for
why `Control`'s `disabled` alone is sufficient).

## `disabled`: `Control` falls back to `Item`'s `disabled` (deliberate improvement over the source-of-truth)

The source-of-truth explicitly requires the caller to pass `disabled` to
`Control` a second time in its manually-composed path (that component's own
note: "a manually-composed `<Accordion.Control>` needs `disabled` passed
explicitly"). Since this adapter's `Accordion` is _always_ the
manually-composed path (no hybrid auto-construction, see above), requiring
every caller to duplicate `disabled` on both `<rec-accordion-item>` and
`<rec-accordion-control>` would be a real, easily-hit footgun — an item
marked `disabled` (dimmed) whose control was never separately disabled
would still be fully clickable/focusable underneath the dimmed look.

`AccordionControlComponent.isDisabled` reads its own `disabled` input first,
falling back to the enclosing item's `disabled` (via
`ACCORDION_ITEM_CONTEXT`) only when its own is left at the default `false`
— so `<rec-accordion-item [disabled]="true">` alone is enough to get a
genuinely non-interactive, dimmed item; a caller can still set `disabled`
independently on the control if that specific combination is ever needed.

## Panel: animated CSS grid collapse, not `[hidden]`

`Tabs.Panel` stays mounted and toggles `[hidden]` (instant switch, no
animation — see that component's own notes on why). `Accordion.Panel` does
almost the same thing (stays mounted, never destroyed/recreated) but uses
`grid-template-rows: 0fr → 1fr` instead of `[hidden]`, so open/close
actually animates — `[hidden]` forces `display: none`, which cannot
participate in a CSS transition at all. This is the same technique Angular
Material's own `MatExpansionPanel` uses internally (confirmed in its
compiled `expansion.mjs` styles:
`.mat-expansion-panel-content-wrapper{display:grid;grid-template-rows:0fr}`)
— borrowing the _technique_, not the component (see the rejection above).
`[attr.inert]` (not `[hidden]`) keeps collapsed content out of the tab
order/accessibility tree instead. Requires `min-height: 0` on the inner
`.content` div and `overflow: hidden` on both layers — without it, the
grid track's automatic minimum sizing keeps contributing the content's
intrinsic height even at `0fr`, and the collapse doesn't fully reach zero.

## `variant`: dropped

The source-of-truth's `AccordionProps.variant` (`"default" | (string &
{})`) exists purely to select Mantine's own `variant="unstyled"` sentinel —
an internal escape hatch to suppress Mantine's _built-in_ Accordion styling
so the reference's own CSS Module becomes the sole source of truth (see
that component's own note #2). This Angular component is hand-built with no
underlying library styling to suppress in the first place (same reasoning
`Card`'s own notes give for never exposing Material's `appearance` input) —
there is nothing for a `variant` input to switch between, so it's dropped
entirely rather than kept as a permanently-inert no-op. Not part of the
canonical `RecursicaAccordionProps` contract's _meaningful_ surface either
way (its only non-`"default"` behavior in the reference is "pass through to
Mantine unmapped", which has no equivalent here).

## `overStyled`/`overClass`/`overStyle`: on all four components

Unlike `Tabs` (root only — an open, flagged gap in that component's own
notes), the source-of-truth's real `Accordion.tsx` wraps `Item`, `Control`,
and `Panel` each in their own `RecursicaOverStyled<...>` individually, not
just the root `Accordion`. Matched here: `AccordionComponent`,
`AccordionItemComponent`, `AccordionControlComponent`, and
`AccordionPanelComponent` all implement `RecursicaOverStyled` and forward
`resolvedOverStyle.class`/`.style` onto their own root element, same
`utils/recursica-over-styled.ts` mechanism every other real component uses.

## Token mapping

Every token below is a **generic** name (no theme/layer segment) — per
`recursica_variables_scoped.css`'s own header comment (§3), component CSS
must only ever reference generic names; the ambient
`[data-recursica-theme]`/`[data-recursica-layer]` cascade (set by
`RecursicaThemeProvider`/`Layer` ancestors) resolves the right value. All 38
`--recursica_ui-kit_components_accordion*` generic tokens are consumed
below; none are unused.

| Token (generic name, `--recursica_ui-kit_components_` prefix omitted)                                                          | Consumed by                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `accordion_properties_border-size`/`-radius`/`_colors_border-color`                                                            | `.root` border                                                                 |
| `accordion_properties_colors_background-color`                                                                                 | `.root` background                                                             |
| `accordion_properties_elevation`                                                                                               | `.root` box-shadow                                                             |
| `accordion_properties_max-width`/`min-width`                                                                                   | `.root` sizing                                                                 |
| `accordion_properties_padding`                                                                                                 | `.root` padding                                                                |
| `accordion_properties_item-gap`                                                                                                | `.root` flex `gap` between items                                               |
| `accordion_properties_colors_divider-color`/`divider-size`                                                                     | `.item`'s `border-bottom-*` (the line between items)                           |
| `accordion-item_properties_margin`/`padding`                                                                                   | `.item`                                                                        |
| `accordion-item_properties_border-size`/`-radius`/`_colors_border-color`                                                       | `.item` border (all sides but bottom, which the divider tokens above override) |
| `accordion-item_properties_elevation`                                                                                          | `.item` box-shadow                                                             |
| `accordion-header_properties_vertical-padding`/`horizontal-padding`                                                            | `.control` padding                                                             |
| `accordion-header_properties_icon-gap`                                                                                         | `.control` flex `gap`                                                          |
| `accordion-header_properties_border-size`/`-radius`                                                                            | `.control` border                                                              |
| `accordion-header_properties_elevation`                                                                                        | `.control` box-shadow                                                          |
| `accordion-header_properties_icon-left-size`                                                                                   | `.iconLeftWrapper` width/height                                                |
| `accordion-header_properties_icon-right-size`                                                                                  | `.chevron` width/height                                                        |
| `accordion-header_properties_text_*` (font-family/size/weight/style/letter-spacing/line-height/text-decoration/text-transform) | `.control` typography                                                          |
| `accordion-header_variants_appearance_closed_properties_colors_background-color`/`border-color`/`text-color`/`icon-color`      | `.control` resting state, `.chevron`/`.iconLeftWrapper` resting color          |
| `accordion-header_variants_appearance_open_properties_colors_background-color`/`border-color`/`text-color`/`icon-color`        | `.control[data-active]` state, `.chevron`/`.iconLeftWrapper` open color        |
| `accordion-content_properties_margin`                                                                                          | `.panel` margin                                                                |
| `accordion-content_properties_colors_background-color`/`border-color`                                                          | `.panel` background/border                                                     |
| `accordion-content_properties_border-size`/`-radius`                                                                           | `.panel` border                                                                |
| `accordion-content_properties_elevation`                                                                                       | `.panel` box-shadow                                                            |
| `accordion-content_properties_horizontal-padding`/`top-padding`/`bottom-padding`                                               | `.content` padding                                                             |
| `accordion-content_properties_text_*` (same 8 typography properties as the header)                                             | `.content` typography                                                          |

Plus the project-wide generic hover/focus/disabled brand tokens (same
"brand-layer exemption" the source-of-truth's own CSS documents at its
header — no accordion-specific hover/focus/disabled tokens exist):
`--recursica_brand_states_hover_color`/`hover_opacity`,
`--recursica_brand_states_focus_color`/`focus_border-size`/`focus_blur`/
`focus_margin`, `--recursica_brand_states_disabled`.

## Verification

Verified visually against the real running Storybook
(`http://localhost:6007`, already running — this task didn't start its own
instance) via Playwright (chromium):

- Default story renders three items, first one open by default.
- Real click-driven interaction: clicking a closed item's control opens it
  and closes whichever other item was open (single-open, `multiple=false`
  default) — confirmed via `aria-expanded` flipping on the clicked control
  and the previously-open panel's `aria-expanded`/`inert` flipping back,
  not just a static render.
- `Multiple` story: clicking a third item while two are already open leaves
  all three expanded simultaneously — confirmed `multiple=true` doesn't
  collapse siblings.
- Keyboard: `Tab` moves focus between controls in document order; `Enter`
  and `Space` both toggle the focused control — confirmed via real
  Playwright `page.keyboard.press()` calls, not just static markup
  inspection.
- `Disabled` story: the disabled items' controls do not respond to click or
  keyboard, and both the control and panel of a disabled item render
  visibly dimmed (opacity), confirming the `Item`→`Control` `disabled`
  fallback described above actually works live, not just in isolation.
- `WithIcons`/`LongTitleTruncation`: leading icon renders at the correct
  size; a long title truncates with an ellipsis instead of wrapping or
  pushing the chevron out of view.
- Chevron rotates 180° on open/close (CSS transition, `.control[data-active]
.chevron`).
- Zero console errors in any story during interaction.

`npx tsc --noEmit -p projects/adapter-angular-material/tsconfig.lib.json`
and `npx eslint 'projects/adapter-angular-material/src/lib/accordion/**/*.ts'`
both run clean.
