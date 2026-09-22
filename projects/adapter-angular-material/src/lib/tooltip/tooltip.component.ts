import { Component, Input, ViewEncapsulation } from "@angular/core";
import { MatTooltipModule, TooltipPosition } from "@angular/material/tooltip";
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
      class="root"
      [matTooltip]="label"
      [matTooltipDisabled]="disabled"
      [matTooltipPosition]="materialPosition"
      [matTooltipShowDelay]="showDelay ?? 0"
      [matTooltipHideDelay]="hideDelay ?? 0"
      [matTooltipClass]="tooltipClasses"
    >
      <ng-content />
    </span>
  `,
})
export class TooltipComponent implements RecursicaOverStyled {
  @Input() label = "";
  @Input() position: RecursicaTooltipPosition = "top";
  @Input() disabled = false;
  @Input() showDelay?: number;
  @Input() hideDelay?: number;

  /** Visual beak/arrow pointing at the trigger. Defaults to `true`, matching the mantine-adapter's own default. */
  @Input() withBeak = true;

  @Input() overStyled = false;
  @Input() overClass?: string;

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
}
