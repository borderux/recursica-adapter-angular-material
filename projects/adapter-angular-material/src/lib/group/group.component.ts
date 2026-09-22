import { Component, Input, ViewEncapsulation } from "@angular/core";
import { resolveSpacing } from "../utils/recursica-spacing";

export type RecursicaGroupWrap = "wrap" | "nowrap" | "wrap-reverse";

/**
 * Recursica `Group` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). Same "does
 * not exist, no design-system CSS at all" finding as `Flex` (see that
 * component's own class doc comment for the full reasoning — not repeated
 * here). `Group` is Mantine's fixed-row-direction sibling to `Flex`, with
 * its own real default CSS (confirmed directly in `@mantine/core`'s
 * compiled `styles.css`, unlike `Flex`'s pure inline-style-only approach):
 * `flex-wrap: wrap`, `justify-content: flex-start`, `align-items: center`
 * — reproduced here as this component's own defaults, not left to the
 * browser's flexbox defaults (which differ: `align-items` defaults to
 * `stretch`, `flex-wrap` to `nowrap`).
 */
@Component({
  selector: "rec-group",
  encapsulation: ViewEncapsulation.Emulated,
  host: {
    "[style.display]": "'flex'",
    "[style.flex-wrap]": "wrap",
    "[style.justify-content]": "justify",
    "[style.align-items]": "align",
    "[style.gap]": "resolvedGap",
    "[style.row-gap]": "resolvedRowGap",
    "[style.column-gap]": "resolvedColumnGap",
  },
  template: `<ng-content />`,
})
export class GroupComponent {
  @Input() wrap: RecursicaGroupWrap = "wrap";
  @Input() justify = "flex-start";
  @Input() align = "center";
  @Input() gap = "rec-default";
  @Input() rowGap?: string;
  @Input() columnGap?: string;

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
