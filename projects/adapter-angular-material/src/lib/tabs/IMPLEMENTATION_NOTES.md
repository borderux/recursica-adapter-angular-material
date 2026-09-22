# Tabs — Implementation Notes

**Status**: real implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

## The step-9 stub's `MatTabGroup`/`MatTab` guess didn't survive contact with the real compiled source

The stub's own findings row called this **EASY** ("Direct match: `animationDuration`,
dynamic tab content via `MatTabContent`, `(selectedTabChange)`"). Reading
`MatTabGroup`/`MatTab`'s real compiled output
(`node_modules/@angular/material/fesm2022/tabs.mjs`) before writing any code
turned up three separate, compounding problems — any one of them alone might
have been worked around, but together they made wrapping `mat-tab-group`
more code, not less, than building from scratch:

1. **`MatTabGroup`'s own template builds its entire visible tab header
   itself**, inside its own component view:

   ```html
   <mat-tab-header ...>
     @for (tab of _tabs; track tab) {
     <div class="mdc-tab mat-mdc-tab mat-focus-indicator" ...>...</div>
     }
   </mat-tab-header>
   ```

   `MatTabGroup`'s `@Component` declares `encapsulation: ViewEncapsulation.None`
   (confirmed in the same compiled source, `args: [{ selector: 'mat-tab-group',
..., encapsulation: ViewEncapsulation.None, ...}]`) — every `.mdc-tab`/
   ink-bar/pagination element it renders belongs to _its own_ view, not this
   adapter's. Per `docs/STYLING_SYSTEM.md` §3, this adapter's own components
   use `ViewEncapsulation.Emulated`, which stamps a `_ngcontent-<hash>`
   attribute only onto elements a component's **own** template renders.
   `MatTabGroup`'s internally-built header DOM would never carry this
   adapter's attribute, so scoped `.tab { ... }` rules written here could
   never reach it — the same practical outcome as `Menu`/`Tooltip`'s
   CDK-Overlay problem (content rendered outside this adapter's own
   encapsulation boundary), but for a structurally different reason (a
   nested Angular _component's own view_, no CDK Overlay involved at all).
   The fix that pattern uses (a global, unscoped stylesheet like
   `menu-overlay.css`, gated by a wrapper class + `[data-recursica-theme]`)
   would have worked here too, but only for the _header_ — findings 2 and 3
   below are the real blockers.

2. **`MatTab` fuses one tab's clickable label and its panel body into a
   single element.** Its own real compiled template is just
   `<ng-template><ng-content></ng-content></ng-template>` — that
   `<ng-content>` becomes the **panel body** shown in `mat-tab-body`; the
   **label** comes from a separate `textLabel` string input or a nested
   `[mat-tab-label]` template. There is no way to get "just the label, no
   body" or "just the body, no label" out of one `<mat-tab>` the way
   Recursica's real contract needs: the source-of-truth `Tabs.tsx` has
   `Tabs.Tab` (label only) and `Tabs.Panel` (body only) as **independent
   siblings**, matched by a shared `value` string, both direct children of
   `<Tabs>`/`<Tabs.List>` — not nested inside each other, and not the same
   element. Reconciling that shape onto `MatTabGroup` would mean generating
   `<mat-tab>` elements dynamically from two separately-projected content
   lists (`ContentChildren` queries for both `Tabs.Tab`-equivalent and
   `Tabs.Panel`-equivalent components, matched by `value`, each contributing
   a captured `TemplateRef` rendered via `*ngTemplateOutlet` inside a
   generated `<mat-tab [mat-tab-label]="...">`) — real, working Angular, but
   substantially more machinery than this component ended up needing.

3. **`MatTabGroup` selects by numeric `selectedIndex`/`(selectedIndexChange)`,
   not by a string `value`.** Recursica's `value`/`defaultValue`/
   `(valueChange)` contract (matching the source-of-truth `Tabs.tsx`'s
   Mantine-inherited `TabsProps`) would need its own value↔index bookkeeping
   layered on top regardless of (1) and (2).

**Decision**: build `Tabs` from scratch — `TabsComponent`
(`rec-tabs`, state owner) + `TabsListComponent` (`rec-tabs-list`, structural/
naming wrapper only) + `TabComponent` (`rec-tabs-tab`, the clickable button)

- `TabPanelComponent` (`rec-tabs-panel`, the body) — the same category of
  decision Card's `Header`/`Footer`/`Content`/`Section` already made (see
  `card/IMPLEMENTATION_NOTES.md`), just triggered by a different root cause
  (view-encapsulation + fused-element shape, not a padding/section mismatch).
  This gives full, direct control over the exact `.root`/`.list`/`.tab`/
  `.panel` DOM shape the ported CSS (from the real `Tabs.module.css`) expects,
  with zero fighting against Material's own internals.

