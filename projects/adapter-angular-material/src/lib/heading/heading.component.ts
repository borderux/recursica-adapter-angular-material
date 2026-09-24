import { NgTemplateOutlet } from "@angular/common";
import { Component, Input, ViewEncapsulation } from "@angular/core";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";

export type RecursicaHeadingOrder = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Recursica `Heading` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). The stub's
 * own `IMPLEMENTATION_NOTES.md` already confirmed `Category: DOES NOT
 * EXIST` (Sass typography mixins only, no component-level typography
 * primitive in Material at all) and suggested exactly this shape — a
 * `[order]`-driven native `<h1>`–`<h6>`. Re-confirmed at build time.
 *
 * ## `.recursica_brand_typography_h{order}` — a pre-existing global utility class, not a new token
 *
 * `Heading.tsx` applies `recursica_brand_typography_h${order}` as a plain
 * class name, not a component-scoped CSS variable — confirmed these
 * classes already exist in this adapter's own
 * `recursica_variables_scoped.css` (`.recursica_brand_typography_h1`
 * through `h6`, real rules already shipping, not something this component
 * needs to define). This is the one real exception to
 * `docs/STYLING_SYSTEM.md` §4's usual `:host-context([data-recursica-theme])`-gated
 * component CSS pattern — `Heading` consumes an existing global utility
 * class directly instead of its own scoped token declarations, because
 * that's genuinely what the reference does too.
 *
 * ## Six `@switch` branches, not a dynamic tag name
 *
 * Angular templates have no way to bind an element's tag name dynamically
 * (no `[tagName]`-style directive) — same category of constraint as
 * `Avatar`'s three mutually-exclusive display-mode branches. Six near-
 * identical `<h1>`–`<h6>` branches are the direct translation.
 *
 * ## One `<ng-content>`, six outlets — not six `<ng-content>`s
 *
 * This originally put a separate `<ng-content>` inside each `@switch`
 * branch, which is exactly `docs/COMPONENT_DEV_GUIDE.md`'s documented
 * content-projection gotcha: with more than one `<ng-content>` in a
 * template, only the first-declared one ever receives projected content —
 * every other branch renders empty, so five of the six orders silently
 * dropped their children. Fixed the same way `Button`'s `icon` avoids the
 * gotcha entirely: project into a single `<ng-template #content>` once,
 * then `*ngTemplateOutlet` that same captured view from each branch — six
 * outlets of one real `<ng-content>`, not six real ones.
 */
@Component({
  selector: "rec-heading",
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./heading.component.css",
  template: `
    <ng-template #content><ng-content /></ng-template>
    @switch (order) {
      @case (1) {
        <h1
          class="root recursica_brand_typography_h1"
          [class]="resolvedOverStyle.class"
          [style]="resolvedOverStyle.style"
        >
          <ng-container [ngTemplateOutlet]="content" />
        </h1>
      }
      @case (2) {
        <h2
          class="root recursica_brand_typography_h2"
          [class]="resolvedOverStyle.class"
          [style]="resolvedOverStyle.style"
        >
          <ng-container [ngTemplateOutlet]="content" />
        </h2>
      }
      @case (3) {
        <h3
          class="root recursica_brand_typography_h3"
          [class]="resolvedOverStyle.class"
          [style]="resolvedOverStyle.style"
        >
          <ng-container [ngTemplateOutlet]="content" />
        </h3>
      }
      @case (4) {
        <h4
          class="root recursica_brand_typography_h4"
          [class]="resolvedOverStyle.class"
          [style]="resolvedOverStyle.style"
        >
          <ng-container [ngTemplateOutlet]="content" />
        </h4>
      }
      @case (5) {
        <h5
          class="root recursica_brand_typography_h5"
          [class]="resolvedOverStyle.class"
          [style]="resolvedOverStyle.style"
        >
          <ng-container [ngTemplateOutlet]="content" />
        </h5>
      }
      @default {
        <h6
          class="root recursica_brand_typography_h6"
          [class]="resolvedOverStyle.class"
          [style]="resolvedOverStyle.style"
        >
          <ng-container [ngTemplateOutlet]="content" />
        </h6>
      }
    }
  `,
})
export class HeadingComponent implements RecursicaOverStyled {
  @Input() order: RecursicaHeadingOrder = 1;

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }
}
