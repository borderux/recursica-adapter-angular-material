# Dropdown — Implementation Notes

**Status**: real implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

## `MatSelect` investigation — rejected, same category as `Tabs`' `MatTabGroup` rejection

The step-9 stub (seeded from `docs/ADAPTER_INTEGRATION_REPORT.md` §9) guessed `MatSelect` as
an EASY match. Re-investigated against the real compiled source
(`node_modules/@angular/material/fesm2022/select-module.mjs`, `@angular/material@20.2.14`)
before writing any code, the same rigor `Tabs`/`Stepper`/`Chip` already applied to their own
Material candidates. It doesn't survive contact:

1. **`MatSelect` declares `encapsulation: ViewEncapsulation.None`**
   (`args: [{ selector: 'mat-select', ..., encapsulation: ViewEncapsulation.None, ...}]`,
   confirmed directly in the compiled metadata) and **builds its entire trigger DOM itself**,
   inside its own component view:
   ```html
   <div
     cdk-overlay-origin
     class="mat-mdc-select-trigger"
     (click)="open()"
     #trigger
   >
     <div class="mat-mdc-select-value" [attr.id]="_valueId">...</div>
     <div class="mat-mdc-select-arrow-wrapper">...</div>
   </div>
   ```
   There is no slot in that fixed template for Recursica's leading-icon
   `.section[data-position="left"]` or a `.clearButton` — the only customization point is
   `<mat-select-trigger>` (`MatSelectTrigger`/`MAT_SELECT_TRIGGER`), which replaces
   `.mat-mdc-select-value-text` only, leaving the rest of the fixed trigger div untouched. Same
   structural blocker as `Tabs.md`'s `MatTabGroup` finding — a Material component's own
   `ViewEncapsulation.None` template owning DOM this adapter has no way to reshape from outside.
2. **The options panel has the identical problem, twice over.** It renders via
   `<ng-template cdk-connected-overlay>` — the same underlying CDK primitive this component
   itself now uses directly — but because it's declared inside _`MatSelect`'s own_
   `ViewEncapsulation.None` template, the panel content is a bare `<ng-content></ng-content>`
   (projected `<mat-option>` elements), not markup this adapter controls. `leadingIcon`/
   `supportingText` rich-option content would have to be smuggled through `MatOption`'s own
   single-slot content projection — workable for plain text, not for the "icon left of a
   two-line label" shape `Dropdown.module.css`'s `.optionContent` expects.
3. **Value/selection model mismatch**: `MatSelect` derives its trigger text from
   `MatOption.viewValue` (`ContentChildren(MatOption)`, each option's own rendered text
   content) via `_getTriggerValue()`, not from a declarative `data: RecursicaDropdownOption[]`
   array the way Recursica's own `Dropdown` (mirroring the genesis adapter's Mantine `Select`)
   expects — every consumer would need to hand-generate `<mat-option>` elements from `data`
   anyway, at which point `MatSelect` contributes little beyond `ControlValueAccessor` wiring
   this component doesn't need either (Recursica's own `value`/`(valueChange)` contract, the
   same reasoning `Tabs` used to skip `MatTabGroup`'s `selectedIndex` model).

**Decision**: build `Dropdown` directly on `@angular/cdk/overlay`'s `CdkConnectedOverlay`/
`CdkOverlayOrigin` — the same underlying primitive `MatSelect`/`MatMenu` are themselves built
on, just without either component's own fixed template wrapped around it. This is "the same
category as `Menu`" in the sense both are CDK-Overlay-backed dropdown panels, but concretely
different: `Menu` wraps the _complete_ `MatMenu` component (a good fit for its action-list
semantics — `MatMenuItem` is `(click)`-oriented, no `aria-selected`/value concept at all);
`Dropdown` needed a listbox/combobox selection model neither `MatMenu` nor `MatSelect` gave a
clean way to reshape, so it goes one level lower, straight to the overlay primitive.

## Overlay + keyboard approach

`DropdownComponent`'s own template declares `<button cdkOverlayOrigin #origin="cdkOverlayOrigin">`
as the trigger and `<ng-template cdkConnectedOverlay [cdkConnectedOverlayOrigin]="origin" ...>`
as the panel host — real, working `@angular/cdk/overlay`, not a hand-rolled positioning system.
`cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"` (the same class `MatSelect`
itself uses) plus `(backdropClick)="close()"` gives real click-outside-to-close; `(detach)`/
`(overlayOutsideClick)` are wired the same way for scroll-triggered/other-outside-click closes.

