import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";

export type RecursicaLoaderVariant = "oval" | "bars" | "dots";
export type RecursicaLoaderSize =
  | "sm"
  | "md"
  | "lg"
  | "small"
  | "default"
  | "large";

const SIZE_MAP: Record<RecursicaLoaderSize, "small" | "default" | "large"> = {
  sm: "small",
  md: "default",
  lg: "large",
  small: "small",
  default: "default",
  large: "large",
};

/**
 * Fallback `diameter`/`strokeWidth` (px) fed to `MatProgressSpinner`
 * (`oval` variant only) before the real token values are read from
 * `getComputedStyle` in `ngAfterViewInit` (see IMPLEMENTATION_NOTES.md
 * "Sizing: reading tokens at runtime"). These match
 * `recursica_variables_scoped.css`'s current
 * `--recursica_ui-kit_components_loader_variants_sizes_<size>_properties_*`
 * values exactly, so there is no visible flash before the real read
 * replaces them — but the real read, not these constants, is the source of
 * truth once the view initializes. `bars`/`dots` don't need this at all —
 * their sizing is plain CSS driven entirely by the `--loader-size` custom
 * property (see loader.component.css), no JS-level geometry to compute.
 */
const FALLBACK_PX: Record<
  "small" | "default" | "large",
  { diameter: number; strokeWidth: number }
> = {
  small: { diameter: 24, strokeWidth: 3 },
  default: { diameter: 36, strokeWidth: 4 },
  large: { diameter: 48, strokeWidth: 5 },
};

/**
 * Recursica `Loader` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10), built ahead
 * of `Button` in build order even though the report lists Button first —
 * the real React reference (`recursica-adapter-mantine-v8`'s `Button.tsx`)
 * composes `Loader` internally for its loading state, so `Loader` has to
 * exist first. See `button.component.ts` for that composition.
 *
 * All three `RecursicaLoaderProps.variant` values render for real:
 *
 * - `oval`: wraps `MatProgressSpinner` (`<mat-progress-spinner>`), always
 *   `mode="indeterminate"` — Recursica's `Loader` has no determinate/
 *   progress-value concept, so `MatProgressSpinner`'s `mode`/`value` inputs
 *   are intentionally never exposed (see IMPLEMENTATION_NOTES.md's "not
 *   exposed" note).
 * - `bars`/`dots`: Angular Material has no equivalent primitive at all
 *   (confirmed against `node_modules/@angular/material/progress-spinner` —
 *   a single SVG-circle spinner, nothing else), and
 *   `recursica_variables_scoped.css` has no bars/dots-specific token tree
 *   either. Built from scratch in plain CSS, directly matching the real
 *   underlying Mantine primitive's own compiled markup/CSS (`@mantine/core`
 *   `Bars`/`Dots`/`Loader.css` — 3 `.bar`/`.dot` spans, same keyframes,
 *   same stagger timings, same proportional `calc(var(--loader-size) / N)`
 *   sizing), fed by this component's real `--loader-size`/`--loader-color`
 *   CSS variables instead of Mantine's own. See IMPLEMENTATION_NOTES.md
 *   "`bars`/`dots`: built for real" for the full read and citations.
 *
 * Since there's no single "real underlying element" to wrap once `bars`/
 * `dots` are hand-built (only `oval` has one), this component's template
 * root is a plain `<span class="root">` wrapping whichever variant's markup
 * is active — `RecursicaOverStyled`'s `overClass`/`overStyle`
 * forward onto that wrapper uniformly, regardless of variant.
 */
@Component({
  selector: "rec-loader",
  imports: [MatProgressSpinnerModule],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./loader.component.css",
  template: `
    <span
      class="root"
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
      [attr.data-variant]="variant"
      [attr.data-size]="resolvedSize"
      [attr.data-animate]="animate ? 'true' : 'false'"
      role="progressbar"
      [attr.aria-label]="ariaLabel ?? 'Loading'"
    >
      @if (variant === "bars") {
        <span class="barsLoader">
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </span>
      } @else if (variant === "dots") {
        <span class="dotsLoader">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </span>
      } @else {
        <mat-progress-spinner
          #spinner
          class="oval"
          mode="indeterminate"
          [diameter]="diameterPx"
          [strokeWidth]="strokeWidthPx"
        />
      }
    </span>
  `,
})
export class LoaderComponent
  implements RecursicaOverStyled, AfterViewInit, OnChanges
{
  @Input() variant: RecursicaLoaderVariant = "oval";

  /** `sm`/`md`/`lg` (short aliases) or the generic `RecursicaSize` scale. */
  @Input() size: RecursicaLoaderSize = "default";

  /** `false` freezes the loader's animation (e.g. deterministic snapshots). Defaults to `true`. */
  @Input() animate = true;

  /** Accessible name for the `role="progressbar"` wrapper. Defaults to `"Loading"`. */
  @Input() ariaLabel?: string;

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  @ViewChild("spinner", { read: ElementRef })
  private spinnerRef?: ElementRef<HTMLElement>;

  diameterPx = FALLBACK_PX["default"].diameter;
  strokeWidthPx = FALLBACK_PX["default"].strokeWidth;

  get resolvedSize(): "small" | "default" | "large" {
    return SIZE_MAP[this.size] ?? "default";
  }

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }

  ngAfterViewInit(): void {
    this.applyFallbackSize();
    this.readTokenSize();
  }

  ngOnChanges(): void {
    this.applyFallbackSize();
    if (this.spinnerRef) {
      this.readTokenSize();
    }
  }

  private applyFallbackSize(): void {
    const fallback = FALLBACK_PX[this.resolvedSize];
    this.diameterPx = fallback.diameter;
    this.strokeWidthPx = fallback.strokeWidth;
  }

  /**
   * `MatProgressSpinner.diameter`/`strokeWidth` (`oval` only) are plain JS
   * numbers (px) — there is no CSS-custom-property equivalent Material
   * input, and its SVG `viewBox`/circle geometry is computed from these
   * numbers at the component level, not via CSS (see
   * IMPLEMENTATION_NOTES.md). To stay token-driven anyway, this reads the
   * real resolved pixel values of `recursica_variables_scoped.css`'s loader
   * size/thickness tokens off the rendered element via `getComputedStyle`
   * and feeds them into Material's real inputs. No-op when `variant` isn't
   * `oval` (`spinnerRef` is `undefined` — nothing to read or set).
   */
  private readTokenSize(): void {
    const el = this.spinnerRef?.nativeElement;
    if (!el) return;
    const computed = getComputedStyle(el);
    const size = parseFloat(
      computed.getPropertyValue(
        `--recursica_ui-kit_components_loader_variants_sizes_${this.resolvedSize}_properties_size`,
      ),
    );
    const thickness = parseFloat(
      computed.getPropertyValue(
        `--recursica_ui-kit_components_loader_variants_sizes_${this.resolvedSize}_properties_thickness-size`,
      ),
    );
    if (!Number.isNaN(size) && size > 0) this.diameterPx = size;
    if (!Number.isNaN(thickness) && thickness > 0)
      this.strokeWidthPx = thickness;
  }
}
