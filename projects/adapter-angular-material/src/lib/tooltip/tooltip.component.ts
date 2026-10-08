import { AriaDescriber } from "@angular/cdk/a11y";
import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
  inject,
} from "@angular/core";
import {
  MatTooltip,
  MatTooltipModule,
  TooltipPosition,
} from "@angular/material/tooltip";
import { firstFocusable } from "../utils/recursica-trigger-aria";
import { RecursicaOverStyled } from "../utils/recursica-over-styled";

export type RecursicaTooltipPosition = "top" | "bottom" | "left" | "right";

const POSITION_MAP: Record<RecursicaTooltipPosition, TooltipPosition> = {
  top: "above",
  bottom: "below",
  left: "left",
  right: "right",
};

/**
 * Recursica `Tooltip` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). Wraps
 * `MatTooltip` (`docs/ADAPTER_INTEGRATION_REPORT.md` §9's Tooltip row) —
 * unlike Button/Loader, `matTooltip` is an **attribute directive**, not a
 * component with its own template: it has to be applied to a real host
 * element, and Angular gives no way to apply a directive directly to
 * `<ng-content>`. This component's template root is therefore a plain
 * `<span class="root" [matTooltip]="...">` wrapping the projected trigger —
 * `.root { display: inline-flex }` (see tooltip.component.css) shrink-wraps
 * that span tightly to the projected content's own size. **Not**
 * `display: contents`: `MatTooltip` positions its overlay off this
 * element's own `getBoundingClientRect()`, and a `display: contents`
 * element generates no box of its own to measure — verified live
 * (Playwright) that it produces a zero-size rect pinned at the viewport's
 * `(0, 0)`, sending the tooltip to the corner instead of anchoring to the
 * trigger.
 *
 * ## `position`: translated, not passed through
 *
 * Recursica's `top`/`bottom`/`left`/`right` (matching the mantine-adapter's
 * `FloatingPosition` naming for the 4 non-start/end values) maps onto
 * `MatTooltip`'s own `above`/`below`/`left`/`right` (`TooltipPosition`,
 * confirmed in `@angular/material/tooltip`'s compiled declarations — it has
 * no `-start`/`-end` alignment variants at all, a real capability gap
 * against Mantine's full `FloatingPosition` union, not an oversight here).
 *
 * ## `withBeak`: built from scratch — Material has no arrow/beak concept
 *
 * `MatTooltip` ships zero arrow/beak support (confirmed: its compiled
 * template/CSS has no arrow element, only the tooltip surface itself). The
 * beak is drawn with a global CSS pseudo-element keyed off `matTooltipClass`
 * — see the "Why this needs real global CSS" note below.
 *
 * ## Why this needs real global CSS, not just this component's `styleUrl`
 *
 * `MatTooltip` renders its floating panel through CDK Overlay, appended to
 * the overlay container at the end of `<body>` — **not** inside this
 * component's own template. Angular's `ViewEncapsulation.Emulated` scoping
 * works by stamping an `_ngcontent-<hash>` attribute onto elements created
 * from a component's own template; overlay content created elsewhere is
 * never stamped with this component's attribute, so nothing in
 * `tooltip.component.css` (scoped, Emulated) can ever match it — confirmed
 * against the real compiled `TooltipComponent` (`tooltip2.mjs`): it's a
 * separate, `ViewEncapsulation.None` component Material creates internally,
 * with its own class names (`mat-mdc-tooltip`, `mat-mdc-tooltip-surface`)
 * styled via `--mat-tooltip-*` CSS custom properties. Real token styling
 * (colors, font, padding, border-radius, the beak) lives in
 * `tooltip-overlay.css`, a genuinely global stylesheet shipped as a package
 * asset (`ng-package.json`'s `assets`) that a consuming app imports once
 * alongside `RecursicaThemeProvider`'s own setup (see `SETUP.md`) — the
 * first component in this adapter that needs this, and the pattern every
 * future CDK-Overlay-based component (Menu, Dropdown, Popover, HoverCard,
 * Modal) will need too, per `docs/ADAPTER_INTEGRATION_REPORT.md`
 * Crosscutting Finding C.
 *
 * Every rule in `tooltip-overlay.css` is scoped under `.rec-tooltip`
 * (applied via `matTooltipClass`, never bare `.mat-mdc-tooltip*`) so this
 * adapter's tokens never leak onto a plain, non-Recursica `matTooltip`
 * elsewhere in a consuming app — and gated behind
 * `[data-recursica-theme]` (`docs/STYLING_SYSTEM.md` §4's specificity
 * convention), same as every other component's tokens.
 *
 * ## `overStyled`: `overClass` only — no `overStyle`
 *
 * Unlike Button/Loader, there is no safe way to get a live `ElementRef` to
 * hand `overStyle`'s inline styles to: the overlay panel is created and
 * destroyed by CDK on every show/hide, and the only reference to it
 * (`MatTooltip._tooltipInstance`) is a private implementation detail this
 * adapter won't depend on. `overClass` still works — it's forwarded into
 * the same `matTooltipClass` binding used for `.rec-tooltip`/the beak, so a
 * caller-supplied class reaches the real overlay panel exactly like the
 * built-in tokens do.
 */
