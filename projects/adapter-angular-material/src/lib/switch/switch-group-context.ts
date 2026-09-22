import { InjectionToken } from "@angular/core";

/**
 * DI-based replacement for the genesis adapter's implicit React context
 * (Mantine's `<Switch.Group>` establishes a `SwitchGroupProvider`, consumed
 * by every nested `Switch` via `useSwitchGroupContext()` — the same
 * array-membership shape `CheckboxGroup.tsx`'s own `CheckboxGroupProvider`
 * establishes, confirmed directly against `SwitchGroup.tsx`: its
 * `value`/`onChange` are `string[]`/`(value: string[]) => void`, exactly
 * `Checkbox.Group`'s shape, not `Radio.Group`'s single-value exclusive
 * selection). `SwitchGroupComponent` provides itself under this token
 * (`useExisting`), the same pattern `CHECKBOX_GROUP_CONTEXT`
 * (`checkbox/checkbox-group-context.ts`) already established.
 * `SwitchComponent` injects it `@Optional()` — never required, so a bare
 * `<rec-switch>` used outside any group still works standalone.
 *
 * Only established when the group is array-controlled (`value`/
 * `defaultValue` bound on `<rec-switch-group>`) — mirrors
 * `CheckboxGroupComponent`'s own `isArrayControlled`-equivalent gate (see
 * `SwitchComponent.isGroupMember`).
 */
export interface SwitchGroupContext {
  /** The group's current array of checked values. */
  readonly value: readonly string[];
  /** Group-level lock — `disabled` OR `readOnly` on `<rec-switch-group>` (mirrors `SwitchGroup.tsx`'s own `disabled={readOnly || disabled}`). */
  readonly disabled: boolean;
  /** Group-level `readOnly` — a child `Switch` uses this to switch to its own read-only approximation. */
  readonly readOnly: boolean;
  /** Toggles `itemValue` in/out of the group's array and emits the updated array. */
  toggle(itemValue: string): void;
}

export const SWITCH_GROUP_CONTEXT = new InjectionToken<SwitchGroupContext>(
  "RecursicaSwitchGroupContext",
);
