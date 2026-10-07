/**
 * The hover-card/popover beak size in px, read from its Recursica token. The CDK overlay offset is a
 * number, so it cannot reference the CSS variable directly; the reference likewise adds half the
 * arrow size to the offset when the arrow is shown, so the beak sits on the gap instead of in it.
 */
export function readBeakSize(): number {
  if (typeof document === "undefined") return 16;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(
      "--recursica_ui-kit_components_hover-card-popover_properties_beak-size",
    )
    .trim();
  const value = parseFloat(raw);
  return Number.isFinite(value) ? value : 16;
}
