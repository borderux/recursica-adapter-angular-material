# Chip — Implementation Notes

**Status**: real implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

## The step-9 stub's `MatChip` guess ("EASY") didn't survive reading the real compiled source

The stub's own findings row (`docs/ADAPTER_INTEGRATION_REPORT.md` §9) called this **EASY**
("A standalone `MatChip`... can sit in a plain `<mat-chip-set>` without selection semantics —
dismissible via `MatChipRemove`... Minor compositional overhead... but a strong match"). Reading
`MatChip`/`MatChipOption`/`MatChipRow`'s real compiled output
(`node_modules/@angular/material/fesm2022/chips.mjs`, 2362 lines) before writing any code turned up
the same category of problem `Tabs`/`Stepper`/`Menu`'s own notes already document for
`MatTabGroup`/`MatStepper`/`MatMenu`, plus two findings specific to `Chip`:

1. **`MatChip`'s own compiled metadata declares `encapsulation: i0.ViewEncapsulation.None`**,
   confirmed directly in both the `ɵcmp` call and the `@Component` decorator's `args` (chips.mjs
   line 561/565 in the installed `20.2.0-next.2`). Its real template renders a non-trivial DOM tree
   entirely inside its own view — `<span class="mat-mdc-chip-focus-overlay">`,
   `<span class="mdc-evolution-chip__cell mdc-evolution-chip__cell--primary">` wrapping a
   `<span matChipAction>` with the graphic/label cells, a second trailing cell for the
   remove/edit icon — none of it a plain `<ng-content>` pass-through the way `mat-card`'s template
   is (`Card`'s own notes: "its real compiled template is just `<ng-content></ng-content>`... so
   this adapter's scoped CSS reaches it normally"). Every one of those elements belongs to
   `MatChip`'s own view, never reachable by an Emulated-scoped selector written in this adapter.
   Worse than `Tabs`/`Stepper`'s equivalent finding in one respect: because `MatChip` itself uses
   `ViewEncapsulation.None`, its own ~9KB of baked-in MDC styles (`.mdc-evolution-chip`,
   `.mat-mdc-chip-focus-overlay`, `.mdc-evolution-chip__checkmark-path`, etc.) load as **unscoped
   global CSS** the moment the chips module is imported — not just unreachable, but a real leak
   risk onto the rest of the page.
2. **Material's color/state system for chips has no shape resembling Recursica's 2×2 selection ×
   error matrix.** `MatChip`'s real styles are driven by `--mat-chip-*` custom properties chained to
   `--mat-sys-*` Material System tokens, activated by class-combinator selectors
   (`.mdc-evolution-chip--selected:not(.mdc-evolution-chip--disabled)`,
   `.mat-mdc-standard-chip.mdc-evolution-chip--disabled`, etc. — confirmed directly in the compiled
   `styles: [...]` array). There is no `--mat-chip-*` slot for an "error"/"invalid" chip at all —
   `MatChip`'s only built-in states are selected/highlighted/disabled. Recursica's own contract
   (`recursica-adapter-mantine-v8/src/components/Chip/Chip.module.css`) is the opposite shape: one
   flat set of `--recursica_ui-kit_components_chip_variants_selection-states_{selected,unselected}_
[variants_states_error_]properties_colors_*` tokens per state cell, swapped via a handful of CSS
   custom properties on `.label`/`.label[data-checked]`/`.root[data-error]`. Reaching Recursica's
   exact matrix through `MatChip`'s API would mean overriding a dozen-plus `--mat-chip-*` variables
   per state combination while fighting its own unscoped, `:not()`-chained cascade, for a state
   concept (error) that doesn't otherwise exist in Material chips.
3. **Selection and removal both require extra compositional machinery even for one standalone
   chip.** `MatChipOption`'s `selected`/`selectionChange` only make sense inside a real
   `MatChipListbox` (confirmed: `MatChipOption` reads `chipListSelectable`/`_chipListMultiple`/
   `_chipListHideSingleSelectionIndicator` off its parent list, not off itself), and removal
   (`MatChipRemove`) is documented against `MatChipRow`/`MatChipGrid`, not plain `MatChip` — the
   same "still needs a `mat-chip-set` wrapper even for one chip" caveat the stub's own findings row
   already flagged, compounded once (1) and (2) are factored in.

**Decision**: build `Chip` from scratch — a single hand-built `<span>` tree
(`chip.component.ts`/`.css`), no `@angular/material` import at all. Unlike `Tabs`/`Stepper`/`Menu`,
Recursica's `Chip` is a single leaf component in the source of truth (no compound `.Sub`/`.List`/
`.Panel` API), so this is one component, not a family.

