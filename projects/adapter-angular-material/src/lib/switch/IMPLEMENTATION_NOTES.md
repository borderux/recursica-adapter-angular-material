# Switch — Implementation Notes

**Status**: real implementation (`docs/CREATING_AN_ADAPTER.md` step 10). Covers
both `Switch` (`switch.component.ts`, `rec-switch`) and `SwitchGroup`
(`switch-group.component.ts`, `rec-switch-group`) — `SwitchGroup` has no
separate row in `llms.txt` (it's the genesis adapter's own `Switch.Group`
static export, not a top-level component in the integration report's own
table), so its status is documented here instead, matching `Checkbox`'s/
`Radio`'s own convention.

## `MatSlideToggle` investigation — a genuinely different rejection reason than `Checkbox`/`Radio`

The step-9 stub guessed `MatSlideToggle` as the Material candidate.
Re-investigated against the real compiled source
(`node_modules/@angular/material/fesm2022/slide-toggle.mjs`,
`@angular/material@20.2.14`) rather than assuming the same "hardcoded pixel
geometry" rejection `Checkbox`/`Radio` already reached for `MatCheckbox`/
`MatRadioButton` — the task brief explicitly flagged this as worth
re-checking, and it turned out to matter: the actual blocker here is a
**different** category entirely.

1. **Track/handle geometry is genuinely custom-property-driven — the
   opposite of `Checkbox`'s/`Radio`'s own finding.** Direct `grep`
   extraction of the compiled `styles: [...]` array:
   ```css
   .mdc-switch {
     ...width: var(--mat-slide-toggle-track-width, 52px);
   }
   .mdc-switch__track {
     ...height: var(--mat-slide-toggle-track-height, 32px)...;
   }
   .mdc-switch__handle {
     ...width: var(--mat-slide-toggle-handle-width);
     height: var(--mat-slide-toggle-handle-height)...;
   }
   ```
   Every dimension that sank `MatCheckbox`/`MatRadioButton` (a hardcoded
   literal with no matching custom property) is a real `--mat-slide-
toggle-*` variable here, with only a _fallback_ literal. Confirmed via
   direct extraction, not inferred. On this axis alone, `MatSlideToggle` is
   a **stronger** candidate than either of the two components this adapter
   already rejected for hardcoded geometry.
2. **But its `@Component` declares `encapsulation: ViewEncapsulation.None`**
   — confirmed directly in the compiled `ɵcmp` declaration (`args: [{
selector: 'mat-slide-toggle', ..., encapsulation:
ViewEncapsulation.None, ... }]`). This is the **same rejection category**
   `MatTabGroup`/`MatSelect`/`MatChip`/`MatStepper` already hit (see
   `tabs/IMPLEMENTATION_NOTES.md`), not the pixel-geometry category
   `Checkbox`/`Radio` hit: every element `MatSlideToggle` renders (`.mdc-
switch` button, `.mdc-switch__track`, `.mdc-switch__handle`, the
   built-in on/off icon `<svg>`s, the `<label>`) belongs to _its own_
   component view. Per `docs/STYLING_SYSTEM.md` §3/§4, this adapter's own
   token overrides are `ViewEncapsulation.Emulated`-scoped
   (`_ngcontent-<hash>`-stamped) selectors, which can never reach a child
   component's internally-rendered elements regardless of _that_ child's
   own encapsulation mode — finding 1's real custom-property surface
   doesn't change this; only a global/unscoped stylesheet (the same
   `menu-overlay.css`/`dropdown-overlay.css` workaround pattern used
   elsewhere in this adapter) could reach in, and even that would only
   solve _this_ problem, not finding 3 below.
3. **The on/off thumb icon pair is fixed, un-slotted SVG, and the wrong
   shape besides.** `@if (!hideIcon) { <svg class="mdc-switch__icon
mdc-switch__icon--on">…checkmark…</svg><svg class="mdc-switch__icon
mdc-switch__icon--off">…horizontal-bar…</svg> }` is baked directly into
   `MatSlideToggle`'s own template — no `<ng-content>`/input slot for a
   caller-supplied icon, and `hideIcon` only toggles both together. There
   is no way to swap in Recursica's own check/X icon pair (`Switch.tsx`'s
   `thumbIcon` default renders an X-shaped close glyph, not `MatSlideToggle`'s
   horizontal-bar "off" glyph). Same "fixed, un-slotted markup" category
   `Checkbox`'s finding 3 and `Radio`'s finding 3 already documented, just
   for a differently-shaped icon pair.

**Decision**: hand-build, same outcome as `Checkbox`/`Radio`, but for a
materially different (and, on the geometry axis specifically, weaker) set
of reasons — worth recording precisely because it would have been easy to
skip the re-investigation and assume the same verdict for the same
surface-level reason. Built on a real `<input type="checkbox" role="switch">`
(`appearance: none`), visually hidden via the standard clip-rect technique
(see `switch.component.css`'s own comment on why `Switch`'s input is hidden
while `Checkbox`'s/`Radio`'s own input is the visible glyph itself), wrapped
in a `<label>` so native click delegation (no absolute-positioning hit-test
hack) reaches the nested input from anywhere on the track/thumb/label. Full
token control over track/thumb size, radius, colors, and the real check/
close SVG pair, zero fighting against MDC's `ViewEncapsulation.None`
boundary or its fixed icon markup.