Keyboard model matches the W3C "select-only combobox" pattern (and the genesis adapter's own
Mantine `Combobox` engine underneath `Select`): DOM focus **stays on the trigger button**
(`role="combobox"`) the whole time the panel is open. `highlightedIndex` drives
`aria-activedescendant`, pointing at the highlighted `.option`'s `id`; arrow keys/Home/End/
type-ahead only move that index, never call `.focus()` on an option element. This is simpler
than a CDK `ActiveDescendantKeyManager` over content children (`Tabs`' approach for its own
projected tab buttons) because the options here are this component's _own_ `@for`-generated
view children driven by the already-known `normalizedData` array — plain index arithmetic is
enough, no key-manager query needed. Supported: `ArrowDown`/`ArrowUp` (open-if-closed, then move
highlight, wrapping, skipping `disabled` options), `Home`/`End`, `Enter`/`Space` (select
highlighted), `Escape` (close, focus stays on trigger), `Tab` (closes without preventing the
native tab-away), and single-character type-ahead (500ms buffer reset, matches from just after
the current highlight, wrapping).

## `dropdown-overlay.css`: a global stylesheet is needed after all — initial theory was wrong, corrected live

The first draft assumed that because `<ng-template cdkConnectedOverlay>` is declared directly
inside `DropdownComponent`'s own template, the `.dropdown`/`.option` elements it stamps via
`@for` would carry `DropdownComponent`'s own `_ngcontent-<hash>` attribute even after CDK
Overlay reparents them into `cdk-overlay-container` — i.e. that ordinary `Emulated`-scoped CSS
in `dropdown.component.css` would just reach the panel, no `menu-overlay.css`/
`tooltip-overlay.css`-style global stylesheet needed.

