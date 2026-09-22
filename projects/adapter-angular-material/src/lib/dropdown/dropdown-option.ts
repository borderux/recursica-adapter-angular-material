import { TemplateRef } from "@angular/core";

/**
 * One entry in `DropdownComponent`'s `data` input. Mirrors the genesis
 * adapter's shared `RecursicaComboboxItem` (`@recursica/adapter-common`,
 * see `MANTINE_ADAPTER_RICH_OPTION_DATA.md`) — `label` is optional
 * (falls back to `value`, same runtime default Mantine's own
 * `getParsedComboboxData` applies), `leadingIcon` is a `TemplateRef`
 * instead of a `ReactNode` (same Angular translation `Menu`'s
 * `leftSection`/`Button`'s `icon` already use — see `menu-item.component.ts`'s
 * class doc comment), and `supportingText` is a plain string.
 */
export interface RecursicaDropdownOption {
  value: string;
  label?: string;
  leadingIcon?: TemplateRef<unknown>;
  supportingText?: string;
  disabled?: boolean;
}

/** `data` accepts either a plain string (label defaults to the string itself) or a full `RecursicaDropdownOption`. */
export type RecursicaDropdownData = ReadonlyArray<
  string | RecursicaDropdownOption
>;

/**
 * Normalizes a `data` entry into a full `RecursicaDropdownOption` — a plain
 * string becomes `{ value, label: value }`, and an object missing `label`
 * gets it backfilled from `value`. Same reasoning as `normalizeComboboxData`
 * in the genesis adapter's `Dropdown.tsx`: `label` is optional at the API
 * boundary but required everywhere this component actually renders option
 * text.
 */
export function normalizeDropdownOption(
  item: string | RecursicaDropdownOption,
): RecursicaDropdownOption {
  if (typeof item === "string") {
    return { value: item, label: item };
  }
  return { ...item, label: item.label ?? item.value };
}
