import { NgTemplateOutlet } from "@angular/common";
import {
  Component,
  Input,
  TemplateRef,
  ViewEncapsulation,
} from "@angular/core";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";

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
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./link.component.css",
  template: `
    <a
      class="root"
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
      [attr.href]="href ?? null"
      [attr.data-has-icon]="icon ? '' : null"
    >
      @if (icon) {
        <span class="iconWrapper" aria-hidden="true">
          <ng-container [ngTemplateOutlet]="icon" />
        </span>
      }
      <span class="labelText"><ng-content /></span>
    </a>
  `,
})
export class LinkComponent implements RecursicaOverStyled {
  /** Native anchor `href` — see class doc comment for why this is an explicit `@Input()`. */
  @Input() href?: string;

  /** Rendered via `*ngTemplateOutlet` — see class doc comment. */
  @Input() icon?: TemplateRef<unknown>;

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
