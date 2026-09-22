import { InjectionToken } from "@angular/core";

/**
 * DI-based replacement for the genesis adapter's implicit React context
 * (Mantine's `<Radio.Group>` establishes a native-radio-semantics context
 * consumed by every nested `Radio` — see `RadioGroup.tsx`, which wraps the
 * real `MantineRadio.Group`). Angular has no context API —
 * `RadioGroupComponent` provides a small object (via `useFactory`, not
 * `useExisting` — see `radio-group.component.ts`'s own doc comment) under
 * this token, the same DI-context translation `CHECKBOX_GROUP_CONTEXT`
 * already established for `Checkbox`/`CheckboxGroup`. `RadioComponent`
 * injects it `@Optional()` — never required, so a bare `<rec-radio>` used
 * outside any group still works standalone.
 *
 * Unlike `CheckboxGroupContext` (array-valued, `toggle()`), this is
 * single-value, exclusive-selection — closer to a native
 * `<input type="radio" name="...">` group's own semantics:
 * `value: string | undefined` (at most one selected item), and `select()`
 * rather than `toggle()` (a radio can only ever be turned *on* by user
 * interaction, never off by re-clicking the same one — matches native
 * radio-input behavior).
 *
 * `name` is threaded through the context too — every projected `<rec-radio>`
 * in the same group must share one native `name` attribute for the browser's
 * *own* native radio-group semantics (exclusive selection AND arrow-key
 * navigation between siblings) to work with zero custom keydown handling.
 * This is the reason `RadioGroup`/`Radio` don't need a hand-rolled
 * roving-tabindex/arrow-key implementation the way a non-native-input-based
 * widget would — native `<input type="radio">` already does it, as long as
 * every sibling shares one `name`.
 */
export interface RadioGroupContext {
  /** The group's current selected value, or `undefined` when nothing is selected. */
  readonly value: string | undefined;
  /** Group-level lock — `disabled` OR `readOnly` on `<rec-radio-group>` (mirrors `RadioGroup.tsx`'s own `disabled={readOnly || disabled}`). */
  readonly disabled: boolean;
  /** Group-level `readOnly` — a child `Radio` uses this to switch to its own read-only approximation. */
  readonly readOnly: boolean;
  /** Shared native `name` every member `<input type="radio">` must render, so the browser's own exclusive-selection + arrow-key navigation applies across the group. */
  readonly name: string;
  /** Selects `itemValue` as the group's new value and emits it. */
  select(itemValue: string): void;
}

export const RADIO_GROUP_CONTEXT = new InjectionToken<RadioGroupContext>(
  "RecursicaRadioGroupContext",
);
