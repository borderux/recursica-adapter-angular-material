# TextArea — Implementation Notes

**Status**: REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

## Two components, not one

`TextAreaComponent` (`rec-text-area`, the public API) composes
`rec-with-read-only-wrapper` **internally** — matching the genesis
reference's own `TextArea.tsx`, which renders `<WithReadOnlyWrapper
activeComponent={<MantineTextarea .../>} .../>` directly. This is a real,
deliberate difference from `TextField`/`Dropdown`, which expose themselves
under `RECURSICA_FORM_CONTROL` for the _caller_ to wrap in an externally
written `<rec-form-control-wrapper>` — confirmed by reading `TextField.tsx`
too: it _also_ renders `WithReadOnlyWrapper` internally in the real
reference, so the Angular adapter's `TextField`/`Dropdown` external-
composition pattern was itself already a deviation from the reference
(made before `WithReadOnlyWrapperComponent` existed in this adapter, not
wrong, just earlier). `TextArea` is simply the first component built after
`rec-with-read-only-wrapper` existed, so it follows the reference's actual
shape instead of repeating the approximation.

The real `<textarea>` lives in a second component, `TextAreaControlComponent`
(`rec-text-area-control`, internal-only — not re-exported from `index.ts`).
It has to be a separate component because `@ContentChild(RECURSICA_FORM_CONTROL)`
on `FormControlWrapperComponent` only matches a directive/component
_positioned inside_ the content projected into it — here, that's
`rec-with-read-only-wrapper`'s `activeTemplate`, rendered via
`ngTemplateOutlet`. `TextAreaComponent` itself is an _ancestor_ of that
content (it declares the `<ng-template #active>`), not a node within it, so
it cannot be the `RECURSICA_FORM_CONTROL` provider itself — the `<textarea>`
element (inside `TextAreaControlComponent`) is.

**Real consequence of the split**: `TextAreaControlComponent`'s `id` input
can't use a plain `@Input() id = this.baseId` field-initializer default the
way `TextFieldComponent` does — `TextAreaComponent` always binds `[id]="id"`
through to it, and an explicitly-bound `undefined` still overwrites a
field-initializer default (confirmed reasoning, not guessed: Angular always
runs a bound input's setter, even when the source expression evaluates to
`undefined`). Used a get/set accessor pair instead, falling back to `baseId`
at _read_ time rather than construction time.

## `matInput` + `cdkTextareaAutosize`: adopted, same reasoning as `TextField`

Checked the compiled source (`node_modules/@angular/cdk/fesm2022/text-field.mjs`)
before using it, same rigor as `TextField`'s own `matInput` investigation.
Both are bare directives — no `ViewEncapsulation.None` DOM to fight.

**Real bug avoided, not hit live (no visual verification available this
session — see "Verification" below)**: `cdkTextareaAutosize` carries static
host metadata (`rows="1"` attribute, a `cdk-textarea-autosize` class that
ships a global `resize: none` rule) applied the moment the directive is
_structurally present_ on an element, regardless of its `enabled` input.
Binding `[cdkTextareaAutosize]="autosize"` on a single always-present
element would therefore force every non-autosize `TextArea` to lose its
native resize handle — a real deviation from the reference (`TextArea.module.css`
never sets `resize`, so non-autosize textareas keep the browser default).
Fixed by templating the directive onto the `<textarea>` only in the
`autosize` branch (`@if (autosize) {...} @else {...}`, duplicating the
element) — the same "can't conditionally nest markup two different ways
without duplicating it" constraint `CheckboxComponent`'s own `#checkboxTpl`
doc already documents for itself.

## Layout width tokens: implemented, unlike `TextField`/`Dropdown`

`--recursica_ui-kit_components_textarea_variants_layouts_{stacked,side-by-side}_properties_{max,min}-width`
are wired to `rec-with-read-only-wrapper`'s `controlMaxWidth`/`controlMinWidth`
inputs via two getters keyed off `formLayout`. **Confirmed this is a real,
already-shipped gap in `TextField`/`Dropdown`** (checked: neither
`text-field.stories.ts` nor any caller sets `controlMaxWidth`/`controlMinWidth`,
so `FormControlLayoutComponent`'s own `100%`/`auto` CSS fallback always
applies there instead) — not touched, retrofitting is out of scope here.
Implementing it for `TextArea` cost two getters and was needed to build this
component against the reference correctly, so it wasn't skipped just to
match the existing gap.

**Not implemented, real gap, not a Recursica CSS variable this adapter can
set**: the reference's `--form-control-margin-bottom` per-component layout
hook (`recursica_ui-kit_components_textarea_variants_layouts_*_properties_top-bottom-margin`).
`FormControlLayoutComponent`'s own CSS has no consumption point for a
per-component margin override at all — it hardcodes the global
`--recursica_ui-kit_globals_form_properties_vertical-item-gap` token.
Implementing it would mean editing shared `form-control-layout` CSS every
other component in this adapter also depends on — real scope creep beyond
one new component, so left as the same gap every component here already
has.

## No leading/trailing icon sections

The genesis reference's own `TextArea.tsx` interface has no
`leftSection`/`rightSection` (unlike `TextField`) — confirmed by reading it,
not assumed. `text-area.component.css` has no `.section` rules as a result.

## Verification

**Real signal, this session**: fresh `ng build` clean, `tsc --noEmit` clean,
`eslint` clean, and all 5 golden-matching stories (Default, Autosize,
StaticError, StaticDisabled, StaticReadOnly) confirmed registered and
compiling with zero webpack errors in a live Storybook dev server (port
6007, isolated from the developer's own 6006 instance throughout).

**Not done, flagged honestly**: no browser/Playwright tooling was available
in this session (checked: not in `package.json`, no MCP browser tool
loaded) to do the click-and-inspect interaction verification (real keyboard
input, `label[for]`/`aria-describedby` DOM inspection, visual diff against
the golden screenshots) that `Tabs`/`Dropdown`/`TextField`/etc. all got
before being marked done. The `cdkTextareaAutosize` conditional-branch fix
above and the `id`-accessor fallback are both reasoned from the compiled
source and Angular's documented input-binding behavior, not confirmed by
running them. Flagged in the channel; not silently lowering the bar those
earlier components were held to.