## DOM shape: `.root` → `.label` → `.innerWrapper` → icon/text/delete, matching the React reference directly

`chip.component.ts`'s template reproduces the React reference's own structure exactly: `.root`
(layout-only, `overflow-x: hidden`/`overflow-y: visible`, no visible background — matches
`Chip.tsx`'s outer `<MantineChip>` element) wrapping `.label` (the real visible pill — border,
background, padding, typography, all token-driven) wrapping `.innerWrapper` (a flex row holding
whichever icon renders, the label text, and the delete affordance). `Chip.module.css` was ported
close to verbatim — same custom-property indirection (`--chip-bg`/`--chip-border`/`--chip-text`/
`--chip-icon`/`--chip-close`, swapped per `[data-checked]`/`[data-error]`), same hardcoded
`overflow-x: clip` / `min-width: 0` fixes on `.children` (ported directly from the reference's own
2026-08-17/2026-08-18 fix history, documented in its `CHIP_IMPLEMENTATION_NOTES.md`, rather than
rediscovered from scratch here).

One simplification made possible by not being CSS Modules: the React reference needs a
`.label.label > span:not(.mantineIconWrapper)` override to fix an intermediate `<span>` Mantine's
own `Chip` auto-wraps `children` in (a `display: inline` default that made the chip ~2px taller than
expected — see that file's own "Intermediate Children Wrapper Span display fix" note). This adapter
has no equivalent auto-wrapped span (`.children`'s `<ng-content />` is the only thing inside it, no
Mantine-internal layer in between), so that entire fix has nothing to reproduce here.

## Selected checkmark and leading icon share one CSS class, one color variable

The React reference renders Mantine's own built-in checkmark (a separate `iconWrapper`/`checkIcon`
slot, colored via its own `.mantineIconWrapper` rule) and the custom `.leadingIcon` as two different
elements that happen to be mutually exclusive at any given time. This adapter's template collapses
them into one conditional `@if (checkedValue) { checkmark } @else if (icon) { custom icon }` inside
a single `.leadingIcon` span — both read `color: var(--chip-icon)`, and `--chip-icon` itself already
switches between the `..._leading-icon-color`/`..._selected-icon-color` tokens via the existing
`.label[data-checked]` rule, so the color swap "just works" without a second CSS class. The
checkmark SVG markup (`viewBox="0 0 10 7"`, path `M4 4.586L1.707 2.293A1 1 0 1 0 .293 3.707l3 3a
.997.997 0 0 0 1.414 0l5-5A1 1 0 1 0 8.293.293L4 4.586z`) is the same real Mantine `CheckIcon` markup
`Stepper`'s own notes already established copying verbatim for its completed-step icon — reused here
for the same reason (matches the golden screenshots' checkmark shape exactly, not approximated).

## `checked`/`defaultChecked`/`(checkedChange)`: `Tabs`'s controlled/uncontrolled convention, not a new one

Mirrors `TabsComponent`'s `value`/`defaultValue`/`(valueChange)` trio exactly: `checked` left
unbound means uncontrolled (an internal `signal`, seeded from `defaultChecked`, tracks it and
flips on click); explicitly binding `[checked]` makes this a controlled component — clicking still
emits `(checkedChange)`, but the visible state only changes once the caller updates the bound value.
This is the direct translation of Mantine's own `useUncontrolled`-backed `checked`/`defaultChecked`/
`onChange` trio that `Chip.tsx` forwards straight through to `MantineChip`.

## `isInteractive`/`isRemovable`: `EventEmitter.observed`, the same trick `Stepper` already established

The canonical `RecursicaChipProps.onDelete` only shows the delete ("x") affordance when a caller
actually passes a handler (`!!onDelete` in React — a real prop-presence check Angular has no direct
equivalent for on an `@Output()`). `isRemovable` reads `this.remove.observed`
(`EventEmitter<T>` extends RxJS `Subject<T>`, which exposes a real `observed` getter in the
installed `rxjs@~7.8.0`) — the identical translation `Stepper`'s own `hasClickListener`/
`StepperComponent.stepClick.observed` already established for "is anything actually listening".
`isInteractive` (drives `tabIndex`/`aria-hidden`/the pointer cursor) is
`isRemovable || this.checkedChange.observed` — the same "only count a real handler, not merely a
bound value" fix the React reference's own 2026-08-18 note documents (`isInteractive` there was
originally, incorrectly, `checked !== undefined`, which flagged a display-only
`checked={false}`-pinned chip as interactive even with no `onChange`). This adapter never had that
bug to begin with, since `checked` alone was never going to satisfy `EventEmitter.observed`.

