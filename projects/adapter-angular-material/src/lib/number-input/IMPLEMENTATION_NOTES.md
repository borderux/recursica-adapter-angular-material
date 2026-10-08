# NumberInput — Implementation Notes

**Status**: REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10).

## Genuinely does not exist — re-confirmed, not carried over from the stub

The pre-implementation stub already flagged `Category: DOES NOT EXIST` in
the integration report. Re-checked directly against `@angular/material`'s
real exports before building: no `MatNumberInput`, no CDK stepper-input
primitive. Hand-built on `matInput` + a native `<input type="number">` —
confirmed `"number"` is not in `matInput`'s own `MAT_INPUT_INVALID_TYPES`
rejection list in the compiled source, same adoption reasoning as
`TextField`/`TextArea`.

## Two components, same split as `TextArea`

`NumberInputComponent` (`rec-number-input`, public) composes
`rec-with-read-only-wrapper` internally, matching the genesis reference's
own `NumberInput.tsx`. The real `<input>` lives in
`NumberInputControlComponent` (`rec-number-input-control`, internal-only)
for the identical `RECURSICA_FORM_CONTROL`-positioning reason
`text-area-control.component.ts` documents — not repeated here.

## Increment/decrement: native `stepUp()`/`stepDown()`

The custom `.controls` up/down buttons call
`HTMLInputElement.stepUp()`/`stepDown()` directly rather than
hand-rolling clamped increment math — the browser's own spec-defined
`min`/`max`/`step` clamping is authoritative, and it's the exact mechanism
`type="number"`'s native arrow-key spinning already uses, so the two paths
can never disagree. Native spin-button UI is hidden via
`number-input.component.css` (`appearance: textfield` +
`::-webkit-outer/inner-spin-button` suppression); the custom `.controls`
replace it, same visual position, matching the reference's own
`NUMBER_INPUT_IMPLEMENTATION_NOTES.md` §2/§3.

**`rightSection` overrides the controls** — matches the reference exactly
(§2): `NumberInputControlComponent`'s template only renders `.controls` in
the `@else` branch when no `rightSection` is supplied.

## Value clamping: on blur, not every keystroke

Matches the reference's own behavior — clamping mid-keystroke would fight
normal typing (typing `50` passes through `5`, which could sit below `min`
even though `50` is valid). See `number-input-control.component.ts`'s own
doc comment for the full reasoning.

**Known, documented gap**: `value` round-trips through a real `number`
(not a string), so a trailing decimal point or trailing zero typed
mid-edit (`"10."`, `"10.50"`) gets silently normalized away on the next
re-render — an inherent consequence of the `number`-typed value contract,
not something a golden story exercises or that was hit live. Flagged, not
fixed speculatively.

## No thousands-separator / `decimalScale` formatting

Mantine's real `NumberInput` supports both; **none of the 6 golden stories
exercise either** (checked `NumberInput.stories.tsx` directly — only
`min`/`max`/`defaultValue`/`leftSection`/`rightSection`/`hideControls` are
used). Building either would be speculative scope beyond what any golden
screenshot needs. Not implemented, not silently assumed present.

## Verification

**Real signal, this session**: fresh `ng build`, `tsc --noEmit`, and
`eslint` all clean. All 6 golden-matching stories (Default,
SideBySideLayout, States, WithLeftIcon, WithRightIcon, HiddenControls)
confirmed registered and compiling with zero webpack errors in a live
Storybook dev server (port 6007, isolated from the developer's own 6006
instance — confirmed untouched throughout, same PID as before/after).

**Not done, same flag as `TextArea`**: no browser/Playwright tooling
available this session, so `stepUp()`/`stepDown()` actually clamping
correctly, the native spin-button suppression actually hiding the browser
arrows, and the blur-clamp behavior are all reasoned from documented
browser/Angular behavior, not click-verified.

**Real environment finding worth recording**: a Storybook dev server
started via `nohup ... &` inside one shell-tool invocation does not
survive into a _separate_ subsequent invocation in this sandbox (confirmed
twice — the process was alive at the end of the call that started it, then
gone, with no crash logged, by the next call). All Storybook verification
in this session had to start the server and check it within a single
continuous shell call.

## Passthrough

Forwarded through the shared `RecursicaAriaLabelling` host directive (`utils/recursica-aria.ts`); the host's own aria attributes and `id` are cleared so nothing is duplicated on the `rec-*` element.

| Input                                                            | Forwarded to                                   | Notes                                                                                 |
| ---------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| `ariaLabel` / `aria-label`, `ariaLabelledby` / `aria-labelledby` | inner `<input type=number>`                    | Host directive on the public component and passed to the inner `*-control` component. |
| `ariaDescribedby` / `aria-describedby`                           | inner `<input type=number>` `aria-describedby` | Merged with the form-control wrapper's ids (caller's first), never replaced.          |
| `id`                                                             | inner `<input type=number>`                    | Existing input kept; host `id` attribute nulled so the id is not duplicated.          |
| `inputTabIndex`                                                  | inner `<input type=number>` `tabindex`         | Named after Button's `buttonTabIndex`.                                                |
| `form`                                                           | inner `<input type=number>` `form`             | Host `form` attribute nulled.                                                         |
| `autocomplete`                                                   | inner `<input>` `autocomplete`                 |                                                                                       |
| `inputMode`                                                      | inner `<input>` `inputmode`                    |                                                                                       |

Withheld:

- `name`, `required`, `placeholder` already existed; unchanged.
- Material `appearance`, `color`, `floatLabel`, `subscriptSizing`, `hideRequiredMarker`, `errorStateMatcher`: tokens own styling.
- `minlength`, `maxlength`, `spellcheck`: not valid on `type=number`.
- Hard-coded `Increment`/`Decrement` button labels are unchanged (out of scope).

## Round 2: translatable button labels

`incrementLabel` / `decrementLabel` (defaults "Increment" / "Decrement") set the `aria-label` of the stepper buttons. Added on `rec-number-input` and passed to `rec-number-input-control`. Story: `CustomLabels`.
