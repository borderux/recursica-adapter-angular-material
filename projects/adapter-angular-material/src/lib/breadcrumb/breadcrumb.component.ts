import { Component, Input, ViewEncapsulation, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";
import {
  RECURSICA_ARIA_LABELLING_INPUTS,
  RECURSICA_ELEMENT_ID_INPUTS,
  RecursicaAriaLabelling,
  RecursicaElementId,
} from "../utils/recursica-aria";

export interface RecursicaBreadcrumbItem {
  label: string;
  href?: string;
  /** Angular Router target (same value `RouterLink` accepts); wins over `href`. */
  routerLink?: string | readonly unknown[];
  /** Native anchor `target` of this crumb's `<a>` (not used on the current page crumb). */
  target?: string;
  /** Native anchor `rel`; defaults to `noopener noreferrer` when `target` is `"_blank"`. */
  rel?: string;
  /** `aria-label` of this crumb's `<a>`. */
  ariaLabel?: string;
}

/**
 * Recursica `Breadcrumb` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). The stub's
 * own `IMPLEMENTATION_NOTES.md` already confirmed `Category: DOES NOT
 * EXIST` and suggested "plain `<nav><ol>`" — re-confirmed at build time
 * (no `mat-breadcrumb`, no CDK primitive), and that suggested semantic
 * structure is what this component actually uses: a real `<nav aria-label="Breadcrumb">`
 * + `<ol>`/`<li>` list, the standard WAI-ARIA breadcrumb pattern — a real,
 * deliberate improvement over the reference's own DOM (Mantine's
 * `Breadcrumbs` renders a flat `<div>` of children with no list semantics
 * at all), not required for visual parity but free to add here since
 * nothing else this adapter needs to match forced a flatter structure.
 *
 * ## Declarative `items`, not arbitrary projected `children` — a real, positive divergence
 *
 * The reference accepts arbitrary React children (typically a mix of
 * `Link`/`<span>` elements) and neutralizes the *last* one at runtime via
 * `markCurrentPageItem` (`React.cloneElement()`-based: strips `href`/
 * `onClick`, sets `aria-current="page"`/`tabIndex={-1}`) — a best-effort
 * safety net, not a guarantee, since it can't stop a custom `Link`
 * component that navigates from its own internal handler (confirmed by
 * reading the reference's own `Breadcrumb.tsx` doc comment and its
 * `LastItemAsLink` story, which exists specifically to demonstrate that
 * safety net). Angular has no `cloneElement()` equivalent to reach into
 * opaque projected content the same way (same constraint
 * `FormControlWrapperComponent`'s own doc comment documents for its own,
 * different, id/ARIA-wiring problem).
 *
 * This component sidesteps the entire problem instead of working around
 * it: `items: RecursicaBreadcrumbItem[]` is a declarative array this
 * component renders itself, so it can make the *last* item non-interactive
 * by construction — the template's own `@if`/`@else` never emits an `<a>`
 * for the last index at all, regardless of whether that item's `href` is
 * set. This is a real, structural guarantee, not a best-effort runtime
 * patch: there is no way to make the last crumb a real link through this
 * component's public API, matching the reference's own stated intent (the
 * current page should never be a link) more strongly than the reference
 * itself can enforce. The reference's `LastItemAsLink` story has no
 * equivalent here for exactly that reason — it demonstrates a failure mode
 * (a caller-supplied `Link` slipping through) that this API shape doesn't
 * allow in the first place, not a gap in coverage.
 *
 * ## No `rec-link` component exists yet in this adapter to compose
 *
 * The reference's own non-last crumbs render its real `Link` component
 * (confirmed: `Breadcrumb.stories.tsx` wraps each one in `<Link href="#">`).
 * This adapter has no `Link` component built yet (not even stubbed —
 * confirmed: absent from `llms.txt`'s own component list entirely, unlike
 * every other component surveyed so far). Rather than block on building a
 * full standalone `Link` component (real scope creep beyond this task),
 * `breadcrumb.component.css` applies the `recursica_ui-kit_components_link_*`
 * text/color tokens directly to its own `.link`/`.current` elements — the
 * same tokens a real `Link` component would use, just not routed through a
 * separate component. Building `Link` itself is a real, separate follow-up.
 */
@Component({
  selector: "rec-breadcrumb",
  imports: [RouterLink],
  encapsulation: ViewEncapsulation.Emulated,
  hostDirectives: [
    {
      directive: RecursicaAriaLabelling,
      inputs: RECURSICA_ARIA_LABELLING_INPUTS,
    },
    { directive: RecursicaElementId, inputs: RECURSICA_ELEMENT_ID_INPUTS },
  ],
  styleUrl: "./breadcrumb.component.css",
  template: `
    <nav
      class="root"
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
      [attr.id]="elementId.id ?? null"
      [attr.aria-label]="aria.ariaLabel ?? 'Breadcrumb'"
      [attr.aria-labelledby]="aria.ariaLabelledby ?? null"
      [attr.aria-describedby]="aria.ariaDescribedby ?? null"
    >
      <ol class="list">
        @for (item of items; track $index; let isLast = $last) {
          <li class="item">
            @if (isLast) {
              <span class="current" aria-current="page">{{ item.label }}</span>
            } @else if (
              item.routerLink !== undefined && item.routerLink !== null
            ) {
              <a
                class="link"
                [routerLink]="item.routerLink"
                [target]="item.target"
                [attr.rel]="itemRel(item)"
                [attr.aria-label]="item.ariaLabel ?? null"
                >{{ item.label }}</a
              >
            } @else if (item.href) {
              <a
                class="link"
                [href]="item.href"
                [attr.target]="item.target ?? null"
                [attr.rel]="itemRel(item)"
                [attr.aria-label]="item.ariaLabel ?? null"
                >{{ item.label }}</a
              >
            } @else {
              <span class="crumb">{{ item.label }}</span>
            }
            @if (!isLast) {
              <span class="separator" aria-hidden="true">{{ separator }}</span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
})
export class BreadcrumbComponent implements RecursicaOverStyled {
  protected readonly aria = inject(RecursicaAriaLabelling);
  protected readonly elementId = inject(RecursicaElementId);

  @Input() items: RecursicaBreadcrumbItem[] = [];
  @Input() separator = ">";

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  protected itemRel(item: RecursicaBreadcrumbItem): string | null {
    if (item.rel) return item.rel;
    return item.target === "_blank" ? "noopener noreferrer" : null;
  }

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }
}
