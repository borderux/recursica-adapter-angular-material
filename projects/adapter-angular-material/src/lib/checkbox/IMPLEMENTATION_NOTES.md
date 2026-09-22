# Checkbox — Implementation Notes

**Status**: real implementation (`docs/CREATING_AN_ADAPTER.md` step 10). Covers
both `Checkbox` (`checkbox.component.ts`, `rec-checkbox`) and `CheckboxGroup`
(`checkbox-group.component.ts`, `rec-checkbox-group`) — `CheckboxGroup` has no
separate row in `llms.txt` (it's the genesis adapter's own `Checkbox.Group`
static export, not a top-level component in the integration report's own
table), so its status is documented here instead.

## `MatCheckbox` investigation — close, but rejected on real evidence, not assumed

The step-9 stub guessed `MatCheckbox` (`checkbox.d.ts`) as the Material
candidate. Unlike `MatTabGroup`/`MatSelect`/`MatChip`/`MatStepper` (all
rejected elsewhere in this adapter for `ViewEncapsulation.None` /
content-projection-shape reasons — see `tabs/`, `dropdown/`, `chip/`
IMPLEMENTATION_NOTES.md), `MatCheckbox` is a much smaller, less templated
component and deserved a real second look before assuming the same outcome.
Investigated against the real compiled source
(`node_modules/@angular/material/fesm2022/checkbox.mjs`,
`@angular/material@20.2.14`):

1. **No `ViewEncapsulation.None`.** `grep -n encapsulation` on the compiled
   bundle finds no hit inside `MatCheckbox`'s own `ɵcmp`/`@Component`
   declaration — it uses Angular's default `Emulated` encapsulation, same as
   every component in this adapter. Genuinely better-behaved than the four
   priors.
2. **But its visible box is hardcoded pixels, not a theming token.** The
   compiled CSS: `.mdc-checkbox{flex:0 0 18px;width:18px;height:18px;...}`
   and `.mdc-checkbox__background{width:18px;height:18px;border:2px solid
currentColor;border-radius:2px;...}`. Confirmed via direct
   `grep -o` extraction of the compiled `styles` array, not inference.
   Recursica's own token for this exact box —
   `--recursica_ui-kit_components_checkbox_properties_size` — resolves to
   **24px** (confirmed in `recursica_variables_scoped.css`), not 18px, with
   its own `border-radius` token (`--recursica_brand_dimensions_border-radii_sm`),
   not a hardcoded `2px`. `MatCheckbox`'s color story (`--mat-checkbox-
selected-icon-color`, etc.) _is_ fully `--mat-checkbox-*` custom-property
   driven — only its geometry isn't.
3. **The checkmark/indeterminate-dash are fixed, un-slotted markup.**
   `.mdc-checkbox__checkmark` is a literal `<svg><path d="M1.73,12.91
8.1,19.28 22.79,4.59"/></svg>` baked directly into `MatCheckbox`'s own
   template (no `<ng-content>`/input slot for it), and
   `.mdc-checkbox__mixedmark` is a plain CSS bar. Only their _color_ is
   themeable via the documented API; shape/size is fixed relative to the
   hardcoded 18px box. Recursica's own
   `--recursica_ui-kit_components_checkbox_properties_icon-size`
   (`--recursica_brand_dimensions_icons_sm`) is an independently-sized token
   with no `MatCheckbox` knob for that relationship.

Getting from 18px to 24px would mean overriding `.mdc-checkbox`/
`.mdc-checkbox__background` directly — real classes, reachable in principle
since there's no `ViewEncapsulation.None` involved, but not through
`MatCheckbox`'s own documented `--mat-checkbox-*` theming API, and only from
a stylesheet reaching past this component's own Emulated boundary into a
_different_ component's Emulated boundary (the same "global stylesheet
needed to reach past a nested component's own view" category
`dropdown/IMPLEMENTATION_NOTES.md`'s `dropdown-overlay.css` finding already
documents, just triggered by hardcoded sizing instead of a CDK-overlay
reparent).

