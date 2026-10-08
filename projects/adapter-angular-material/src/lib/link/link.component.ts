import { NgTemplateOutlet } from "@angular/common";
import {
  Component,
  Input,
  TemplateRef,
  ViewEncapsulation,
  inject,
} from "@angular/core";
import {
  type Params,
  RouterLink,
  RouterLinkActive,
  type QueryParamsHandling,
} from "@angular/router";
import type { ActivatedRoute } from "@angular/router";
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

/**
 * Recursica `Link` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). Angular
 * Material/CDK has no dedicated "Link" component or directive (confirmed —
 * same category as `Text`/`Heading`: a full custom build over a plain
 * `<a>`, not a wrapped Material element). This component's template root
 * *is* the anchor — a real navigation element, not a `<button>` — matching
 * `Breadcrumb`'s own precedent of rendering a real `<a>` for its non-last
 * crumbs.
 *
 * ## `href`: a real Angular `@Input()`, not inherited "for free"
 *
 * The canonical `RecursicaLinkProps` contract (`@recursica/adapter-common`)
 * declares only `icon`/`children`/`component` — no `href` of its own. In
 * the React reference this isn't a gap: `Link.tsx` intersects in Mantine's
 * own `AnchorProps`, so `href` (and every other native anchor attribute)
 * passes straight through via `{...sanitizedProps}` onto the underlying
 * `<a>` for free. Angular has no equivalent automatic native-attribute
 * passthrough onto a component's template root, so `href` is declared
 * here explicitly as its own `@Input()` — the same translation
 * `Breadcrumb`'s own `RecursicaBreadcrumbItem.href` already establishes
 * for this exact same "render a real `<a>`" case.
 *
 * ## `icon`: `TemplateRef`, not a projected-content slot
 *
 * Same idiomatic translation `Button`/`Avatar` already use for their own
 * `icon` inputs (`icon?: TemplateRef<unknown>`, rendered via
 * `*ngTemplateOutlet`) — the canonical `icon?: React.ReactNode` has no
 * direct Angular equivalent as a plain `@Input()` value.
 *
 * ## `data-has-icon` attribute, not a CSS `:has()` selector
 *
 * Ports the reference's own technique verbatim (`Link.module.css`'s
 * `.root[data-has-icon]` rule) rather than reinventing it: the icon-text
 * `gap` only applies when an icon is actually present, driven by a host
 * attribute binding — the same `[attr.data-*]` pattern `Avatar`'s
 * `data-variant`/`data-size` and `Button`'s `data-variant`/`data-size`/
 * `data-content` already establish throughout this adapter.
 *
 * ## Underline / hover / focus / visited — see `link.component.css`
 *
 * No default underline (base `text-decoration` token resolves to `none`);
 * hover-underline is driven by the brand-level
 * `--recursica_brand_states_link_decoration` token (resolves to
 * `underline`), not a per-component hover token — there isn't one.
 * `:focus-visible` replaces the native outline with the global
 * `--recursica_brand_states_focus_*` ring, same pattern as every other
 * interactive component here (see `button.component.css`). `:visited`
 * overrides only `colors_text-color`/`colors_icon-color` — the only
 * properties the browser's privacy model allows a `:visited` rule to
 * style at all. See `IMPLEMENTATION_NOTES.md` for the full token mapping
 * and browser-limitation notes.
 */
