/**
 * Angular translation of the genesis adapter's own `SPACING_MAP`/`mapLayoutProps`
 * (`filterStylingProps.ts`) — every layout primitive's `gap`/`rowGap`/`columnGap`
 * (and `Grid`'s `columnGutter`/`rowGutter`/`margin`) accepts either one of
 * these `rec-*` design-token names or a raw CSS length value (e.g. `"16px"`),
 * passed straight through unresolved. Confirmed identical mapping table and
 * behavior (string starting with `rec-` → the matching CSS `var()`,
 * anything else returned as-is) — not reinvented.
 */
const SPACING_MAP: Record<string, string> = {
  "rec-none": "var(--recursica_brand_dimensions_general_none)",
  "rec-sm": "var(--recursica_brand_dimensions_general_sm)",
  "rec-default": "var(--recursica_brand_dimensions_general_default)",
  "rec-md": "var(--recursica_brand_dimensions_general_md)",
  "rec-lg": "var(--recursica_brand_dimensions_general_lg)",
  "rec-xl": "var(--recursica_brand_dimensions_general_xl)",
  "rec-2xl": "var(--recursica_brand_dimensions_general_2xl)",
};

export function resolveSpacing(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return SPACING_MAP[value] ?? value;
}
