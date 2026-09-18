/**
 * The Angular equivalent of `@recursica/adapter-common`'s `RecursicaOverStyled<T>` /
 * `overStyled` + `className`/`style` pattern (see `ADAPTER_INTEGRATION_REPORT.md`
 * Crosscutting Finding A for why the real package can't be a dependency here, and
 * `docs/STYLING_SYSTEM.md` §6 for the full design rationale this resolves).
 *
 * Every prior (React) adapter's generic styling escape hatch is a plain prop object:
 * `className`/`style` arrive as ordinary props, stripped at runtime by
 * `filterStylingProps()` unless `overStyled: true` unlocks them. Angular has no
 * equivalent runtime step to hook, because `[class]`/`[ngClass]`/`[style]`/`[ngStyle]`
 * written directly on `<rec-button>` in a caller's template bind to *this component's
 * host element*, not to anything our own code receives or can inspect — and even if
 * they did, they wouldn't automatically reach the wrapped Material element inside our
 * template (CSS inheritance only carries a few properties, not background/border/
 * padding).
 *
 * The resolution (confirmed with Matt, 2026-09): every component that wraps a Material
 * element accepts three explicit `@Input()`s, implementing this interface, and forwards
 * `overClass`/`overStyle` onto its wrapped element **only** when `overStyled`
 * is `true`. If `overStyled` is `false` or unset (the default), both are discarded
 * entirely — never forwarded, even if a caller set them. This is a deliberate,
 * auditable, greppable escape hatch (`grep -r overStyled` finds every place a consumer
 * is reaching past Recursica's own design), not an ambient binding a consumer could
 * trigger by accident.
 *
 * Not every component needs this — `Layer`/`RecursicaThemeProvider` are Recursica's own
 * styling plumbing, not a wrapped Material element with a "look" to protect (matching
 * the precedent set by `Flex`/`Stack`/`Group`/`Grid` in the React adapters, which also
 * don't use the `RecursicaOverStyled` gatekeeper) — they already accept `class`/`style`
 * unconditionally. This interface is for components that *do* have a protected look,
 * starting with `Button`.
 */
export interface RecursicaOverStyled {
  /**
   * Explicit, greppable escape hatch. `false` or unset (the default): `overClass`/
   * `overStyle` are ignored entirely, regardless of whether they were set. `true`:
   * both are forwarded onto this component's wrapped Material element.
   */
  overStyled?: boolean;

  /** Only forwarded when `overStyled` is `true`. Discarded otherwise. */
  overClass?: string;

  /** Only forwarded when `overStyled` is `true`. Discarded otherwise. */
  overStyle?: Record<string, string>;
}

/**
 * Resolves the class/style a component should actually bind onto its wrapped element,
 * given its own `RecursicaOverStyled` inputs. Centralizing this one `if` means every
 * component enforces the "discard unless overStyled" rule identically, rather than each
 * one re-implementing (and potentially getting wrong) the same three-line check.
 */
export function resolveOverStyle(input: RecursicaOverStyled): {
  class: string | null;
  style: Record<string, string> | null;
} {
  if (!input.overStyled) {
    return { class: null, style: null };
  }
  return {
    class: input.overClass ?? null,
    style: input.overStyle ?? null,
  };
}