@Component({
  selector: "rec-link",
  imports: [NgTemplateOutlet, RouterLink, RouterLinkActive],
  encapsulation: ViewEncapsulation.Emulated,
  hostDirectives: [
    {
      directive: RecursicaAriaLabelling,
      inputs: RECURSICA_ARIA_LABELLING_INPUTS,
    },
    { directive: RecursicaElementId, inputs: RECURSICA_ELEMENT_ID_INPUTS },
  ],
  host: { "[attr.title]": "null" },
  styleUrl: "./link.component.css",
  template: `
    @if (routerLink !== undefined && routerLink !== null) {
      <a
        class="root"
        [class]="resolvedOverStyle.class"
        [style]="resolvedOverStyle.style"
        [routerLink]="routerLink"
        [queryParams]="queryParams"
        [queryParamsHandling]="queryParamsHandling"
        [fragment]="fragment"
        [preserveFragment]="preserveFragment"
        [replaceUrl]="replaceUrl"
        [skipLocationChange]="skipLocationChange"
        [state]="state"
        [relativeTo]="relativeTo"
        [target]="target"
        [attr.id]="elementId.id ?? null"
        [attr.aria-label]="aria.ariaLabel ?? null"
        [attr.aria-labelledby]="aria.ariaLabelledby ?? null"
        [attr.aria-describedby]="aria.ariaDescribedby ?? null"
        [attr.title]="title ?? null"
        [attr.rel]="resolvedRel"
        [attr.tabindex]="linkTabIndex ?? null"
        [attr.aria-current]="ariaCurrent ?? null"
        [attr.data-has-icon]="icon ? '' : null"
        routerLinkActive
        ariaCurrentWhenActive="page"
      >
        <ng-container [ngTemplateOutlet]="content" />
      </a>
    } @else {
      <a
        class="root"
        [class]="resolvedOverStyle.class"
        [style]="resolvedOverStyle.style"
        [attr.href]="href ?? null"
        [attr.download]="download ?? null"
        [attr.target]="target ?? null"
        [attr.id]="elementId.id ?? null"
        [attr.aria-label]="aria.ariaLabel ?? null"
        [attr.aria-labelledby]="aria.ariaLabelledby ?? null"
        [attr.aria-describedby]="aria.ariaDescribedby ?? null"
        [attr.title]="title ?? null"
        [attr.rel]="resolvedRel"
        [attr.tabindex]="linkTabIndex ?? null"
        [attr.aria-current]="ariaCurrent ?? null"
        [attr.data-has-icon]="icon ? '' : null"
      >
        <ng-container [ngTemplateOutlet]="content" />
      </a>
    }
    <ng-template #content>
      @if (icon) {
        <span class="iconWrapper" aria-hidden="true">
          <ng-container [ngTemplateOutlet]="icon" />
        </span>
      }
      <span class="labelText"><ng-content /></span>
    </ng-template>
  `,
})
export class LinkComponent implements RecursicaOverStyled {
  protected readonly aria = inject(RecursicaAriaLabelling);
  protected readonly elementId = inject(RecursicaElementId);

  /** Native anchor `href` — see class doc comment for why this is an explicit `@Input()`. */
  @Input() href?: string;

  /**
   * Angular Router navigation target — same value `RouterLink` accepts
   * (`"/users"`, `["/users", id]`, a `UrlTree`). When set, the inner `<a>`
   * is a real `RouterLink` (client-side navigation, a resolved `href`,
   * and `aria-current="page"` while its route is active), and `href` is
   * ignored. See `IMPLEMENTATION_NOTES.md`.
   */
  @Input() routerLink?: string | readonly unknown[] | null;

  /** `RouterLink` pass-throughs — only meaningful together with `routerLink`. */
  @Input() queryParams?: Params | null;
  @Input() queryParamsHandling?: QueryParamsHandling | null;
  @Input() fragment?: string;
  @Input() preserveFragment = false;
  @Input() replaceUrl = false;
  @Input() skipLocationChange = false;
  @Input() state?: Record<string, unknown>;
  @Input() relativeTo?: ActivatedRoute | null;

  /** Native anchor `target`, e.g. `"_blank"`. */
  @Input() target?: string;

  // `ariaLabel` (e.g. for an icon-only link), `ariaLabelledby`,
  // `ariaDescribedby` and `id` come from the host directives and land on the
  // inner `<a>`.

  /** `title` of the inner `<a>`. */
  @Input() title?: string;

  /** `rel` of the inner `<a>`. Defaults to `noopener noreferrer` when `target="_blank"`. */
  @Input() rel?: string;

  /** `download` of the inner `<a>`; only applies to the `href` branch (an empty string downloads under the default name). */
  @Input() download?: string;

  /** `tabindex` of the inner `<a>`. */
  @Input() linkTabIndex?: number;

  /** `aria-current` of the inner `<a>`, e.g. `"page"` for the active navigation link. */
  @Input() ariaCurrent?: string;

  /** Rendered via `*ngTemplateOutlet` — see class doc comment. */
  @Input() icon?: TemplateRef<unknown>;

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  get resolvedRel(): string | null {
    if (this.rel) return this.rel;
    return this.target === "_blank" ? "noopener noreferrer" : null;
  }

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }
}