**Verified live**: the `Selected`/`ErrorSelected` stories pass a no-op `(checkedChange)="$event"`
binding purely to become interactive (matching the reference's own `onChange={() => {}}` on the
identical two stories) — screenshotted, both render with the pointer-cursor-eligible
`data-interactive` attribute present on `.root`. The `Unselected`/`ErrorState`/`WithLeadingIcon`
stories bind nothing and render `tabindex="-1"`/`aria-hidden="true"` on `.label`, confirmed via
Playwright's rendered `outerHTML`.

## Accessibility: `role="checkbox"` + `aria-checked`, not `role="button"`

The React reference's own `CHIP_IMPLEMENTATION_NOTES.md` explains its DOM is fundamentally "a
`<label>` linked to a hidden `<input type=checkbox>`" — real checkbox semantics, native accessible
role included for free. This adapter has no native input to inherit that role from (a hand-built
`<span>` tree, per the decision above), so `.label` is given `role="checkbox"` +
`[attr.aria-checked]="checkedValue"` explicitly — the closest direct translation of "this is
fundamentally a checkbox", rather than `role="button"` (which would lose the pressed/not-pressed
semantic entirely). The delete affordance keeps the reference's own `role="button"` +
`tabIndex`/`Enter`/`Space` handling on a plain `<span>` (not a real `<button>`) for the identical
reason its own notes give: a raw nested interactive element inside another interactive element
(here, `.deleteIcon` inside `.label[role=checkbox]`) trips strict ARIA nesting validators — the
same tradeoff the reference makes, kept rather than "fixed", since the reference's own choice is the
source of truth for this component's accessibility contract.

## Focus ring: added, not present in the ported CSS — the reference gets it for free from its real `<input>`

`Chip.module.css` has no `.label:focus-visible` rule at all — only `.deleteIcon:focus-visible`. That
isn't an oversight in the reference: `.label` wraps a real (visually hidden) `<input>`, which gets a
default browser focus treatment through Mantine's own base styles without Recursica's component CSS
needing to add anything. This adapter's hand-built `.label` has no such input to inherit a focus
treatment from, so a `.label:focus-visible` rule was added, using the exact
`box-shadow`/`outline: none` recipe `button.component.css`/`tabs-tab.component.css` already
establish as this adapter's own standard focus-ring recipe (`--recursica_brand_states_focus_*`
tokens, gated behind `:host-context([data-recursica-theme])`) — a deliberate, documented addition to
keep keyboard focusability visible, not a silent deviation.

## Not implemented: icon-only padding (`data-icon-only`)