## Does `Switch` compose `FormControlWrapper`? No — confirmed against the reference, not assumed

Checked directly against the genesis adapter's `Switch.tsx`: it never
touches `FormControlWrapper`. Its `label` renders directly beside the track
(`.body` → track/thumb + `.labelWrapper` → `.label`, all from
`Switch.module.css`), the same label-adjacency pattern `Checkbox.tsx`/
`Radio.tsx` already established, not `TextField`'s above/beside-the-control
pattern. The only layout composition `Switch.tsx` does is an _optional_
`FormControlLayout` wrap (`formLayout`/`labelSize`/`controlMaxWidth`/
`controlMinWidth`) purely to align a lone switch's horizontal position
against sibling fields in a `side-by-side` form. `SwitchComponent` mirrors
this exactly — it does **not** provide `RECURSICA_FORM_CONTROL`;
`SwitchGroupComponent` is the one that composes `FormControlWrapperComponent`
(see its own class doc comment) — matching `SwitchGroup.tsx`, which is the
component that actually wraps `WithReadOnlyWrapper`/`FormControlWrapper`,
never `Switch.tsx` itself.

## `SWITCH_GROUP_CONTEXT`: array membership, confirmed from source — not assumed from `Radio`'s adjacency

The task brief explicitly flagged the group semantics as unverified ("could
be multi-select like `CheckboxGroup`, or something else — verify from
source, don't assume"). Checked directly against `SwitchGroup.tsx`:
`RecursicaSwitchGroupProps`'s `value`/`onChange` are `string[]`/
`(value: string[]) => void` — `SWITCH_IMPLEMENTATION_NOTES.md` §5 (the
genesis adapter's own notes) confirms this was deliberately tightened from
`unknown[]` specifically to match Mantine's real `Switch.Group` value type
exactly. This is `Checkbox.Group`'s array-membership shape, **not**
`Radio.Group`'s single-value exclusive selection, despite `Switch` and
`Radio` looking more alike at a glance (both single circular/pill controls,
vs. `Checkbox`'s square box). `SWITCH_GROUP_CONTEXT`
(`switch-group-context.ts`) is therefore modeled on `CHECKBOX_GROUP_CONTEXT`
(`toggle()`, array `value`) — every projected `<rec-switch>` with its own
`[value]` bound injects it `@Optional()` and defers its checked state/
toggling to `toggle()`, exactly `CheckboxComponent`'s "Group membership"
pattern, just renamed.

## Known gap: `readOnly` approximates `ReadOnlyField`, which doesn't exist yet

The genesis adapter's `Switch.tsx`/`SwitchGroup.tsx` both route their
`readOnly` prop through `ReadOnlyField`/`WithReadOnlyWrapper` for a real
read-only display mode. `ReadOnlyField` is not yet built in this Angular
adapter (still `🚧` in `llms.txt` at the time of writing) — building it was
explicitly out of scope for this task. Same treatment `Checkbox`/`Radio`
already gave this identical gap.

**Approximation shipped instead**:

- `SwitchComponent`'s `readOnly` input, when effectively `true` (its own
  input, or inherited from a group's context — see `effectiveReadOnly`),
  renders a plain, non-interactive `<div class="body readOnlyDisplay">`
  reusing the same token-driven track/thumb/icon/label look, with no
  `<input>` element and no click/keyboard handlers, `aria-readonly="true"`.
  Checked state is driven by a `.trackChecked`/`.thumbChecked` class pair
  (no real `<input>` to key `:checked` off of in this branch) rather than
  the interactive branch's `input:checked + .track` sibling selector.
  Colors reuse the disabled-state tokens (`switch.component.css`'s
  `.readOnlyDisplay` rules) — no dedicated read-only color-token set exists
  in the schema either.
- `SwitchGroupComponent`'s `readOnly` input does **not** swap its projected
  children for a `ReadOnlyField` text rendering of `value`. It flows
  `readOnly` down through `SWITCH_GROUP_CONTEXT`, and each projected
  `<rec-switch>` switches to _its own_ read-only approximation above. The
  real switch glyphs (checked/unchecked, still using their real token
  colors, just dimmed) keep rendering non-interactively — visually closer
  to the golden `ui-kit-switchgroup--read-only.png` screenshot (which shows
  greyed-out switch tracks, not a comma-joined text sentence) than a
  generic text formatter would have produced anyway, but it is **not** real
  `ReadOnlyField`/`WithReadOnlyWrapper` parity.

**Follow-up**: once `ReadOnlyField`/`WithReadOnlyWrapper` exist in this
adapter, both `Switch` and `SwitchGroup` should be revisited to compose them
for `readOnly`, replacing this approximation — cross-reference
`checkbox/IMPLEMENTATION_NOTES.md`'s identical follow-up note.

## Not implemented: `readOnlyComponent` render-prop override (skips the `CustomReadOnly` golden story)

The genesis adapter's `Switch.tsx` accepts an optional `readOnlyComponent`
render-prop (`({ checked, label }) => ReactNode`) that, combined with
`readOnly`, entirely replaces the read-only presentation with caller-
supplied markup — `test/golden/ui-kit-switch--custom-read-only.png`
exercises this with a bold colored "ENABLED"/"DISABLED" text swap. This
layers _on top of_ the same `ReadOnlyField`/`WithReadOnlyWrapper` machinery
`Checkbox`/`Radio` also don't have in this adapter (see "Known gap" above);
there is no Angular render-prop equivalent to receive `{ checked, label }`
and no `readOnlyComponent` plumbing to hang it off of. Left unimplemented
rather than approximated with an unverified ad-hoc mechanism — the
`CustomReadOnly` story/golden is not mirrored in `switch.stories.ts`.

## `.input` visually hidden — a "no Mantine base to inherit" gap, same category `Checkbox`'s `.inner`/`.icon` positioning already hit

`Switch.module.css` never declares an `.input` rule at all (Mantine's own
base stylesheet hides/positions the real `<input>` internally — the same
gap `checkbox.component.css`'s own header comment documents for
`.inner`/`.icon`). Hand-built here using the standard visually-hidden
clip-rect technique (`position: absolute; width: 1px; height: 1px; margin:
-1px; overflow: hidden; clip: rect(0,0,0,0);`) rather than Mantine's own
(unknown, unported) internal approach — zero visible footprint, still real
and focusable, so `:focus-visible + .track` fires from genuine keyboard
focus and Space still natively toggles a real `<input type="checkbox">`
with no custom keydown handler. Verified live (see Verification section)
via both a real click on the label and a real `Space` keypress after
`.focus()`.

## `SwitchGroup`'s `controlMaxWidth`/`controlMinWidth`: intentionally omitted, not just unused

Matches the genesis adapter's own documented fix
(`SWITCH_IMPLEMENTATION_NOTES.md`'s final section, "`SwitchGroup` side-by-
side layout always rendered as if stacked"): passing the switch-item's own
inline label-max-width token (200px) as the group's `controlMaxWidth` made
the mandatory side-by-side label column (a fixed 224px, wider than that
cap) always overflow onto its own line. Fixed upstream by not exposing
`controlMaxWidth`/`controlMinWidth` on `SwitchGroup` at all — each switch's
own label already wraps at its own
`--recursica_ui-kit_components_switch-item_properties_label-max-width`
token via `.labelWrapper`. `SwitchGroupComponent` mirrors the reference's
own `Omit<RecursicaFormControlWrapperProps, "controlMaxWidth" |
"controlMinWidth">` by simply never declaring those two `@Input()`s.

## Verification

Built (`npm run build`) and type-checked (`npm run check-types`) clean.
Verified against a real running Storybook on port 6007
(`npm run storybook -- --port 6007` — **never** port 6006, confirmed via
`lsof -i :6006` before and after: same PID (`44878`), same established
connections throughout, Matt's own instance stayed completely undisturbed)
via Playwright (chromium), screenshotted to `.scratch/`:

- `.scratch/switch--default.png` / `-side-by-side-layout.png` /
  `-static-variations.png` / `-read-only.png` — the 4 golden-mirrored
  `Switch` story variants (`CustomReadOnly` skipped — see "Not implemented"
  above), all visually cross-checked against
  `recursica-adapter-mantine-v8/test/golden/ui-kit-switch--*.png`
  (track/thumb size, pill radius, selected/unselected colors, check/close
  icon crossfade, disabled opacity all line up closely).
- `.scratch/switch-group--default.png` / `-stacked-layout.png` /
  `-side-by-side-layout.png` / `-solitary-form-control.png` /
  `-read-only.png` — all 5 golden-mirrored `SwitchGroup` story variants,
  cross-checked against `ui-kit-switchgroup--*.png` the same way.
- `.scratch/switch-interaction-before-click.png` /
  `-after-click.png` / `-after-space.png` — real Playwright interaction
  against the `InteractiveToggle` story: clicking the label toggles
  `input.checked` `false → true` (confirmed programmatically via
  `input.isChecked()`, not just visually — observed `false → true` on
  click), and a subsequent keyboard `Space` press (after `input.focus()`)
  toggles it back `true → false` — real native `<input type="checkbox">`
  behavior, no custom keydown handler needed.
- `.scratch/switch-group-interaction-initial.png` / `-a-and-c.png` /
  `-after-uncheck-a.png` — real Playwright clicks against the
  `InteractiveMultiSelect` story's three switches, confirming the group's
  array `value` updates correctly across multiple items, read directly from
  a `data-testid="selected-value"` text node bound to the story's own local
  `value` array: `'' → 'a' → 'a,c'` via clicks on Option A then Option C,
  then `'a,c' → 'c'` via a keyboard `Space` press on Option A's (focused)
  input.

No golden-comparison automation exists in this adapter yet (same as every
other component here) — comparisons above are manual visual review of the
screenshots side by side with the reference PNGs, not pixel-diffed.