@Component({
  selector: "rec-tooltip",
  imports: [MatTooltipModule],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./tooltip.component.css",
  template: `
    <span
      #tooltip="matTooltip"
      class="root"
      [matTooltip]="label"
      [matTooltipDisabled]="disabled"
      [matTooltipPosition]="materialPosition"
      [matTooltipShowDelay]="openDelay ?? 0"
      [matTooltipHideDelay]="closeDelay ?? 0"
      [matTooltipClass]="tooltipClasses"
      (focusin)="onFocusIn($event)"
      (focusout)="onFocusOut($event)"
    >
      <ng-content />
    </span>
  `,
})
export class TooltipComponent
  implements
    RecursicaOverStyled,
    AfterViewInit,
    AfterViewChecked,
    OnChanges,
    OnDestroy
{
  @Input() label = "";
  @Input() position: RecursicaTooltipPosition = "top";
  @Input() disabled = false;
  /** Delay in ms before the tooltip opens. */
  @Input() openDelay?: number;
  /** Delay in ms before the tooltip closes. */
  @Input() closeDelay?: number;

  /** @deprecated Use `openDelay`. Kept so existing templates keep working. */
  @Input() set showDelay(value: number | undefined) {
    this.openDelay = value;
  }
  get showDelay(): number | undefined {
    return this.openDelay;
  }

  /** @deprecated Use `closeDelay`. Kept so existing templates keep working. */
  @Input() set hideDelay(value: number | undefined) {
    this.closeDelay = value;
  }
  get hideDelay(): number | undefined {
    return this.closeDelay;
  }

  /** Visual beak/arrow pointing at the trigger. Defaults to `true`, matching the mantine-adapter's own default. */
  @Input() withBeak = true;

  /**
   * Forces the tooltip open/closed, bypassing real hover/focus — matches the
   * reference's own `opened` prop, used by its `LongContent` story to
   * capture a static screenshot of wrapped tooltip text without simulating a
   * real hover. `MatTooltip` has no equivalent declarative input, only
   * imperative `show()`/`hide()` methods — called from `ngAfterViewInit`/
   * `ngOnChanges`, guarded by a `viewInitialized` flag so a caller who sets
   * `[opened]="true"` from the start doesn't call `show()` before the
   * `@ViewChild` resolves (same ordering hazard `rec-modal` already hit —
   * see that component's own fix).
   */
  @Input() opened?: boolean;

  @Input() overStyled = false;
  @Input() overClass?: string;

  @ViewChild("tooltip") private readonly tooltip?: MatTooltip;
  private viewInitialized = false;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly ariaDescriber = inject(AriaDescriber);
  private describedChild: HTMLElement | null = null;
  private describedLabel = "";

  get materialPosition(): TooltipPosition {
    return POSITION_MAP[this.position];
  }

  /** Forwarded to `matTooltipClass` — see class doc comment's global-CSS note. */
  get tooltipClasses(): string {
    const classes = ["rec-tooltip"];
    if (this.withBeak) classes.push("rec-tooltip-beak");
    if (this.overStyled && this.overClass) classes.push(this.overClass);
    return classes.join(" ");
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    this.applyOpened();
  }

  /**
   * `MatTooltip` monitors focus on its own element only (the wrapper span, no
   * `checkChildren`), so keyboard focus on the projected button never reaches it. Focus
   * moving into/out of a child shows/hides the tooltip here, for keyboard focus only
   * (`:focus-visible`), as `MatTooltip` itself does for focus on its element.
   */
  onFocusIn(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    if (target === event.currentTarget) return;
    let visible = true;
    try {
      visible = target.matches(":focus-visible");
    } catch {
      // `:focus-visible` unsupported: treat as keyboard focus.
    }
    if (visible) this.tooltip?.show();
  }

  onFocusOut(event: FocusEvent): void {
    if (event.target === event.currentTarget) return;
    this.tooltip?.hide(0);
  }

  /**
   * `MatTooltip` puts `aria-describedby` on the wrapper span, which is not focusable. When the
   * content has a real focusable element, it is described too (the span keeps its own as a
   * fallback); both point at the same message element.
   */
  ngAfterViewChecked(): void {
    const label = this.disabled ? "" : this.label;
    const child = label ? firstFocusable(this.host.nativeElement) : null;
    if (child === this.describedChild && label === this.describedLabel) return;
    if (this.describedChild) {
      this.ariaDescriber.removeDescription(
        this.describedChild,
        this.describedLabel,
        "tooltip",
      );
    }
    this.describedChild = child;
    this.describedLabel = label;
    if (child) this.ariaDescriber.describe(child, label, "tooltip");
  }

  ngOnDestroy(): void {
    if (this.describedChild) {
      this.ariaDescriber.removeDescription(
        this.describedChild,
        this.describedLabel,
        "tooltip",
      );
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["opened"]) {
      this.applyOpened();
    }
  }

  private applyOpened(): void {
    if (!this.viewInitialized || this.opened === undefined) return;
    if (this.opened) {
      this.tooltip?.show(0);
    } else {
      this.tooltip?.hide(0);
    }
  }
}
