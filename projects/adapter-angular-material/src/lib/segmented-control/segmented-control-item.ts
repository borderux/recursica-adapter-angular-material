import { TemplateRef } from "@angular/core";

/**
 * One entry in `SegmentedControlComponent`'s `data` input. Same shape
 * translation `RecursicaDropdownOption` (`dropdown-option.ts`) already
 * establishes: `icon` is a `TemplateRef` instead of a `ReactNode`.
 */
export interface RecursicaSegmentedControlItem {
  value: string;
  label?: string;
  icon?: TemplateRef<unknown>;
  disabled?: boolean;
}

/** `data` accepts either a plain string (label defaults to the string itself) or a full `RecursicaSegmentedControlItem`. */
export type RecursicaSegmentedControlData = ReadonlyArray<
  string | RecursicaSegmentedControlItem
>;

/**
 * Normalizes a `data` entry — a plain string becomes `{ value, label: value }`,
 * an object missing `label` gets it backfilled from `value`. Same reasoning
 * as `normalizeDropdownOption`.
 */
export function normalizeSegmentedControlItem(
  item: string | RecursicaSegmentedControlItem,
): RecursicaSegmentedControlItem {
  if (typeof item === "string") {
    return { value: item, label: item };
  }
  return { ...item, label: item.label ?? item.value };
}
