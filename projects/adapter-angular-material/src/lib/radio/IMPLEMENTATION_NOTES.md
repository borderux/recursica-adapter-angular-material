# Radio — Implementation Notes

**Status**: real implementation (`docs/CREATING_AN_ADAPTER.md` step 10). Covers
both `Radio` (`radio.component.ts`, `rec-radio`) and `RadioGroup`
(`radio-group.component.ts`, `rec-radio-group`) — `RadioGroup` has no
separate row in `llms.txt` (mirrors `CheckboxGroup`'s own treatment: the
genesis adapter's own `Radio.Group` static export, not a top-level component
in the integration report's own table), so its status is documented here
instead.

## `MatRadioButton` investigation — re-verified against real evidence, not assumed from `Checkbox`'s verdict

The step-9 stub guessed `MatRadioButton` (`radio.d.ts`) as the Material
candidate. `Checkbox`'s own `MatCheckbox` investigation already rejected a
structurally similar small, `Emulated`-encapsulated widget for hardcoded
pixel geometry — tempting to assume `MatRadioButton` lands the same way on
precedent alone, but it was investigated independently against the real
compiled source (`node_modules/@angular/material/fesm2022/radio.mjs`,
`@angular/material@20.2.14`) rather than defaulted to "reject":

1. **No `ViewEncapsulation.None`.** The compiled `ɵcmp` declaration block
   (`type: MatRadioButton, isStandalone: true, selector: "mat-radio-button",
...`) has no `encapsulation` key at all — default `Emulated`, confirmed
   by its absence, not inferred. Same as `MatCheckbox` and every component
   in this adapter.
2. **But its visible circle is hardcoded pixels, not a theming token — the
   same rejection category `Checkbox` already hit, independently
   confirmed.** Extracted the actual compiled `styles: [...]` array
   programmatically (not `grep`-guessed) from the bundle:
   `.mat-mdc-radio-button .mdc-radio{...width:20px;height:20px;...}`,
   `.mdc-radio__background{width:20px;height:20px}`, and
   `.mdc-radio__outer-circle{border-width:2px;border-style:solid;
border-radius:50%}` — all literal pixels. Recursica's own token for this
   circle — `--recursica_ui-kit_components_radio-button_properties_size` —
   resolves to **24px** (confirmed in `recursica_variables_scoped.css`), not
   20px, with its own `border-size` token, not a hardcoded `2px`. The
   _only_ size-shaped custom property `MatRadioButton` exposes is
   `--mat-radio-state-layer-size` (default `40px`) — the invisible
   ripple/touch-target padding wrapped _around_ the 20px circle
   (`padding:calc((var(--mat-radio-state-layer-size, 40px) - 20px)/2)`),
   not the circle itself; there is no `--mat-radio-size`-equivalent knob
   anywhere in the compiled CSS. Exactly like `MatCheckbox`, `MatRadioButton`'s
   _color_ story (`--mat-radio-selected-icon-color`,
   `--mat-radio-disabled-selected-icon-color`, etc.) _is_ fully
   custom-property-driven — only its geometry isn't.
3. **The selected dot is fixed, un-slotted markup, not a projectable
   icon.** `.mdc-radio__inner-circle` is a plain CSS circle
   (`border-radius:50%`) shown/hidden via `transform:scale(0)`→`scale(1)`,
   not an SVG and with no `<ng-content>`/input slot for a caller-supplied
   icon — no independent size-token relationship the way Recursica's own
   `--recursica_ui-kit_components_radio-button_properties_icon-size` (a
   token distinct from the box itself) assumes.

Getting from 20px to 24px would mean overriding `.mdc-radio`/
`.mdc-radio__background`/`.mdc-radio__native-control` directly — reachable
in principle (no `ViewEncapsulation.None`), but not through
`MatRadioButton`'s own documented `--mat-radio-*` theming API, and only by
reaching past this component's Emulated boundary into a different
component's Emulated boundary — the same "global stylesheet needed to reach
past a nested component's own view" category `checkbox/
IMPLEMENTATION_NOTES.md` and `dropdown/IMPLEMENTATION_NOTES.md` already
document.

**Decision**: hand-build on a real `<input type="radio">` (`appearance:
none`, matching the genesis adapter's own `Radio.module.css` reset) plus a
custom SVG dot glyph — the genesis adapter's own `RadioIcon`
(`<circle cx="8" cy="8" r="5" />` on `viewBox="0 0 16 16"`), the same shape
category `checkbox.component.ts`'s SVG check glyph already uses. Full token
control over circle size, border, radius, and icon size, zero fighting
against MDC's own hardcoded geometry. This verdict happens to land the same
way `Checkbox`'s did, for the same _category_ of reason (hardcoded pixel
geometry on an otherwise Emulated-encapsulated, close-but-not-quite-
compatible component) — that overlap is real, independently re-verified
with fresh evidence extracted straight from the compiled `radio.mjs`
bundle, not assumed from `Checkbox`'s precedent.

## Does `Radio` compose `FormControlWrapper`? No — same pattern `Checkbox` already established, confirmed against `Radio.tsx`

Checked directly against the genesis adapter's `Radio.tsx`: it never touches
`FormControlWrapper` either. `label` renders directly beside the circle
(`.body` → `.inner` (circle) + `.labelWrapper` → `.label`, all from
`Radio.module.css`), with the same optional `FormControlLayout` wrap
(`formLayout`/`labelSize`/`controlMaxWidth`/`controlMinWidth`) purely to
align a lone radio's horizontal position against sibling fields in a
`side-by-side` form. `RadioComponent` mirrors this exactly — it does
**not** provide `RECURSICA_FORM_CONTROL`; `RadioGroupComponent` is the one
that composes `FormControlWrapperComponent` (see its own doc comment),
matching `RadioGroup.tsx`, which is the component that actually wraps
`WithReadOnlyWrapper`/`FormControlWrapper`, never `Radio.tsx` itself.

## `RADIO_GROUP_CONTEXT`: DI context, single-value exclusive selection — not `CHECKBOX_GROUP_CONTEXT`'s array-toggle shape

Angular has no context API. `RadioGroupComponent` provides a small object
(via a `useFactory` provider, not `useExisting` — same reasoning
`CheckboxGroupComponent`'s own doc comment already gives) under
`RADIO_GROUP_CONTEXT` (`radio-group-context.ts`) — the same DI-context
translation `CHECKBOX_GROUP_CONTEXT` established for `Checkbox`/
`CheckboxGroup`, but reshaped for exclusive, single-value selection instead
of array-toggle selection:

- `value: string | undefined` (at most one selected item), not
  `readonly string[]`.
- `select(itemValue)`, not `toggle(itemValue)` — a radio can only ever be
  turned _on_ by user interaction, never off by re-clicking the same one.
  Mirrors native `<input type="radio">` semantics directly, rather than
  `CheckboxGroup.tsx`'s array-toggle semantics.
- `name: string` — a field `CheckboxGroupContext` has no equivalent of.
  Every projected `<rec-radio>` in the same group renders this same native
  `name` attribute (`effectiveName` on `RadioComponent`, sourced from
  `groupCtx.name`). This is the crux of the whole implementation: it's what
  gives the **browser itself** real exclusive-selection _and_ real
  keyboard arrow-key navigation between siblings, with zero hand-rolled
  roving-tabindex/keydown logic anywhere in this adapter — confirmed live
  (see Verification below), not assumed from "native inputs generally do
  this."

**Always established** (unlike `CheckboxGroup`'s `isArrayControlled` gate,
which skips providing real group-driving behavior when neither `value` nor
`defaultValue` is bound, for callers like `TransferList` who only want the
group's layout styling): a `RadioGroup` with no bound `value`/`defaultValue`
still needs the shared `name` wiring for its children's native
exclusive-selection/arrow-key behavior to work _at all_ — there is no
"plain layout wrapper, no native grouping" mode the way an ungrouped
`CheckboxGroup` has. A fresh `name` (`rec-radio-group-name-N`) is generated
per `RadioGroupComponent` instance rather than derived from `id`/`label`, so
two independent `<rec-radio-group>`s on the same page never accidentally
collide into one native exclusive-selection group just because their labels
happened to match.

## Real bug found and fixed: seeding an uncontrolled signal from an `@Input()` default inside the constructor never picks up the bound value

While verifying the `CheckedState`/`DisabledChecked` golden stories live
(both use `[defaultChecked]="true"`, uncontrolled), the rendered radio came
back **unchecked** — not a styling miss, a real state bug. Root cause,
confirmed by reading Angular's own component-instantiation order rather
than guessed: Angular applies `@Input()`-bound values to a component
instance **after** its constructor finishes running (constructor-time reads
of an `@Input()` field always see the plain class-field default — `false`
here — never a template-bound override), but **before** `ngOnInit` runs.
Both `RadioComponent` and `CheckboxComponent` originally seeded their
uncontrolled-state signal with `this.defaultChecked`/`this.defaultValue`
either in the constructor body (`Checkbox`, `Radio`'s own first draft) or in
a field initializer (`CheckboxGroup`, `Radio`'s own first draft of
`RadioGroup`) — both timings are wrong for the same reason.

**Fixed for `Radio`/`RadioGroup`** (both are new code in this task, safe to
correct): `RadioComponent` now implements `OnInit` and seeds
`_uncontrolledChecked` from `this.defaultChecked` in `ngOnInit()` instead of
the constructor; `RadioGroupComponent` does the identical fix for
`_uncontrolledValue`/`defaultValue`. Confirmed fixed live via Playwright —
before the fix, `.scratch/radio--checked-state.png` and
`.scratch/radio--disabled-checked.png` rendered visibly unchecked circles;
after, both render the filled/selected dot matching
`ui-kit-radio--checked-state.png`/`ui-kit-radio--disabled-checked.png`.

**Not fixed in `Checkbox`/`CheckboxGroup`**: those files are already-staged
work from a prior task and explicitly out of scope to modify here (per this
task's own constraints) — `checkbox--static-variations.png`'s "Acknowledge
Configuration" row (`[defaultChecked]="true"`) is confirmed, by the same
Playwright screenshot evidence, to render unchecked today, which is the
identical latent bug, just left alone. Flagged here rather than silently
worked around, so it's discoverable the next time `Checkbox` is revisited —
cross-reference this section from any future `Checkbox` bugfix pass.

## `.inner`'s `margin-top` centering trick, ported faithfully

`Radio.module.css`'s `.inner` sets its own `font-size` to the label's text
token so an `em`-based line-height token evaluates to the right pixel
value, then offsets `margin-top` by `(line-height - circle-size) / 2` to
vertically center the circle against the label's first line of text — the
same "no Mantine base to inherit" category `checkbox/
IMPLEMENTATION_NOTES.md`'s `.inner`/`.icon` positioning finding and
`tabs/IMPLEMENTATION_NOTES.md`'s active-underline finding already document,
just for this specific centering formula. Reproduced verbatim in
`radio.component.css` rather than re-derived, since the em-based
line-height token can't be multiplied by font-size in plain CSS (per the
source file's own comment).

## `border-radius` _is_ a real Recursica token here — not a hardcoded `50%`

Worth flagging explicitly since it would be an easy copy-paste mistake from
"a radio is always a circle": `Radio.module.css`'s `.root .radio` sets
`border-radius: var(--recursica_ui-kit_components_radio-button_properties_
border-radius)`, not a literal `50%`. The token itself resolves to
`var(--recursica_brand_dimensions_border-radii_2xl)` (confirmed in
`recursica_variables_scoped.css`) — a large-but-finite pill radius, which
happens to render visually indistinguishable from `50%` at this element's
24px box size, but is a real theme-token indirection, not a hardcoded
geometric constant. `radio.component.css` uses the token.

## Known gap: `readOnly` approximates `ReadOnlyField`, which doesn't exist yet

The genesis adapter's `Radio.tsx`/`RadioGroup.tsx` both route their
`readOnly` prop through `ReadOnlyField`/`WithReadOnlyWrapper` for a real
read-only display mode. `ReadOnlyField` is not yet built in this Angular
adapter (still `🚧` in `llms.txt` at the time of writing) — building it was
explicitly out of scope for this task. Same treatment `Checkbox`/`Dropdown`
already gave this identical gap.

**Approximation shipped instead** (mirrors `Checkbox`'s own approximation
exactly, single-selection instead of array-selection):

- `RadioComponent`'s `readOnly` input, when effectively `true` (its own
  input, or inherited from a group's context — see `effectiveReadOnly`),
  renders a plain, non-interactive `<div class="body readOnlyDisplay">`
  reusing the same token-driven circle/icon/label look, with no `<input>`
  element and no click/keyboard handlers, `aria-readonly="true"`. Colors
  reuse the disabled-state tokens (`radio.component.css`'s
  `.readOnlyDisplay` rules) — no dedicated read-only color-token set exists
  in the schema either.
- `RadioGroupComponent`'s `readOnly` input does **not** swap its projected
  children for a `ReadOnlyField` text rendering of `value`. It flows
  `readOnly` down through `RADIO_GROUP_CONTEXT`, and each projected
  `<rec-radio>` switches to _its own_ read-only approximation above. The
  real radio glyphs (selected/unselected, still using their real token
  colors, just dimmed) keep rendering non-interactively — visually closer
  to the golden `ui-kit-radiogroup--read-only.png` screenshot (which shows
  a greyed-out radio circle, not a comma-joined text sentence) than a
  generic text formatter would have produced anyway, but it is **not** real
  `ReadOnlyField`/`WithReadOnlyWrapper` parity: no `readOnlyComponent`/
  `emptyValueComponent` override support exists.

**Follow-up**: once `ReadOnlyField`/`WithReadOnlyWrapper` exist in this
adapter, both `Radio` and `RadioGroup` should be revisited to compose them
for `readOnly`, replacing this approximation — cross-reference
`checkbox/IMPLEMENTATION_NOTES.md`'s identical follow-up note.

## Not implemented: `description`/`error` on the atomic `Radio`

Same gap `Checkbox` already documented for itself: the genesis adapter's
`RadioWrapperProps` inherits `description`/`error` from Mantine's native
`RadioProps`, rendered internally by Mantine's own `Input`-family machinery,
independent of the `classNames` override this adapter's own port is based
on. `Radio.module.css` has no dedicated token/class for either at the
primitive level (only `RadioGroup`'s `error`, routed through
`FormControlWrapper`, has real token-driven treatment), and no story/golden
screenshot exercises them on a standalone `Radio` either. Left out of
`RadioComponent`'s `@Input()` surface entirely and documented here as an
open gap, same treatment `checkbox/IMPLEMENTATION_NOTES.md` already gave
this identical gap.

## Verification

Built (`npm run build`) and type-checked (`npm run check-types`) clean.
Verified against a real running Storybook on port 6007
(`npm run storybook -- --port 6007` — **never** port 6006; confirmed via
`lsof -i :6006` before and after, PID `44878` unchanged throughout, Matt's
own instance stayed completely undisturbed) via Playwright (chromium),
screenshotted to `.scratch/`:

- `.scratch/radio--default.png` / `-side-by-side-layout.png` /
  `-checked-state.png` / `-disabled-unchecked.png` /
  `-disabled-checked.png` / `-read-only.png` — the 6 golden-mirrored
  `Radio` story variants, all visually cross-checked against
  `recursica-adapter-mantine-v8/test/golden/ui-kit-radio--*.png`
  (circle/border/radius/spacing/typography/dot sizing/disabled-opacity all
  line up closely).
- `.scratch/radio-group--default.png` / `-stacked-layout.png` /
  `-side-by-side-layout.png` / `-read-only.png` — the 4 golden-mirrored
  `RadioGroup` story variants, cross-checked against
  `ui-kit-radiogroup--*.png` the same way. `-side-by-side-layout.png` wraps
  onto more columns than the golden purely because this adapter's own
  Playwright viewport (900px) is wider than the golden's own story-canvas
  width — same viewport-width caveat `checkbox/IMPLEMENTATION_NOTES.md`'s
  own `SideBySideLayout` finding already documents; the flex-row/wrap
  layout logic itself is unchanged.
- `.scratch/radio-interaction-before-click.png` /
  `-after-click.png` — real Playwright interaction against the
  `InteractiveToggle` story: clicking the label selects a real, standalone
  (non-grouped) `<input type="radio">`, confirmed programmatically via
  `input.isChecked()` (`false → true`), not just visually. A second click
  on the same standalone radio was also verified to leave it `checked`
  (native radios can't self-uncheck via a second click on themselves — only
  a sibling with the same `name` selects it away).
- `.scratch/radio-group-interaction-initial.png` /
  `-after-click-a.png` / `-after-click-c.png` — real Playwright clicks
  against the `InteractiveExclusiveSelect` story's three radios, confirming
  real native exclusive selection driven purely by shared `name`: clicking
  Option A selects only A (`A=true, B=false, C=false`, bound value `'a'`);
  clicking Option C then automatically deselects A **without any explicit
  deselect code running** — the browser's own native same-`name` exclusion
  did it — leaving `A=false, C=true`, bound value `'c'`. Read directly from
  a `data-testid="selected-value"` text node bound to the story's own local
  `value`, and from each `<input>`'s own `.isChecked()`, not inferred from
  screenshots.
- `.scratch/radio-group-interaction-after-arrowdown.png` — real Playwright
  keyboard interaction: after focusing the checked Option A radio, a native
  `ArrowDown` keypress moved the group's bound value `'a' → 'b'` (and a
  second `ArrowDown` → `'c'`), confirming real **native browser arrow-key
  navigation between siblings**, not just focus movement — exactly the
  behavior the task brief called out as the key thing to verify, and
  something this adapter never had to implement by hand: it falls directly
  out of every group member sharing one native `name` attribute via
  `RADIO_GROUP_CONTEXT`.
- `.scratch/radio-group-interaction-disabled-member.png` — real Playwright
  click against the `InteractiveDisabledMember` story: a `[disabled]="true"`
  radio nested inside an otherwise-active group could not be forced into a
  checked state by a direct click (`force: true`, bypassing Playwright's own
  actionability guard) — `input.checked` stayed `false` and the group's
  bound value stayed `'a'`, confirming a real native `disabled` attribute on
  the input, not just a CSS-only dimmed appearance.
- Found and fixed a real state bug along the way — see "Real bug found and
  fixed" above — rather than shipping golden-looking-but-broken screenshots
  for the `CheckedState`/`DisabledChecked` stories.

No golden-comparison automation exists in this adapter yet (same as every
other component here) — comparisons above are manual visual review of the
screenshots side by side with the reference PNGs, not pixel-diffed.