**This was wrong, confirmed live** (Playwright + DOM inspection against a real running
Storybook — the same "verify live, don't just trust the mechanism" standard `Tabs`'
`:host-context()` claims already apply): opening the panel and reading real attributes off
`.root` vs `.dropdown` showed **two different** `_ngcontent-*` values (e.g.
`_ngcontent-ng-c4119835729` on `.root`, `_ngcontent-ng-c770600461` on `.dropdown`/`.option`) —
not the same one. The panel rendered with zero token styling as a direct result: no
border/background/padding, browser-default serif text, overlapping the assistive text beneath
the trigger (see the "before" investigation — not kept as a screenshot, but reproducible by
reverting `dropdown-overlay.css` back into `dropdown.component.css`'s scoped rules). Root cause
not fully isolated (best guess: `CdkConnectedOverlay`'s `TemplatePortal` attaches via a
`ViewContainerRef`/injector path that produces a distinct Angular view context for
encapsulation-hashing purposes, even though the `<ng-template>` is lexically declared inside
this component's own template) — but the empirical result is unambiguous regardless of the
exact mechanism, so it's documented here as a confirmed finding, not a theory.

**Fix**: same pattern as `Menu`/`Tooltip` after all. `.dropdown`/`.option`/`.optionContent`/
`.optionIcon`/`.optionText`/`.optionLabel`/`.optionTextWrap`/`.optionSupportingText` styling
moved to `dropdown-overlay.css` — a real global stylesheet a consuming app imports once (see
`SETUP.md`, and `angular.json`'s `storybook`/`build-storybook` `styles` arrays for this repo's
own Storybook), scoped under a dedicated `.rec-dropdown-panel` class (added directly on the
panel `<div>` alongside `.dropdown`, the same "extra guard class" convention `.rec-menu`/
`.rec-tooltip` use) and gated behind `[data-recursica-theme]`. `dropdown.component.css` keeps
only the trigger (`.root`/`.input`/`.section`/`.clearButton`/`.chevron` + focus/error/disabled
state) — that part genuinely _is_ reachable by normal scoped CSS (confirmed by the same DOM
inspection: `.root` carries `DropdownComponent`'s own attribute, and the trigger renders
correctly styled in every screenshot), since it's rendered directly in this component's own
template, never through the overlay portal. New asset wiring: `ng-package.json` gained a third
`dropdown-overlay.css` glob entry (alongside the existing `tooltip-overlay.css`/
`menu-overlay.css` ones), and `angular.json`'s two Storybook architect targets' `styles` arrays
each gained the same file so this repo's own Storybook renders it correctly too.

## Bug found and fixed: leading-icon (`leftSection`) sizing (confirmed live via Playwright)

Ported `--input-left-section-size` (`horizontal-padding + icon-size + icon-text-gap`, a
Mantine-internal compound value) from the source-of-truth CSS for **two** different purposes
that need two different values: (1) `.root[data-with-left-section] .input`'s `padding-left`,
where the compound value is correct (it reserves room in the text flow for padding + icon +
gap together), and (2) `.section[data-position="left"]`'s own box size, where it is **not**
correct — that box should be exactly `icon-size`, not the padded compound value. Using the
compound value for both, plus `height: 100%` on the absolutely-positioned section (which
resolves against `.root`, the nearest _positioned_ ancestor, not the icon's own natural size),
rendered the `WithLeadingIcon` story's pin icon far too large and flush against the left edge
overlapping the placeholder text — confirmed via an actual Playwright screenshot
(`.scratch/dropdown-with-leading-icon.png`, first pass) before the fix.

Fixed in `dropdown.component.css`: `.section[data-position="left"]` is now sized to exactly
`--recursica_..._icon-size` (both width and height), vertically centered via
`top: 50%; transform: translateY(-50%)` instead of `height: 100%`, and inset from the edge via
`left: --recursica_..._horizontal-padding` instead of `left: 0`. Re-verified live after the fix
— see Verification below.

Related, **not** a bug (documented, matching `Tabs`' own precedent): `.section svg`'s
scoped-CSS sizing rule only ever reaches the trailing chevron/clear-button icons (markup this
component's own template writes directly) — it structurally cannot reach the leading icon
(`leftSection`, a caller-supplied `TemplateRef` rendered via `*ngTemplateOutlet`, whose `<svg>`
belongs to the _caller's_ view for `Emulated`-scoping purposes), the exact same gap
`tabs/IMPLEMENTATION_NOTES.md`'s `leftSection`/`rightSection` finding already documents. Same
fix already in place: size the **wrapper** via scoped CSS (done above), have the caller's own
SVG supply `width="100%" height="100%"` to fill it (`dropdown.stories.ts`'s
`pinIconTemplate`/`userIconTemplate` both already do this).

## `RECURSICA_FORM_CONTROL`: composed like a real field, not internally

Unlike the genesis adapter's `Dropdown.tsx` (which renders its own `FormControlWrapper`
internally via `WithReadOnlyWrapper`, flattening `label`/`error`/etc. onto `Dropdown`'s own
prop surface — only possible because React's `cloneElement()` can graft props onto an opaque
child), this component does **not** wrap `FormControlWrapperComponent` itself. `DropdownComponent`
provides itself under `RECURSICA_FORM_CONTROL` (`id` getter/input + `setDescribedByIds()`) and is
meant to be composed the same way `form-control-wrapper.stories.ts`'s own demo control already
is: the caller writes
`<rec-form-control-wrapper><rec-dropdown ...></rec-dropdown></rec-form-control-wrapper>`. Every
story in `dropdown.stories.ts` does exactly this. Verified live: `FormControlWrapperComponent`'s
`ContentChild(RECURSICA_FORM_CONTROL)` picks up `DropdownComponent`, wires the label's `for` to
the trigger's real `id`, and (when `error`/`assistiveText` are set on the wrapper) sets
`aria-describedby` on the trigger via `setDescribedByIds()` — confirmed by reading
`describedByAttr`'s rendered value in the `StaticError` story's DOM.

`error` on `DropdownComponent` itself is a **separate, boolean-only** input (mirrors the
genesis adapter's own `BareDropdown`'s boolean `error` prop) — it drives the visual
`data-error` state (red border/background/text-color tokens) but carries no message; the error
_message_ is `FormControlWrapper`'s `error` input, a sibling prop on the wrapping component, not
flattened onto `Dropdown`. `StaticError`'s story sets both explicitly.

## Known gap: `readOnly`/static variants approximate `ReadOnlyField`, which doesn't exist yet

The genesis adapter's `Dropdown.tsx` composes `ReadOnlyField`'s `WithReadOnlyWrapper` for a real
`readOnly` display mode (a `readOnlyComponent`/`emptyValueComponent`-configurable, fully
token-driven read-only rendering, matching the golden `static-disabled`/`static-error`/
`static-read-only` screenshots' exact visual treatment). `ReadOnlyField` is not yet built in
this Angular adapter (still `🚧` in `llms.txt` at the time of writing) — building it was
explicitly out of scope for this task.

**Approximation shipped instead**: `DropdownComponent`'s `readOnly` input, when `true`, renders
a plain, non-interactive `<div class="input readOnlyDisplay">` — same `.input` token-driven
box/border/typography look as the real interactive trigger, showing the selected option's label
(or the placeholder, if unset) as static text, `aria-readonly="true"`, no button semantics, no
click handlers, no overlay at all. This is a deliberate, honest simplification, not real
`ReadOnlyField`/`WithReadOnlyWrapper` parity — it does not support `readOnlyComponent`/
`emptyValueComponent` overrides, does not render any Read-Only-specific icon/affordance the real
component might add, and is not guaranteed to pixel-match the golden `static-read-only.png`
beyond "same box, static text." `static-disabled` and `static-error` don't need this
approximation at all — they're just the normal interactive trigger with `disabled`/`error` set
plus a preset `value`, which is already fully real, token-driven, and verified.

**Follow-up**: once `ReadOnlyField`/`WithReadOnlyWrapper` exist in this adapter, `Dropdown`
should be revisited to compose them for `readOnly`, the same way the genesis adapter does,
replacing this approximation. Cross-reference: `read-only-field/IMPLEMENTATION_NOTES.md` (once
that component exists) should link back here.

## Rich option data (`leadingIcon`/`supportingText`)

`data` accepts `(string | RecursicaDropdownOption)[]` (`dropdown-option.ts`) — a plain string is
normalized to `{ value: item, label: item }` (`normalizeDropdownOption`), matching the genesis
adapter's own `normalizeComboboxData` fallback-to-`value` behavior for `label`. `leadingIcon` is
a `TemplateRef<unknown>`, not a `ReactNode` — same Angular translation `Menu`'s `leftSection`/
`Button`'s `icon` already use. Option row markup/tokens
(`.optionContent`/`.optionIcon`/`.optionText`/`.optionSupportingText`) reuse `menu-item`'s own
tokens, matching the genesis adapter's `Dropdown.module.css` doing the same (no dedicated
dropdown-option icon/supporting-text tokens exist in the schema either). `wrapItemText` toggles
`.optionTextWrap` the same way the source-of-truth does (truncate-with-ellipsis by default,
wrap onto additional lines when `true`).

## Storybook-only `debugForceOpen`

`@Input() debugForceOpen` forces the panel open on init (`ngAfterViewInit`, deferred one
microtask so the trigger's real width is measured first) — used only by the
`RichOptionRowPreview`/`RichOptionRowPreviewWrapped` stories, to get a stable golden screenshot
of the real overlay panel without a Playwright-driven click (this repo has no `@storybook/test`/
`play`-function package installed to script that inside the story itself). This is **not** part
of the Recursica `Dropdown` props contract — it exists purely so those two stories can render
the real, already-styled panel deterministically, the same underlying code path every other
story's click-to-open uses, rather than duplicating option-row markup outside the real component
the way the genesis adapter's own `RichOptionRowPreview` story does (which renders raw
`renderRichOption()` output directly, bypassing the portal entirely).

## Verification

Built (`npm run build`) and type-checked (`npm run check-types`) clean. Verified against a real
running Storybook on port 6007 (`npm run storybook -- --port 6007` — **never** port 6006, which
stayed on its own separate, undisturbed instance throughout) via Playwright (chromium),
screenshotted to `.scratch/`:

- `.scratch/dropdown-default.png` / `-clearable.png` / `-with-leading-icon.png` /
  `-with-rich-options.png` / `-with-rich-options-wrapped.png` / `-rich-option-row-preview.png` /
  `-rich-option-row-preview-wrapped.png` / `-static-error.png` / `-static-disabled.png` /
  `-static-read-only.png` — the 10 golden-mirrored story variants, all visually cross-checked
  against `recursica-adapter-mantine-v8/test/golden/ui-kit-dropdown--*.png` (close visual match:
  border/radius/spacing/typography/icon sizing/selected-option highlight all line up).
- `.scratch/dropdown-interaction-open.png` — real Playwright click on the trigger, confirming
  the panel opens and renders correctly styled (post-`dropdown-overlay.css`-fix).
- `.scratch/dropdown-interaction-selected.png` — real Playwright click on an option ("Canada"),
  confirming the panel closes and the trigger's displayed value updates.
- `.scratch/dropdown-keyboard-highlight.png` — real Playwright `ArrowDown` open + two more
  `ArrowDown` presses, confirming `aria-activedescendant`/`data-hovered` roving highlight moves
  (verified programmatically too: highlighted option text "Mexico" after 2 presses from
  "United States").
- Real Playwright-driven checks (not just screenshots) also confirmed: `Enter` selects the
  highlighted option and closes the panel; `Escape` closes the panel **and** leaves DOM focus on
  the trigger button (`document.activeElement` check); clicking outside the panel (via the
  transparent CDK backdrop) closes it; the `Clearable` story's clear button removes the value
  and restores the placeholder.

No golden-comparison automation exists in this adapter yet (same as every other component here)
— comparisons above are manual visual review of the screenshots side by side with the reference
PNGs, not pixel-diffed.
