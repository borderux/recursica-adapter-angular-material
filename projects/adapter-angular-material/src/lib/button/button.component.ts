import { NgTemplateOutlet } from "@angular/common";
import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  TemplateRef,
  ViewEncapsulation,
  isDevMode,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import {
  LoaderComponent,
  RecursicaLoaderVariant,
} from "../loader/loader.component";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";

export type RecursicaButtonVariant = "solid" | "outline" | "text";
export type RecursicaButtonSize = "default" | "small";
export type RecursicaButtonLoaderSize =
  | "sm"
  | "md"
  | "lg"
  | "small"
  | "default"
  | "large";

const APPEARANCE_MAP: Record<
  RecursicaButtonVariant,
  "filled" | "outlined" | "text"
> = {
  solid: "filled",
  outline: "outlined",
  text: "text",
};

/**
 * Recursica `Button` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). Wraps the
 * real native `<button matButton>` directive-shaped Material component
 * (`docs/ADAPTER_INTEGRATION_REPORT.md` Crosscutting Finding C) — this
 * component's template root *is* the button, not a wrapper element.
 *
 * ## Variant/appearance mapping
 *
 * Recursica's `variant` maps onto `matButton`'s `appearance` input:
 * `solid → "filled"`, `outline → "outlined"`, `text → "text"`. `"elevated"`/
 * `"tonal"` (Material's other two `appearance` values) have no Recursica
 * equivalent and are never reachable through this component's public API.
 *
 * ## Loading-state composition (real, new work — Material has no `loading` API)
 *
 * `matButton` has **no native loading state at all**
 * (`docs/ADAPTER_INTEGRATION_REPORT.md` Q4/§9's Button row — only
 * `appearance`/`disabled`/`disableRipple`/`disabledInteractive`). This is
 * unlike the React reference, whose `loading` input passes straight through
 * into Mantine's own built-in `loading`/`loaderProps` `ButtonProps` — there
 * is nothing here to "forward into". `loading` is therefore this
 * component's **own** `@Input()`, not part of the canonical
 * `RecursicaButtonProps` contract (verified against the real
 * `RecursicaButtonProps.ts`: it declares `loaderVariant`/`loaderSize`/
 * `useRecursicaLoader` but no `loading` boolean of its own — in the React
 * source, `loading` is inherited from Mantine's own `ButtonProps`, which
 * this Angular adapter has no equivalent underlying type to inherit from).
 *
 * When `loading` is `true`:
 * - The underlying `<button>` is `disabled` (loading implies non-interactive,
 *   matching the React reference's `disabled={... || loading}`).
 * - A `<rec-loader>` renders as a sibling to the (still-present, only
 *   visually hidden via `[data-loading="true"] .labelText`) label — see
 *   button.component.css. The label stays in the DOM unconditionally
 *   (never removed by a template conditional) specifically to keep exactly
 *   one `<ng-content />` in this template, never inside two conditional
 *   branches — see `docs/COMPONENT_DEV_GUIDE.md`'s content-projection
 *   gotcha and `theme-provider.component.ts`'s identical precedent.
 * - The composed `<rec-loader>` receives `overStyled: true` +
 *   `overStyle` setting `--loader-color` (`LoaderComponent`'s own
 *   uniform color variable — drives all three of its variants, not just
 *   `oval`) to `var(--rec-button-color)` — a CSS variable this component's
 *   own CSS declares per variant (matching each variant's real
 *   `..._colors_text-color` token) — so the loader's color matches this
 *   button's own text color regardless of `loaderVariant`, exactly
 *   mirroring the React reference's `<Loader overStyled color="var(--button-color)" />`
 *   technique, just expressed through this adapter's `overStyle`
 *   mechanism instead of a `color` prop. This is fully internal
 *   composition — `--rec-button-color` is never part of this component's
 *   public `@Input()` surface.
 * - `useRecursicaLoader = false` (default `true`): since Material has
 *   nothing built-in to "fall back" to (unlike Mantine, which has its own
 *   default loader), setting this `false` means loading still disables the
 *   button but renders **no** visual loading indicator at all — a
 *   deliberate, documented difference from the React reference's fallback
 *   behavior, not an oversight (see IMPLEMENTATION_NOTES.md).
 *
 * ## `icon`: `TemplateRef`, not a projected-content slot
 *
 * The canonical contract's `icon?: React.ReactNode` has no direct Angular
 * equivalent — Angular has no generic "pass a renderable node as a plain
 * `@Input()` value" type. `icon?: TemplateRef<unknown>` is the idiomatic
 * Angular translation: callers declare `<ng-template #icon>...</ng-template>`
 * and bind `[icon]="icon"`. Rendered via `*ngTemplateOutlet`, not
 * `<ng-content>` — deliberately, to stay clear of the `<ng-content>`-in-a-
 * conditional-branch gotcha entirely (`*ngTemplateOutlet` isn't `<ng-content>`
 * and isn't affected by it).
 */
