import { Component, Input, ViewEncapsulation } from "@angular/core";
import { resolveSpacing } from "../utils/recursica-spacing";

export type RecursicaFlexDirection =
  | "row"
  | "column"
  | "row-reverse"
  | "column-reverse";
export type RecursicaFlexWrap = "wrap" | "nowrap" | "wrap-reverse";

/**
 * Recursica `Flex` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). The stub's
 * own `IMPLEMENTATION_NOTES.md` already confirmed `Category: DOES NOT
 * EXIST` — re-confirmed, not assumed (`@angular/cdk/layout` only offers
 * `BreakpointObserver`/`MediaMatcher`, no markup/CSS).
 *
 * ## No design-system CSS at all — a pure passthrough, confirmed not assumed
 *
 * The reference's own `Flex.module.css` is empty ("Mantine handles flex,
 * gap, align, justify. No intrinsic design-system styles required for pure
 * layout wrappers.") — `Flex.tsx` itself is a thin wrapper around Mantine's
 * `Flex`, which applies every prop (`direction`/`wrap`/`align`/`justify`)
 * as literal inline CSS with no default beyond `direction: row`. This
 * component reproduces that directly via host style bindings — no
 * `<div>` wrapper, no scoped stylesheet, since there is nothing to scope:
 * the host element itself is the flex container.
 *
 * ## `RecursicaOverStyled` gate skipped, matching every other layout primitive
 *
 * Confirmed by reading `Flex.tsx`'s own doc comment: layout primitives
 * (`Flex`/`Stack`/`Group`/`Container`/`Grid`) deliberately don't use the
 * `overStyled` escape hatch. A caller's own `class`/`[style]`/`[ngClass]`/
 * `[ngStyle]` on `<rec-flex>` already reaches this component's host
 * element directly via Angular's ordinary host-binding behavior — same
 * reasoning `Container`'s own doc comment documents.
 *
 * ## `gap`/`rowGap`/`columnGap`: `rec-*` tokens or a raw CSS value
 *
 * `resolveSpacing` (`utils/recursica-spacing.ts`) is a direct port of the
 * reference's own `SPACING_MAP`/`mapLayoutProps` — a `rec-*`-prefixed
 * string resolves to the matching design token; anything else (a raw
 * `"16px"`, etc.) passes through unchanged, matching the reference's own
 * "free passthrough" behavior for layout primitives.
 */
@Component({
  selector: "rec-flex",
  encapsulation: ViewEncapsulation.Emulated,
  host: {
    "[style.display]": "'flex'",
    "[style.flex-direction]": "direction",
    "[style.flex-wrap]": "wrap ?? null",
    "[style.gap]": "resolvedGap",
    "[style.row-gap]": "resolvedRowGap",
    "[style.column-gap]": "resolvedColumnGap",
    "[style.align-items]": "align ?? null",
    "[style.justify-content]": "justify ?? null",
  },
  template: `<ng-content />`,
})
export class FlexComponent {
  @Input() direction: RecursicaFlexDirection = "row";
  @Input() wrap?: RecursicaFlexWrap;
  @Input() gap = "rec-default";
  @Input() rowGap?: string;
  @Input() columnGap?: string;
  @Input() align?: string;
  @Input() justify?: string;

  get resolvedGap(): string | undefined {
    return resolveSpacing(this.gap);
  }

  get resolvedRowGap(): string | undefined {
    return resolveSpacing(this.rowGap);
  }

  get resolvedColumnGap(): string | undefined {
    return resolveSpacing(this.columnGap);
  }
}
