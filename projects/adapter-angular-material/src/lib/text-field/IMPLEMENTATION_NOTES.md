# TextField — Implementation Notes

**Status**: real implementation (`docs/CREATING_AN_ADAPTER.md` step 10) — the
first real (non-demo-directive) consumer of `RECURSICA_FORM_CONTROL`/
`FormControlWrapper`'s own contract, built weeks earlier
(`form-control-wrapper/IMPLEMENTATION_NOTES.md`) against only a demo
stand-in directive. See "FormControlWrapper composition — verified live"
below for the full verification this component exists specifically to
exercise.

## `matInput` investigation — adopted, unlike `MatSelect`/`MatTabGroup`

Re-investigated against the real compiled source
(`node_modules/@angular/material/fesm2022/input.mjs`, `@angular/material@20.2.14`)
before writing any code — same rigor `Dropdown`'s `MatSelect` rejection
applied to its own candidate. The step-9 stub guessed `matInput` +
`MatFormField` as an EASY–REQUIRES WORK match; re-verified for real, the
conclusion is a partial adoption, not the flat rejection `MatSelect`/
`MatTabGroup` got:

- **It's a bare directive** (`selector: "input[matInput], textarea[matInput],
select[matNativeControl], input[matNativeControl], textarea[matNativeControl]"`),
  not a component with its own `ViewEncapsulation.None` template — the exact
  structural blocker that sank `Dropdown`'s `MatSelect` investigation
  doesn't apply here at all. `matInput` attaches directly to
  `TextFieldComponent`'s own `<input>` element; the element stays 100% owned
  by this component's own scoped CSS.
- **`MAT_FORM_FIELD = inject(MAT_FORM_FIELD, { optional: true })`** —
  confirmed directly in the compiled constructor (`input.mjs` line ~238).
  No `<mat-form-field>` ancestor required. `_isInFormField` just becomes
  `false`, which only gates a few `mat-mdc-form-field-*`/
  `mdc-text-field__input` CSS classes this adapter never uses (Recursica's
  own `.input` class carries all real styling regardless). This is the exact
  claim `form-control-wrapper/IMPLEMENTATION_NOTES.md` says was "already
  confirmed during the original FormControlWrapper investigation" — now
  independently re-confirmed against the real source for this task, not
  just trusted.
- **`NgControl` is also `{ optional: true, self: true }`** — `matInput`
  works with plain property binding, no `[formControl]`/`ngModel` required,
  matching this component's own `value`/`(valueChange)` contract (same
  "Recursica owns its own value model" reasoning `Dropdown` already applied
  to skip `MatSelect`'s `ControlValueAccessor`-oriented model).
- **Real, working behavior genuinely adopted**: `type`'s setter writes
  `element.type` directly and throws `getMatInputUnsupportedTypeError` for
  `MAT_INPUT_INVALID_TYPES` (`button`/`checkbox`/`file`/`hidden`/`image`/
  `radio`/`range`/`reset`/`submit`) — a real guard rail; `placeholder` is
  dirty-checked every `ngDoCheck` and reflected via `setAttribute`/
  `removeAttribute` rather than a single static binding; `readonly`
  reflects via `_getReadonlyAttribute()`; real `AutofillMonitor` integration
  (`_autofillMonitor.monitor()` in `ngAfterViewInit`); an iOS-only
  caret-jiggle-on-delete workaround installed automatically. None of this
  is decorative — a plain `<input>` would not get any of it for free.
- **`errorState`/`aria-invalid` deliberately left alone**: `matInput`
  computes `aria-invalid` from `_errorStateTracker`, driven by `NgControl`/
  `parentForm`/`parentFormGroup` — none of which this component uses, so
  `matInput` never writes `aria-invalid` here (confirmed: `errorState` isn't
  even in `matInput`'s own `inputs` list, it's a plain get/set property with
  no template-bindable path). `TextField`'s own `error` input (boolean,
  visual-only, mirrors `Dropdown`'s identical `error` input) does not
  attempt to also drive `aria-invalid` on the same element — the real,
  load-bearing a11y path for the error is `aria-describedby` pointing at the
  error message, via `RECURSICA_FORM_CONTROL`/`FormControlWrapper` (verified
  live below), matching `Dropdown`'s identical choice not to set
  `aria-invalid` either.

**Decision**: use `matInput` on the real `<input>` for genuine value
(autofill/iOS/type-validation/placeholder robustness) while every visual
concern (border/background/padding/typography/state colors) stays this
component's own scoped `.input` CSS. `matInput` contributes zero DOM/CSS of
its own — no template, and (per the optional `MAT_FORM_FIELD` injection
above) no `<mat-form-field>` wraps it to contribute any either.