@Component({
  selector: "rec-button",
  imports: [MatButtonModule, LoaderComponent, NgTemplateOutlet],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./button.component.css",
  template: `
    <button
      matButton
      class="root"
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
      [attr.appearance]="materialAppearance"
      [attr.data-variant]="variant"
      [attr.data-size]="size"
      [attr.data-content]="contentType"
      [attr.data-loading]="loading ? 'true' : null"
      [disabled]="disabled || loading"
      [disableRipple]="disableRipple ?? false"
      [attr.disabledInteractive]="disabledInteractive ? '' : null"
      [attr.aria-label]="ariaLabel ?? null"
      [attr.aria-busy]="loading ? 'true' : null"
    >
      @if (icon) {
        <span class="iconWrapper" aria-hidden="true">
          <ng-container [ngTemplateOutlet]="icon" />
        </span>
      }
      <span class="labelText"><ng-content /></span>
      @if (loading && useRecursicaLoader) {
        <rec-loader
          class="loader"
          [variant]="loaderVariant"
          [size]="resolvedLoaderSize"
          [overStyled]="true"
          [overStyle]="loaderOverStyleStyle"
        />
      }
    </button>
  `,
})
export class ButtonComponent implements RecursicaOverStyled, OnInit, OnChanges {
  @Input() variant: RecursicaButtonVariant = "solid";
  @Input() size: RecursicaButtonSize = "default";

  /** Rendered via `*ngTemplateOutlet` — see class doc comment. */
  @Input() icon?: TemplateRef<unknown>;

  /**
   * Whether `icon` is the button's *only* visible content (drives
   * `data-content="icon-only"` and its border-radius/min-width/padding
   * tokens). Angular has no runtime way to introspect whether `<ng-content>`
   * received meaningful children the way React inspects `children` — so,
   * unlike the React reference's automatic `hasVisibleChildren()` check,
   * this is an explicit caller-declared flag. See IMPLEMENTATION_NOTES.md.
   */
  @Input() iconOnly = false;

  /** Not part of `RecursicaButtonProps` — see class doc comment. */
  @Input() loading = false;

  @Input() loaderVariant: RecursicaLoaderVariant = "oval";
  @Input() loaderSize?: RecursicaButtonLoaderSize;
  @Input() useRecursicaLoader = true;

  @Input() disabled = false;
  @Input() disableRipple?: boolean;
  @Input() disabledInteractive?: boolean;

  /**
   * **Required whenever `iconOnly` is `true`.** An icon-only button has no
   * visible label text, so without an accessible name a screen reader
   * announces nothing meaningful (matches the React reference's identical
   * `USAGE.md` "Icon-only buttons: accessibility" requirement). This is
   * enforced the same way the React reference enforces it — Mantine's
   * `ButtonProps` is a *runtime* type (no TypeScript conditional-prop-type
   * trick there either), so the reference's `Button.tsx` checks at runtime
   * and logs a `console.warn` in development when `icon`/no visible
   * children/no `aria-label` all hold. This component does the Angular
   * equivalent: `ngOnInit`/`ngOnChanges` (this adapter's established
   * lifecycle pattern for an input-driven check that must run both on
   * first render and reactively — see `docs/COMPONENT_DEV_GUIDE.md`'s
   * "Lifecycle pattern" bullet and `ThemeProviderComponent`'s identical
   * precedent) call `checkIconOnlyAccessibility()`, which `console.warn`s
   * (gated on `isDevMode()`, this framework's equivalent of the React
   * reference's `process.env.NODE_ENV !== "production"` gate) when
   * `iconOnly` is `true` and this is falsy.
   */
  @Input() ariaLabel?: string;

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  get materialAppearance(): "filled" | "outlined" | "text" {
    return APPEARANCE_MAP[this.variant];
  }

  get contentType(): "label" | "icon-label" | "icon-only" {
    if (!this.icon) return "label";
    return this.iconOnly ? "icon-only" : "icon-label";
  }

  get resolvedLoaderSize(): RecursicaButtonLoaderSize {
    return this.loaderSize ?? (this.size === "small" ? "small" : "default");
  }

  /**
   * Internal-only override forwarded to the composed `<rec-loader>` via its
   * own `overStyled` escape hatch — never exposed to this component's
   * callers. See class doc comment's "Loading-state composition".
   */
  get loaderOverStyleStyle(): Record<string, string> {
    return {
      "--loader-color": "var(--rec-button-color)",
    };
  }

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }

  /**
   * `ngOnInit` (not just `ngOnChanges`) runs this on first render. Angular
   * only calls `ngOnChanges` for an `@Input()` that is actually *bound* in
   * the caller's template — a `<rec-button>` with `[iconOnly]="true"` bound
   * but no `[ariaLabel]` binding at all still needs this check to run, so
   * `ngOnChanges` alone would miss it. See `ariaLabel`'s own doc comment
   * and `ThemeProviderComponent`'s identical precedent
   * (`docs/COMPONENT_DEV_GUIDE.md`'s "Lifecycle pattern" bullet).
   */
  ngOnInit(): void {
    this.checkIconOnlyAccessibility();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const iconOnlyChanged =
      changes["iconOnly"] && !changes["iconOnly"].firstChange;
    const ariaLabelChanged =
      changes["ariaLabel"] && !changes["ariaLabel"].firstChange;
    if (iconOnlyChanged || ariaLabelChanged) {
      this.checkIconOnlyAccessibility();
    }
  }

  /**
   * Runtime enforcement of `ariaLabel`'s "required whenever `iconOnly` is
   * `true`" contract — see `ariaLabel`'s own doc comment for why this is a
   * `console.warn`, not a compile-time check. Gated on `isDevMode()` so it
   * never runs (or costs anything) in a production build, mirroring the
   * React reference's `process.env.NODE_ENV !== "production"` gate.
   */
  private checkIconOnlyAccessibility(): void {
    if (isDevMode() && this.iconOnly && !this.ariaLabel) {
      console.warn(
        "[Recursica Button] Icon-only buttons must provide an accessible name. " +
          'Pass ariaLabel (e.g. ariaLabel="Submit").',
      );
    }
  }
}