## State: DI-based context, not React context

Angular has no context API. `TabsComponent` provides itself under
`TABS_CONTEXT` (`tabs-context.ts`, `useExisting`) — `TabComponent`/
`TabPanelComponent`/`TabsListComponent` each inject it `@Optional()`. This is
the same pattern `RECURSICA_FORM_CONTROL` (`utils/recursica-form-control.ts`)
already established for `FormControlWrapper` ↔ real input components — a DI
token standing in for what React solves with `useContext`.

## Keyboard navigation: real CDK `FocusKeyManager`, not hand-rolled

`TabsListComponent` builds a `FocusKeyManager<TabComponent>` (`@angular/cdk/a11y`)
over its `ContentChildren(TabComponent, { descendants: true })` query —
Material's own internal components use this exact primitive; using it
directly here gets real roving-tabindex, wrap-around, Home/End, and disabled-
item-skipping for free without needing `MatTabGroup`/`MatTab` at all.
`TabComponent` implements `FocusableOption` (`focus()`, plus the inherited
`disabled`/`getLabel()` from `ListKeyManagerOption`) so the key manager can
drive it directly. Navigation uses "automatic activation" — moving focus with
an arrow key calls `ctx.select()` immediately (subscribing to the key
manager's own `change` stream), matching the real keyboard behavior of the
source-of-truth's Mantine-backed `Tabs`, not just moving `:focus` without
selecting.

`ContentChildren` with `descendants: true` finds `TabComponent`s across the
`<rec-tabs-list><rec-tabs-tab>` boundary because they're real content
children of `TabsListComponent`'s own view (`<ng-content>` re-projection) —
no equivalent to `MatTabGroup`'s view-boundary problem here, since nothing in
this chain is built by a different component's own template.

**Bug found and fixed (confirmed live, Playwright + `window.ng.getComponent()`):**
`FocusKeyManager`'s own `activeItemIndex` is internal cursor state, entirely
separate from real DOM `:focus` — it only moves via its own
`setActiveItem()`/`onKeydown()`, never automatically from a plain mouse
click. Clicking "Gallery" (via `TabComponent.onClick()` → `ctx.select()`)
never told the manager anything; its cursor stayed at its initial `-1`. The
first manual test (click Gallery, press →) looked like it did nothing —
`aria-selected`/content both stayed on Gallery — which was actually
`onKeydown` moving the manager's untouched `-1` cursor to index `0`
("Gallery" again, coincidentally the same tab), not a no-op. Confirmed via
`comp.keyManager.activeItemIndex` directly: `-1` before, `0` after a single
→ press, even though DOM focus was already sitting on Gallery's button.
Fixed with a `(focusin)` listener on `.list` (`tabs-list.component.ts`'s
`onFocusIn()`) that matches the real focus target back to its `TabComponent`
(via a `nativeElement` getter added to `TabComponent`) and calls
`keyManager.updateActiveItem()` — not `setActiveItem()`, which would
re-invoke `.focus()` and risk a loop. Re-verified after the fix: click
Gallery → press → moves `aria-selected` to Messages and switches the
rendered panel, both via a real Playwright keyboard press
(`page.keyboard.press('ArrowRight')`) against the running Storybook, not
just the manager's internal state.

## CSS: `:host-context()` crosses the component boundary the ported CSS Module needs

The real source-of-truth `Tabs.module.css` is one file with selectors like
`.root[data-variant="pills"] .tab[data-active] { ... }` — valid because
Mantine's `classNames` prop applies all of `.root`/`.list`/`.tab`/`.panel`
from that single CSS Module onto elements React renders directly. This
adapter's `.root` (`TabsComponent`), `.list` (`TabsListComponent`), `.tab`
(`TabComponent`), and `.panel` (`TabPanelComponent`) are four separate
Angular components, each its own `ViewEncapsulation.Emulated` scope — a
selector written in one can never match an element in another the normal
way.

Fix: every `.list`/`.tab` rule that needs to know an ancestor's
`data-variant`/`data-orientation`/`data-inverted` (set on `<rec-tabs>`'s
`.root`) uses `:host-context([data-variant="..."])` etc. instead of a nested
descendant selector — `:host-context()` walks the real ancestor DOM chain
regardless of which component rendered which element, so it reaches straight
through the component boundary the same way `card.component.css`'s
`--card-padding` custom property does for `CardHeader`/`CardFooter`, just
for conditional (attribute-based) rules instead of a single inherited value.
Verified this compiles and matches as expected in the real build (see below)
— not just assumed from the mechanism's documented behavior.

Per `docs/STYLING_SYSTEM.md` §4, every token-driven rule is additionally
gated by `:host-context([data-recursica-theme])` — as a **separate** chained
`:host-context()` clause, not folded into the same attribute selector as
`data-variant`, because `data-recursica-theme` lives on `<html>` while
`data-variant` lives on `<rec-tabs>`'s `.root` — two different ancestor
elements, so one `:host-context()` call can't test both at once. This stays
within STYLING_SYSTEM.md's documented "2-level chain" safe zone (host +
one target class) for every rule in this component — no rule here reaches
the documented 3+-level flat-chain compiler quirk.