## `RECURSICA_FORM_CONTROL`: composed like `Dropdown`, not internally

Same reasoning as `Dropdown` (see its own IMPLEMENTATION_NOTES.md):
`TextFieldComponent` does not render `FormControlWrapperComponent`
internally — unlike the genesis adapter's `TextField.tsx`, which composes
`FormControlWrapper` internally via `WithReadOnlyWrapper` (only possible
because React's `cloneElement()` can graft `id`/`aria-*` onto an opaque
child). `TextFieldComponent` provides itself under `RECURSICA_FORM_CONTROL`
and is meant to be composed by the caller:

```html
<rec-form-control-wrapper label="..." assistiveText="...">
  <rec-text-field placeholder="..."></rec-text-field>
</rec-form-control-wrapper>
```

Every story in `text-field.stories.ts` does exactly this.

### FormControlWrapper composition — verified live (first real consumer of the contract)

`form-control-wrapper/IMPLEMENTATION_NOTES.md` was written weeks before any
real field component existed, verified only against a demo stand-in
directive (`DemoFormControlDirective` in `form-control-wrapper.stories.ts`).
This is the first time a real Recursica component exercises that contract,
so the verification here was deliberately thorough — a real running
Storybook (port 6007) driven by Playwright, reading actual DOM attributes,
not just "it compiles":

1. **`label[for]` / control `id` resolve to each other.** `FormControlWrapperComponent.ngAfterContentChecked()`
   reads `this.control?.id` (the `ContentChild(RECURSICA_FORM_CONTROL)`
   query picking up `TextFieldComponent`) and feeds it to `<rec-label
[htmlFor]="controlId">`. Confirmed live on the `Default` story:
   `label.root`'s `for` attribute and `input.input`'s `id` attribute were
   both read directly from the rendered DOM and are identical
   (`"rec-text-field-0"` in the run that produced the screenshots below —
   the exact generated id, not a guess).
2. **`aria-describedby` resolves to the assistive-text element, with the
   right text, when no error is set.** `Default`'s story sets
   `assistiveText="Tokens are stored identically locally and strictly
ephemeral."` and no `error`. Live DOM check: `input.input`'s
   `aria-describedby` attribute equals `FormControlWrapperComponent`'s
   generated `assistiveId` (`"recursica-fc-0-assistive"` in the same run),
   `document.getElementById()` on that id resolves to a real element (not a
   dead reference), and that element's `textContent` is exactly the
   assistive text string set on the wrapper. This is the same `id`+
   `setDescribedByIds()` mechanism the demo directive proved abstractly —
   now proven against a component with real internal state (`value`
   signal, `matInput`, its own `id` generation) instead of a two-line demo
   directive.
3. **`error` takes priority over `assistiveText` for `aria-describedby`,
   live, not just by reading the `ngAfterContentChecked()` source.** The
   `ErrorState` story sets both `error` (on the wrapper) and no
   `assistiveText`; separately confirmed against `FormControlWrapperComponent`'s
   own priority logic (`this.error ? [this.errorId] : ...`) by reading the
   live `aria-describedby` value on that story: it equals the wrapper's
   `errorId` (`"recursica-fc-0-error"`), and the element at that id's
   `textContent` is the exact error message string
   (`"Critical runtime node disconnect detected traversing DOM
architecture."`). `label[for]` still correctly matches the input's `id`
   in this story too — the error-message swap doesn't disturb the
   label/control association.
4. **Real typing, focus, and blur all work through the composed control.**
   Playwright `fill("hello world")` on the `Default` story's real `<input>`
   round-tripped through `onInput()` → `_uncontrolledValue.set()` →
   `[value]="currentValue"` and back out to the DOM (`input.inputValue()`
   read back `"hello world"`) — the uncontrolled-value path genuinely
   works, not just compiles. Focusing the input produces a real
   `box-shadow` (the focus-ring tokens, confirmed via `getComputedStyle()`
   — a non-`"none"` two-shadow value); clicking elsewhere removes it
   (`getComputedStyle()` back to `"none"`).
5. **Native `readonly` genuinely blocks editing.** On the `StaticReadOnly`
   story, `input.readOnly` (the real DOM property, not just the attribute)
   is `true`; a Playwright `click()` + `keyboard.type("SHOULD NOT APPEAR")`
   against the real focused input left `inputValue()` unchanged
   (`"Explicitly Uneditable Bound Output"`, verbatim) — confirms `matInput`'s
   `readonly`-reflection genuinely reaches the native element and the
   browser genuinely honors it, not just that the attribute is present in
   the markup.

