import { Component, Input, ViewEncapsulation } from "@angular/core";

/**
 * Recursica `Container` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10), same
 * "genuinely does not exist" category as `Flex`/`Stack`/`Group`/`Grid` —
 * Angular Material has no equivalent. Unlike those, the source-of-truth's
 * own `Container.module.css` has zero hardcoded values of its own ("Mantine
 * handles container constraints natively") — every pixel value below is
 * ported directly from `@mantine/core`'s own compiled `Container.css`
 * (`--container-size-{xs,sm,md,lg,xl}` and the `padding-inline`/
 * `margin-inline` on `.m_7485cace:where([data-strategy='block'])`), not a
 * Recursica design token — there is no Recursica container-width token to
 * map to, confirmed by grepping `recursica_variables_scoped.css` for
 * "container" (zero matches). Only the default `strategy: 'block'` centering
 * behavior is reproduced — `'grid'` (an unrelated breakout-layout mode) is
 * untested by any Recursica story on either adapter and out of scope.
 *
 * `RecursicaOverStyled` gate skipped, matching every other layout primitive
 * (`Flex`/`Stack`/`Group`/`Grid`) — see `flex.component.ts`'s class doc
 * comment for the shared reasoning. No `<div>` wrapper: the host element
 * itself carries the centering styles via host bindings, so a caller's own
 * `style="background:white;padding:16px"` on `<rec-container>` merges
 * directly rather than needing an escape-hatch input.
 */
const CONTAINER_SIZE_MAP: Record<string, string> = {
  xs: "540px",
  sm: "720px",
  md: "960px",
  lg: "1140px",
  xl: "1320px",
  "rec-sm": "720px",
  "rec-default": "960px",
  "rec-md": "960px",
  "rec-lg": "1140px",
  "rec-xl": "1320px",
  "rec-2xl": "1320px",
};

@Component({
  selector: "rec-container",
  encapsulation: ViewEncapsulation.Emulated,
  host: {
    "[style.display]": "'block'",
    "[style.max-width]": "resolvedMaxWidth",
    "[style.padding-inline]": "'1rem'",
    "[style.margin-inline]": "'auto'",
  },
  template: `<ng-content />`,
})
export class ContainerComponent {
  /** `rec-*` alias, a Mantine size keyword (`xs`/`sm`/`md`/`lg`/`xl`), or any raw CSS length —
   * unrecognized values pass straight through, same "free passthrough" convention as
   * `resolveSpacing` for the other layout primitives' `gap` inputs. Ignored when `fluid`. */
  @Input() size?: string | number;

  /** Takes 100% of the parent's width, `size` ignored — matches the source-of-truth's own
   * `fluid` prop exactly. */
  @Input() fluid = false;

  get resolvedMaxWidth(): string {
    if (this.fluid) {
      return "100%";
    }
    const size = this.size ?? "md";
    if (typeof size === "number") {
      return `${size}px`;
    }
    return CONTAINER_SIZE_MAP[size] ?? size;
  }
}