Shared sizing (`--tabs-element-gap`, `--tabs-min-width`, etc.) is hoisted
into custom properties exactly like the source-of-truth does, just declared
one level down: instead of `.root[data-variant]` setting them once for a
shared `.tab` rule in the same file, `tabs-tab.component.css`'s own
per-variant `:host-context(...) .tab { --tabs-element-gap: ...; }` blocks set
them directly on `.tab` itself, consumed by one unconditional `.tab { gap:
var(--tabs-element-gap); ... }` rule beneath.

## `Tabs.Panel` stays mounted (`[hidden]`), not `*ngIf`

Matches Mantine's own `keepMounted` default (`true`). Avoids re-triggering
Angular component construction/destruction (and losing any state inside an
inactive panel — scroll position, an uncommitted form, etc.) purely from
switching tabs and back. `docs/COMPONENT_DEV_GUIDE.md`'s `<ng-content>`-in-a-
conditional-branch gotcha doesn't apply here either way, since each panel is
its own component with exactly one `<ng-content>`, never itself branched.

## `leftSection`/`rightSection` icon sizing: wrapper-sized, not descendant-selected (confirmed live)

Verified live in a running Storybook + Playwright, the same way
`docs/STYLING_SYSTEM.md` §4 requires for `:host-context()` claims: a
`.section svg { width: var(--tabs-icon-size); ... }` descendant selector
**never matched** the actual projected icon, even though the icon visibly
rendered in the DOM and `--tabs-icon-size` resolved correctly on `.tab`
(`getPropertyValue('--tabs-icon-size')` → `"24px"`). Inspecting the real
rendered `<svg>` showed it carries **no** `_ngcontent-<hash>` attribute at
all, while its parent `.section` (rendered by this component's own
template) carries `TabComponent`'s. Root cause: `leftSection`/`rightSection`
are `TemplateRef`s the _caller_ declares (e.g. a story's own
`<ng-template #galleryTpl>`) and this component only renders via
`*ngTemplateOutlet` — the resulting DOM nodes belong to the **defining**
component's view, not `TabComponent`'s, so Emulated-scoped selectors
requiring `TabComponent`'s own attribute on both `.section` and `svg`
structurally cannot match one that only the caller's component created.