**Conclusion**: the `RECURSICA_FORM_CONTROL`/`ContentChild` mechanism
designed weeks ago against a demo stand-in holds up unchanged against a
real, stateful field component — no changes were needed to
`form-control-wrapper.component.ts` or `utils/recursica-form-control.ts` to
make this work. The one real, load-bearing requirement `TextFieldComponent`
had to satisfy that the demo directive's own comment already flagged:
`@Input() id` alone doesn't reflect onto the DOM automatically — but
`TextFieldComponent` never had this problem in the first place, because
(unlike the demo directive, which decorates a _caller-owned_ `<input>` it
doesn't control the template of) `TextFieldComponent` renders its own
`<input [id]="id">` binding directly in its own template — a real property
binding, not a directive `@Input()` hoping something else reflects it.

### One real, documented composition gap found: `required`/asterisk is split across two components

The genesis adapter's `TextField.tsx` accepts a single `required`/
`withAsterisk` prop that flows into `FormControlWrapper` (label asterisk)
_and_ the native `<input required>` attribute simultaneously, via one flat
prop surface. Angular's composed-not-flattened shape (no
`cloneElement()`-style prop injection) means these are now two separate
inputs on two separate components: `<rec-form-control-wrapper
[required]="true">` (drives the label's `*`) and `<rec-text-field
[required]="true">` (drives the native input's own `required`/
`aria-required`, via `matInput`). **Found live, not by reading the source
first**: the initial `ErrorState` story set `[required]="true"` only on
`<rec-text-field>` and the rendered screenshot was missing the golden's `*`
next to "Cluster Failure" entirely — the native input's `required` attribute
has no visual effect on its own; the asterisk is purely `FormControlWrapper`
's/`Label`'s concern. Fixed by setting `[required]="true"` on **both**
components in that story. This is the same category of "two components now
carry what was one flattened prop" finding `Dropdown`'s own notes document
for its `error` boolean vs. `FormControlWrapper`'s `error` message — future
consumers need to set `required` on both `FormControlWrapper` (visual
asterisk) and the field component (native validity/`aria-required`) to get
both effects, there is no single prop that drives both.

## Known gap: `readOnly` approximates, does not implement, `ReadOnlyField`

The genesis adapter's `TextField.tsx` composes `ReadOnlyField`'s
`WithReadOnlyWrapper` for `readOnly` — confirmed by reading
`WithReadOnlyWrapper.tsx` and `ReadOnlyField.tsx`/`ReadOnlyTextField.tsx`
directly, not assumed: when `readOnly` is `true` and no `readOnlyComponent`
override is supplied, `WithReadOnlyWrapper` renders `ReadOnlyField`, which
renders a plain `<p>` (`ReadOnlyTextField`, via `Box component="p"`) inside
`FormControlWrapper` — no border, no background, no input chrome at all,
just token-styled text.

**Correction to this task's initial assumption**: the brief guessed
`editable-read-only` might be "just `readOnly` on a real `<input>`" while
only `static-read-only` needed `ReadOnlyField`. Reading `TextField.stories.tsx`
and `WithReadOnlyWrapper.tsx` together shows this isn't the case — **both**
`StaticReadOnly` and `EditableReadOnly` stories set `readOnly: true` and
neither passes a `readOnlyComponent`, so **both** hit the identical
`ReadOnlyField` plain-text rendering path in the real reference. The only
difference between the two stories is `labelWithEditIcon: true` on
`EditableReadOnly` — a `Label`-level affordance (a pencil icon next to the
label) that would let a consuming _app_ toggle the field out of read-only
mode, not a different rendering path for the field itself. Confirmed
further by the token schema itself: `recursica_variables_scoped.css` has no
`--recursica_..._text-field_variants_states_readonly_*` tokens at all
(only `disabled`/`error` state tokens exist) — read-only has no defined
visual treatment of its own in the design system; it is entirely
`ReadOnlyField`'s concern, for both variants.

`ReadOnlyField` is not built in this adapter yet (still `🚧` in `llms.txt`
at the time of writing) and building it was explicitly out of scope for
this task.

**Approximation shipped instead**: `TextFieldComponent`'s `readOnly` input
applies the real native HTML `readonly` attribute to the actual `<input>`,
via `matInput`'s own `readonly` binding (see the `matInput` section above —
`_getReadonlyAttribute()` genuinely reflects it, verified live: `input.readOnly`
is `true` and a real Playwright typing attempt is genuinely blocked, not
just visually implied). This is honest, functional, real browser behavior
— but it is **not** `ReadOnlyField` parity: the rendered result keeps the
full bordered `.input` box-chrome (border/background/padding), which will
not pixel-match either golden screenshot's chrome-free plain-text
rendering. `StaticReadOnly`/`EditableReadOnly` stories both use this same
native-`readonly` approximation; they're differentiated the same way the
reference differentiates them — `EditableReadOnly`'s story additionally
sets `[labelWithEditIcon]="true"` on `FormControlWrapper` (a real,
already-implemented `Label` feature, not a stub), giving each story a
distinct, real visual signal even though the input itself renders
identically.

**Follow-up**: once `ReadOnlyField`/`WithReadOnlyWrapper` exist in this
adapter, `TextField` should be revisited to compose them for `readOnly`,
replacing this approximation, the same follow-up `Dropdown`'s own notes
already flag for itself. Cross-reference:
`read-only-field/IMPLEMENTATION_NOTES.md` (once that component is real)
should link back here.

## `leftSection`/`rightSection`, icon sizing

`leftSection`/`rightSection`: `TemplateRef<unknown>`, not `ReactNode` — same
Angular translation `Dropdown`'s `leftSection`/`Menu`'s `leftSection`/
`Button`'s `icon` already use, rendered via `*ngTemplateOutlet`.

The absolutely-positioned icon-box sizing bug `dropdown.component.css`
found and fixed live (sizing the `.section` wrapper to exactly `icon-size`,
not the padding+icon+gap compound value used for the input's own
`padding-left`/`padding-right` reservation) was applied directly here from
the start, for **both** `.section[data-position="left"]` and
`[data-position="right"]` (the genesis reference's own Mantine `Input`
doesn't need this fix on either side — Mantine's internal
`--input-{left,right}-section-size` layout variables handle real section
sizing natively; this adapter has no equivalent internal layout system, so
it reuses `Dropdown`'s already-proven fix for both sides rather than
re-discovering the same bug independently on the right side too).
Confirmed correct on first attempt via the `WithLeadingIcon`/
`WithTrailingIcon` screenshots below (visually compared against golden,
icons render at token `icon-size`, centered, not oversized/misaligned) —
no separate "before" broken screenshot exists for this component, unlike
`Dropdown`'s own bug-discovery writeup, because the fix was known in
advance from that prior work.

## Verification

Built (`npm run build`) and type-checked (`npm run check-types`) clean.

Verified against a real running Storybook on port 6007 (`npm run storybook
-- --port 6007` — **never** port 6006, confirmed via `lsof -i :6006`
before and after, same PID throughout, Matt's own instance stayed
undisturbed) via Playwright (chromium), screenshotted to `.scratch/`:

- `.scratch/text-field--default.png`, `-forms-side-by-side.png`,
  `-with-leading-icon.png`, `-with-trailing-icon.png`, `-disabled.png`,
  `-error-state.png` — visually cross-checked against
  `recursica-adapter-mantine-v8/test/golden/ui-kit-textfield--*.png`: close
  visual match on border/radius/spacing/typography/icon sizing/error and
  disabled state colors/focus ring in all six.
- `.scratch/text-field--static-read-only.png`,
  `-editable-read-only.png` — cross-checked against their goldens too;
  confirms the documented gap above exactly as predicted (this adapter
  renders a bordered `.input` box with the value/edit-icon in the right
  place, the golden renders chrome-free plain text) rather than a surprise.
- `.scratch/text-field-interaction-typed.png`,
  `-interaction-focus.png` — real Playwright `fill()`/`focus()` against the
  `Default` story's live input, confirming typed text renders and the focus
  ring (box-shadow) appears.

Real Playwright-driven DOM checks (not just screenshots, see "FormControlWrapper
composition — verified live" above for the full detail): `label[for]` ===
input `id`; `aria-describedby` resolves to a real element whose text matches
the assistive text (no error set) or the error message (error set,
confirming priority); typed value round-trips through the uncontrolled-value
signal back into the DOM; focus/blur toggle the focus-ring box-shadow;
native `readonly` (via `matInput`) genuinely blocks a real typing attempt.

No golden-comparison automation exists in this adapter yet (same as every
other component here) — comparisons above are manual visual review of the
screenshots side by side with the reference PNGs, not pixel-diffed.
