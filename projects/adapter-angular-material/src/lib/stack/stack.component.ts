import { Component, Input, ViewEncapsulation } from "@angular/core";
import { resolveSpacing } from "../utils/recursica-spacing";

/**
 * Recursica `Stack` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). Same "does
 * not exist, no design-system CSS at all" finding as `Flex`/`Group` (see
 * `flex.component.ts`'s class doc comment for the full reasoning — not
 * repeated here). `Stack` is Mantine's fixed-column-direction layout
 * primitive, with its own real default CSS (confirmed directly in
 * `@mantine/core`'s compiled `styles.css`): `align-items: stretch`,
 * `justify-content: flex-start` — reproduced here as this component's own
 * defaults.
 */
@Component({
  selector: "rec-stack",
  encapsulation: ViewEncapsulation.Emulated,
  host: {
    "[style.display]": "'flex'",
    "[style.flex-direction]": "'column'",
    "[style.align-items]": "align",
    "[style.justify-content]": "justify",
    "[style.gap]": "resolvedGap",
  },
  template: `<ng-content />`,
})
export class StackComponent {
  @Input() align = "stretch";
  @Input() justify = "flex-start";
  @Input() gap = "rec-default";

  get resolvedGap(): string | undefined {
    return resolveSpacing(this.gap);
  }
}