**Decision**: hand-build on a real `<input type="checkbox">`
(`appearance: none`, matching the genesis adapter's own
`Checkbox.module.css` reset) plus a custom SVG check/indeterminate glyph —
the same shape `dropdown.component.css`'s trigger already uses. Full token
control over box size, border, radius, and icon, zero fighting against
MDC's own hardcoded geometry. This is the first rejection in this adapter
driven by hardcoded **pixel geometry** on an otherwise-compatible
`Emulated`-encapsulated component, rather than a DOM-shape/content-
projection mismatch — genuinely a different, closer call than
`Tabs`/`Select`/`Chip`/`Stepper`, and documented as such rather than
defaulted to "reject" on precedent alone.

## Does `Checkbox` compose `FormControlWrapper`? No — confirmed against the reference

Checked directly against the genesis adapter's `Checkbox.tsx` rather than
assumed: it **never** touches `FormControlWrapper`. Its `label` renders
directly beside the box (`.body` → `.inner` (box) + `.labelWrapper` →
`.label`, all from `Checkbox.module.css`), not above/beside the control the
way a `TextField`'s label does — there's no `id`/`aria-describedby` wiring
to a separate label component. The only layout composition `Checkbox.tsx`
does is an _optional_ `FormControlLayout` wrap (`formLayout`/`labelSize`/
`controlMaxWidth`/`controlMinWidth`, flattened onto `Checkbox`'s own prop
surface) purely to align a lone checkbox's horizontal position against
sibling fields in a `side-by-side` form — `FormControlLayout`'s own
`leftSection` stays empty in that case (no label passed to it), it just
reserves the column width.

`CheckboxComponent` mirrors this exactly:

- It does **not** implement `RECURSICA_FORM_CONTROL` / provide itself to an
  ancestor `FormControlWrapperComponent`'s `ContentChild` query — there's
  nothing useful for that query to attach to here.
- `formLayout`/`labelSize`/`controlMaxWidth`/`controlMinWidth` are its own
  `@Input()`s; when `formLayout` is set, the template wraps itself in
  `<rec-form-control-layout>` internally (via an `<ng-template
#checkboxTpl>` + `NgTemplateOutlet`, since Angular templates can't be
  conditionally nested two different ways without duplicating markup
  otherwise).
- `CheckboxGroupComponent` is the one that composes
  `FormControlWrapperComponent` — matching the genesis adapter's
  `CheckboxGroup.tsx`, the component that actually wraps
  `WithReadOnlyWrapper`/`FormControlWrapper`, never `Checkbox.tsx` itself.
  See `checkbox-group.component.ts`'s own class doc comment for the full
  rationale.

