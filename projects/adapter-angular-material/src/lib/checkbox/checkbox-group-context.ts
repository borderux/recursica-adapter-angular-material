import { InjectionToken } from "@angular/core";

/**
 * DI-based replacement for the genesis adapter's implicit React context
 * (Mantine's `<Checkbox.Group>` establishes a `CheckboxGroupProvider`,
 * consumed by every nested `Checkbox` via `useCheckboxGroupContext()` — see
 * `CheckboxGroup.tsx`'s own comment on `MantineCheckbox.Group` forcing each
 * child's `checked` from context). Angular has no context API —
 * `CheckboxGroupComponent` provides itself under this token (`useExisting`),
 * the same pattern `TABS_CONTEXT` (`tabs/tabs-context.ts`) already
 * established for `Tabs`/`Tab`/`TabPanel`. `CheckboxComponent` injects it
 * `@Optional()` — never required, so a bare `<rec-checkbox>` used outside
 * any group still works standalone.
 *
 * Only established when the group is array-controlled (`value`/
 * `defaultValue` bound on `<rec-checkbox-group>`) — mirrors
 * `CheckboxGroup.tsx`'s own `isArrayControlled` branch, which skips
 * Mantine's real `Checkbox.Group` primitive entirely (and therefore never
 * forces child `checked`) when neither is supplied, for callers who only
 * want the group's layout/gap styling (e.g. `TransferList`'s ungrouped
 * rows), not array-tracked selection.
 */
export interface CheckboxGroupContext {
  /** The group's current array of checked values. */
  readonly value: readonly string[];
  /** Group-level lock — `disabled` OR `readOnly` on `<rec-checkbox-group>` (mirrors `CheckboxGroup.tsx`'s own `disabled={readOnly || disabled}`). */
  readonly disabled: boolean;
  /** Group-level `readOnly` — a child `Checkbox` uses this to switch to its own read-only approximation. */
  readonly readOnly: boolean;
  /** Toggles `itemValue` in/out of the group's array and emits the updated array. */
  toggle(itemValue: string): void;
}

export const CHECKBOX_GROUP_CONTEXT = new InjectionToken<CheckboxGroupContext>(
  "RecursicaCheckboxGroupContext",
);