The reference's `Chip.tsx` computes `isIconOnly = !children && (!!icon || !!onDelete)` and switches
`.label`'s horizontal padding to match (`Chip.module.css`'s `.root[data-icon-only] .label` rule).
Reliably detecting "no projected content" in Angular requires inspecting `<ng-content>`'s actual
projected nodes after view init (`@ContentChild`/`ViewChild` against a wrapper, or reading
`ElementRef.nativeElement.textContent` post-render) — meaningfully more machinery than a plain prop
check, for a variant no story in either this adapter's own `chip.stories.ts` or the reference's
`Chip.stories.tsx`/golden screenshots exercises (every story passes real text content). Flagged
honestly rather than silently dropped; real follow-up if an icon-only chip use case turns up.

## `disabled`: declared as this component's own `@Input()`, not part of the canonical contract

Same situation `Button`'s own notes document for `loading`: the React reference's `disabled` is
inherited from Mantine's native `ChipProps` (itself from the underlying `<input>`), which has no
equivalent underlying type to inherit from here, and `RecursicaChipProps.ts` doesn't declare it
either. Declared directly anyway — `Chip.module.css`'s own `.root[data-disabled]` rule (opacity +
`cursor: not-allowed`) exists in the ported CSS and needs a real trigger, and the reference's own
`Chip.stories.tsx` `argTypes` documents a `disabled` control ("Applies disabled token states") even
though no individual golden screenshot isolates it. No dedicated story/screenshot for this adapter's
`disabled` state either, for the same reason — flagged rather than silently assumed correct.

## `deleteIconRef`: not implemented

The reference's `deleteIconRef: React.Ref<HTMLSpanElement>` lets a parent (e.g. `FileUpload`'s file
list) move real DOM focus to the delete icon imperatively for roving-tabindex arrow-key navigation.
`deleteTabIndex` (the other half of that pair) is implemented (`@Input() deleteTabIndex = 0`, passed
straight to `.deleteIcon`'s `tabindex`), but the ref side has no consumer yet in this adapter (no
`FileUpload` built here to exercise it) — Angular's equivalent would be a `@ViewChild` exposed via
`ExpressionChangedAfterItHasBeenCheckedError`-safe public getter, real but genuinely speculative
without a real caller. Not implemented; flagged rather than guessed at.

## Verification

Built (`npm run build`) clean. Verified visually against a real running Storybook (this adapter's
own instance on port 6007 — Matt's own instance on the default port 6006 was confirmed running
both before and after, and was never touched) via Playwright (chromium), screenshotted to
`.scratch/` and compared directly against the golden reference images
(`recursica-adapter-mantine-v8/test/golden/ui-kit-chip--*.png`):

- `.scratch/chip-default.png`, `chip-unselected.png`, `chip-selected.png`, `chip-error-state.png`,
  `chip-error-selected.png`, `chip-removable.png`, `chip-with-leading-icon.png`,
  `chip-with-leading-icon-selected.png` — all eight required variants, each read closely against
  its matching golden: pill shape/radius, unselected grey vs. selected maroon/pink vs. error red
  background-border-text combinations, the checkmark replacing the leading icon exactly when
  checked (not sitting beside it), the "x" remove affordance, all match.
- No console or `pageerror` events observed across any of the eight stories (a real Playwright
  listener was attached for both, not just checked after the fact).
- `.scratch/chip-interactive-toggle-before.png`/`-after.png` — a real Playwright click on the
  `InteractiveToggle` story (verification-only, not part of the golden set): `aria-checked` read
  `"false"` → `"true"` and the label's own projected text changed from "Click to select" to
  "Selected" after the click, confirming `(checkedChange)` actually drives the rendered state
  end-to-end, not just a static render.
- `.scratch/chip-interactive-removable-before.png`/`-after.png` — a real Playwright click on
  `.deleteIcon` in the `InteractiveRemovable` story: the chip actually unmounts and a
  `[data-testid="removed"]` sentinel appears in its place, confirming `(remove)` fires for real
  clicks (not just a bound handler that's never exercised).