This was the specific question flagged in the task brief ("check whether
Checkbox actually composes FormControlWrapper at all... or has its own
simpler label-adjacency pattern") — answer: the latter, confirmed against
`Checkbox.tsx`, not assumed from `Dropdown`'s precedent.

## `CHECKBOX_GROUP_CONTEXT`: DI context, not React context

Angular has no context API. `CheckboxGroupComponent` provides a small object
(via a `useFactory` provider, not `useExisting` — see below) under
`CHECKBOX_GROUP_CONTEXT` (`checkbox-group-context.ts`) — the same
translation `TABS_CONTEXT` already established for `Tabs`/`Tab`/`TabPanel`.
Every projected `<rec-checkbox>` injects it `@Optional()` in its
constructor and, when it has its own `[value]` bound, defers its checked
state and toggling to the group entirely — mirroring the genesis adapter's
own documented finding in `CheckboxGroup.tsx`'s comment block: Mantine's
real `Checkbox.Group` forces every child's `checked` from context "even one
given neither `value` nor `defaultValue`", the same override priority
implemented here via `CheckboxComponent.isGroupMember`/`checkedValue`.

**`useFactory`, not `useExisting`**: `CheckboxGroupComponent`'s own
`@Input() value` is the _controlled_ value (`string[] | undefined` — mirrors
Mantine's `CheckboxGroupProps.value`), which can't also be the context's
_resolved_, always-concrete `readonly string[]` under the same property
name. The provider factory wraps the real component instance
(`deps: [forwardRef(() => CheckboxGroupComponent)]`) in a plain object
exposing `value`/`disabled`/`readOnly` getters and a `toggle()` method that
delegate to distinctly-named members (`resolvedValue`, `effectiveDisabled`,
`toggle()`) on the component itself.

**Only actually drives children when array-controlled** (`value` or
`defaultValue` bound on `<rec-checkbox-group>`) **and** the child itself has
`[value]` set — mirrors `CheckboxGroup.tsx`'s own `isArrayControlled` gate,
which skips Mantine's real `Checkbox.Group` primitive entirely for callers
who only want the group's layout/gap styling (e.g. `TransferList`'s
ungrouped rows, each independently controlled). An uncontrolled group with
unvalued children behaves as a plain layout wrapper; each child manages its
own `checked`/`defaultChecked`/`(checkedChange)` independently, the same
convention `Chip`'s own `checked`/`defaultChecked`/`(checkedChange)` already
established.

## `.inner`/`.icon` positioning: no Mantine base to inherit (same gap category `Tabs` already documented)

The genesis `Checkbox.module.css` never declares `position: relative`/
`position: absolute` for `.inner`/`.icon` at all. Reading Mantine's own
compiled base stylesheet directly (`@mantine/core/styles/Checkbox.css`)
shows those rules live in Mantine's own **base** CSS
(`.m_26062bec { position: relative; ... }`, `.m_bf295423 { position:
absolute; inset: 0; margin: auto; ... }`), which this hand-built component
has no equivalent of and had to declare itself — the same "no Mantine base
to inherit" category `tabs/IMPLEMENTATION_NOTES.md`'s active-underline
finding already documents, just for the checkmark overlay instead of a
border. `checkbox.component.css` declares `.inner { position: relative }`
and `.icon { position: absolute; inset: 0; margin: auto; pointer-events:
none; }` directly, confirmed correct live (see Verification).

## `CheckboxGroup.tsx`'s duplicated `.groupRoot` CSS block, ported faithfully rather than resolved by guesswork

The source-of-truth `Checkbox.module.css` declares `.groupRoot`/
`.groupRoot[data-layout="..."]` **twice** (a "GROUP STYLES" block and a later
"CheckboxGroup Layouts" block), with the second block's `flex-direction:
row` for `side-by-side` cascading over the first block's `flex-direction:
column` for the same selector (later declaration wins at equal
specificity). `checkbox-group.component.css` reproduces both blocks in the
same order for the same reason — trusting ordinary CSS cascade to resolve
identically to the source file, rather than picking whichever direction
"looked right" in the golden screenshot. In practice, at the golden's own
narrow story-canvas width, `SideBySideLayout`'s checkbox items still wrap
onto their own lines regardless of `row`/`wrap`, since each item's natural
content width already exceeds the available row space — confirmed visually
against `.scratch/checkbox-group--side-by-side-layout.png`, which matches
`test/golden/ui-kit-checkboxgroup--side-by-side-layout.png`.

## Known gap: `readOnly` approximates `ReadOnlyField`, which doesn't exist yet

The genesis adapter's `Checkbox.tsx`/`CheckboxGroup.tsx` both route their
`readOnly` prop through `ReadOnlyField`/`WithReadOnlyWrapper` for a real
read-only display mode. `ReadOnlyField` is not yet built in this Angular
adapter (still `🚧` in `llms.txt` at the time of writing) — building it was
explicitly out of scope for this task. Same treatment `Dropdown` already
gave this identical gap.

**Approximation shipped instead**:

- `CheckboxComponent`'s `readOnly` input, when effectively `true` (its own
  input, or inherited from a group's context — see `effectiveReadOnly`),
  renders a plain, non-interactive `<div class="body readOnlyDisplay">`
  reusing the same token-driven box/icon/label look, with no `<input>`
  element and no click/keyboard handlers, `aria-readonly="true"`. Colors
  reuse the disabled-state tokens (`checkbox.component.css`'s
  `.readOnlyDisplay` rules) — no dedicated read-only color-token set exists
  in the schema either.
- `CheckboxGroupComponent`'s `readOnly` input does **not** swap its
  projected children for a `ReadOnlyField` text rendering of `value`. It
  flows `readOnly` down through `CHECKBOX_GROUP_CONTEXT`, and each
  projected `<rec-checkbox>` switches to _its own_ read-only approximation
  above. The real checkbox glyphs (checked/unchecked, still using their
  real token colors, just dimmed) keep rendering non-interactively —
  visually closer to the golden `ui-kit-checkboxgroup--read-only.png`
  screenshot (which shows greyed-out checkbox **boxes**, not a
  comma-joined text sentence) than a generic text formatter would have
  produced anyway, but it is **not** real `ReadOnlyField`/
  `WithReadOnlyWrapper` parity: no `readOnlyComponent`/`emptyValueComponent`
  override support exists.

**Follow-up**: once `ReadOnlyField`/`WithReadOnlyWrapper` exist in this
adapter, both `Checkbox` and `CheckboxGroup` should be revisited to compose
them for `readOnly`, replacing this approximation — cross-reference
`dropdown/IMPLEMENTATION_NOTES.md`'s identical follow-up note.

## Not implemented: `description`/`error` on the atomic `Checkbox`

The genesis adapter's `RecursicaCheckboxProps` type surface includes
`description`/`error` (inherited from Mantine's native `CheckboxProps`,
which — being a full Mantine `Input`-family component under the hood —
renders them itself via its own internal `Input.Description`/`Input.Error`,
independent of the `classNames` override this adapter's own port is based
on). `Checkbox.module.css` has no dedicated token/class for either at the
primitive level (only `CheckboxGroup`'s `error`, routed through
`FormControlWrapper`, has real token-driven treatment), and no story/golden
screenshot exercises them on a standalone `Checkbox` either. Rather than
guess at unverified visual treatment the way `Tabs`' vertical+inverted
combination was flagged instead of implemented, this is left out of
`CheckboxComponent`'s `@Input()` surface entirely and documented here as an
open gap.

## Verification

Built (`npm run build`) and type-checked (`npm run check-types`) clean.
Verified against a real running Storybook on port 6007
(`npm run storybook -- --port 6007` — **never** port 6006, confirmed via
`lsof -i :6006` before and after that Matt's own instance, PID unchanged
throughout, stayed completely undisturbed) via Playwright (chromium),
screenshotted to `.scratch/`:

- `.scratch/checkbox--default.png` / `-side-by-side-layout.png` /
  `-long-label-wrap.png` / `-static-variations.png` / `-read-only.png` — the
  5 golden-mirrored `Checkbox` story variants, all visually cross-checked
  against `recursica-adapter-mantine-v8/test/golden/ui-kit-checkbox--*.png`
  (border/radius/spacing/typography/checkmark sizing/disabled-opacity all
  line up closely).
- `.scratch/checkbox-group--default.png` / `-side-by-side-layout.png` /
  `-stacked-layout.png` / `-read-only.png` — the 4 golden-mirrored
  `CheckboxGroup` story variants, cross-checked against
  `ui-kit-checkboxgroup--*.png` the same way.
- `.scratch/checkbox-interaction-before-click.png` /
  `-after-click.png` / `-after-space.png` — real Playwright interaction
  against the `InteractiveToggle` story: clicking the label toggles
  `input.checked` `false → true` (confirmed programmatically via
  `input.isChecked()`, not just visually), and a subsequent keyboard
  `Space` press (after `input.focus()`) toggles it back `true → false` —
  real native `<input type="checkbox">` behavior, no custom keydown handler
  needed for Space specifically (Space-to-toggle is native browser
  behavior on a real checkbox input; only `.readOnlyDisplay`'s inert `<div>`
  needs no such handling at all, and the interactive branch never
  intercepts or `preventDefault()`s the key).
- `.scratch/checkbox-group-interaction-initial.png` /
  `-a-and-c.png` / `-after-uncheck-a.png` — real Playwright clicks against
  the `InteractiveMultiSelect` story's three checkboxes, confirming the
  group's array `value` updates correctly across multiple items:
  `'' → 'a' → 'a,c'` via clicks on Option A then Option C, then
  `'a,c' → 'c'` via a keyboard `Space` press on Option A's (focused) input —
  read directly from a `data-testid="selected-value"` text node bound to
  the story's own local `value` array, not inferred from screenshots alone.
- `checkbox--static-variations.png`'s "Disabled Variant" row (unchecked +
  disabled) renders a real but very faint box at normal screenshot scale —
  initially looked like a rendering bug, confirmed **not** one via a
  zoomed-crop screenshot and a direct `getComputedStyle()` query
  (`opacity: 0.38`, `border-color: rgb(214,214,214)`,
  `background-color: rgb(233,233,233)` — identical values to the "Disabled
  Checked Variant" row's own box, just with no checkmark on top), and
  matches the same subtlety visible in the golden
  `ui-kit-checkbox--static-variations.png` reference at the same scale.

No golden-comparison automation exists in this adapter yet (same as every
other component here) — comparisons above are manual visual review of the
screenshots side by side with the reference PNGs, not pixel-diffed.
