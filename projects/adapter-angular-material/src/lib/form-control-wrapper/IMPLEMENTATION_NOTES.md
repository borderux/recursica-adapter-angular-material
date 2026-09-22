# FormControlWrapper — Implementation Notes

**Status**: real implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

Composes `Label` + `FormControlLayout` + `AssistiveElement`, matching the
genesis adapter's real `FormControlWrapper.tsx`. Also declares the shared
`--form-field-*` CSS custom-property bridge from `FormControlWrapper.module.css`
so future real field components (`TextField`, `Checkbox`, etc.) can consume
it directly.

## The id/ARIA-wiring mechanism is fundamentally different from React

The React reference uses `React.cloneElement()` to inject `id`/
`aria-labelledby`/`aria-describedby`/`aria-errormessage` onto whatever
single child is passed in. Angular has no equivalent — a parent cannot
mutate attributes onto opaque `<ng-content>`-projected content.

Replacement: `RECURSICA_FORM_CONTROL` (`utils/recursica-form-control.ts`),
modeled on `MatFormField`'s own real `ContentChild(MatFormFieldControl)`
mechanism (confirmed via its real declaration) but deliberately lighter —
just `id` + `setDescribedByIds()`, not the full interface Material built for
`<mat-form-field>`'s own visual chrome. `FormControlWrapper` queries for a
projected control providing this token via `@ContentChild` and calls
`setDescribedByIds()` on it directly.

**Real, documented difference from React**: the control's `id` is the
control's own concern (mirroring `MatFormFieldControl.id`/`MatInput`'s own
`_uniqueId` fallback) — `FormControlWrapper` reads it, it doesn't generate
and inject one the way `useId()` does in React. A control that doesn't
implement `RECURSICA_FORM_CONTROL` renders without the `for`/
`aria-describedby` connection — a real Angular constraint every future
form-shaped component (`Checkbox`, `Radio`, `Switch`, `TextField`,
`TextArea`, `Dropdown`, `AutoComplete`, `NumberInput`, `DatePicker`,
`TimePicker`) needs to implement this contract to get.

Verified live in Storybook against a demo directive (`DemoFormControlDirective`
in `form-control-wrapper.stories.ts` — a stand-in for a real future field
component, since none exist yet) that provides itself under
`RECURSICA_FORM_CONTROL` and applies whatever `aria-describedby` ids get
computed onto a plain `<input>`.

`label`/`assistiveText`/`description`/`helperText`/`error` accept
`string | TemplateRef<unknown>` — a plain string for the common case, a
`TemplateRef` for rich content (richer ergonomics than forcing every text
prop through `TemplateRef` the way `Button`'s `icon`/`Label`'s
`labelActionArea` do, since those genuinely can't be plain strings).