This isn't new to `Tabs` — `Button`'s `icon` has the exact same shape
(`TemplateRef` + `*ngTemplateOutlet`) and already solves it the same way:
size the **wrapper** (`.iconWrapper`/here, `.section`) via this component's
own scoped CSS (which _does_ apply, since `.section` is this component's own
element), and have the caller's own SVG markup supply
`width="100%" height="100%"` so it fills that wrapper (see
`button.component.css`'s `.iconWrapper > *` and `button.stories.ts`'s
`searchIconTemplate`, and `tabs.stories.ts`'s own icon templates here).
Confirmed fixed via Playwright screenshot after applying this — see the
Verification section below.

## Default/Outline active-tab underline and baseline divider: no Mantine base to inherit (confirmed live against the golden screenshots)

Comparing an early render against the real golden screenshots
(`recursica-adapter-mantine-v8/test/golden/ui-kit-tabs--default.png`/
`--outline.png`) turned up a real, visible gap: this adapter's Default and
Outline tabs rendered with **no border at all** — same colors/typography as
the golden images, but missing the thin baseline line under the whole tab
row and the colored underline beneath the active tab.

Root cause: the source-of-truth `Tabs.module.css` only ever _overrides the
values_ of `--tabs-color`/`--tab-border-color` — the rules that actually
turn those variables into a visible `border`/`::before` line
(`.tab[data-active] { border-color: var(--tabs-color); }`, `.list::before`
sized from `--tabs-list-border-width`) live in Mantine's own **base**
`Tabs.css` (confirmed by reading the real compiled
`@mantine/core/styles/Tabs.css` directly), which this hand-built component
has no equivalent of — same class of gap already flagged in
`tabs.component.css`'s header comment for vertical layout, just not
previously checked for the underline specifically. Fixed by declaring the
consuming rules directly: `tabs-tab.component.css`'s new "ACTIVE-STATE
UNDERLINE" section reserves a transparent border on every tab (sized from
this variant's own `..._active_properties_border-size` token) so becoming
active never shifts layout, with the existing per-variant `[data-active]`
color blocks now also setting `border-color` to the active accent token;
`tabs-list.component.css`'s new "BASELINE DIVIDER" section gives `.list`
itself a full-length line using this variant's own inactive border
size/color tokens. Both handle horizontal (plus `inverted`, flipping to
`border-top`) and vertical (`border-right`) the same way the existing
border-radius geometry blocks already did. Re-verified via Playwright
screenshot against the golden images after the fix — see Verification
below. Pills was unaffected (`Tabs.module.css` already writes its own
explicit `border: ...` directly on `.tab`, no base-stylesheet dependency).

**Known, deliberate simplification**: Mantine's real Outline variant is
visually more elaborate than this (a `::before`/`::after`-based technique
that joins the active tab's top/left/right border into the divider line
below it, making the active tab look like a raised folder tab merging into
the panel). This adapter gives Outline the same simple bottom-border
treatment as Default, differentiated only by its own token values (matching
the golden screenshot's dominant visual read — a colored underline plus a
neutral baseline) rather than replicating Mantine's exact multi-pseudo-
element corner-joining trick. Flagged here rather than silently
approximated without a note.

## Not implemented: vertical + inverted combined

The source-of-truth's own `Tabs/IMPLEMENTATION_NOTES.md` already flags this
honestly ("vertical's 'instead of left' flip isn't exercised by any story
yet") — this adapter carries the same gap forward rather than guessing at
undocumented behavior. `inverted` only reorders `.list` for
`data-orientation="horizontal"` (`tabs-list.component.css`'s `order: 1`
rule, gated on `[data-orientation="horizontal"][data-inverted]` together);
setting both `orientation="vertical"` and `inverted="true"` renders the list
on its default (left) side, not swapped to the right.

## `animationDuration` / `dynamicHeight`: not carried over

The step-9 stub's guessed `@Input() animationDuration` is dropped. It only
ever meant something as `MatTabGroup`'s own ink-bar/body-swap animation
timing input — with no `MatTabGroup` underneath, there's no animation
subsystem for it to configure. The canonical `RecursicaTabsProps` contract
doesn't define it either (confirmed against the real
`RecursicaTabsProps.d.ts`: only `variant`/`inverted`). Panel switching here
is instant (`[hidden]` toggle), matching the source-of-truth's own default
Mantine behavior (no built-in cross-fade unless a consumer opts in via
Mantine's own transition props, which the source-of-truth doesn't expose
either).

## Verification

Built (`npm run build`) and type-checked (`npm run check-types`) clean.
Verified visually against a real running Storybook (`npm run storybook`)
via Playwright (chromium), screenshotted to `.scratch/` and compared
directly against the golden reference images
(`recursica-adapter-mantine-v8/test/golden/ui-kit-tabs--*.png`):

- `.scratch/tabs-default.png` — Default variant, active-tab icon+underline,
  hover/typography all present; matches the golden `--default.png` read.
- `.scratch/tabs-outline.png` — Outline variant's simplified underline
  treatment (see the deliberate-simplification note above).
- `.scratch/tabs-pills.png` — Pills variant's full active-background pill.
- `.scratch/tabs-vertical.png` — Vertical orientation, list beside the
  panel.
- `.scratch/tabs-default-clicked-messages.png` — real Playwright click on
  "Messages", confirming the panel actually switches (not just a static
  render).
- `.scratch/tabs-pills-arrowkey-nav.png` — real Playwright
  `ArrowRight` keypress after clicking "Gallery", confirming roving
  keyboard navigation moves the active tab (this screenshot is post-fix;
  see the `FocusKeyManager`/`focusin` bug above for what it looked like
  before).

## `overStyled`/`overClass`/`overStyle`

Only on the root (`TabsComponent`) — same `RecursicaOverStyled` interface
every other real component implements (`utils/recursica-over-styled.ts`).
`TabComponent`/`TabPanelComponent`/`TabsListComponent` don't implement it:
none of them wrap a single, identifiable "protected look" element the way
`Card`'s sub-components do (each is a small structural piece of one larger
composed look), and the source-of-truth's own `Tabs.List`/`Tabs.Tab`/
`Tabs.Panel` sub-exports all support `overStyled` individually — a real,
open gap flagged honestly here rather than silently matched or silently
dropped without a note. Follow-up if per-tab overstyling turns out to be
needed in practice.
