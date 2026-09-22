import { NgTemplateOutlet } from "@angular/common";
import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  TemplateRef,
  ViewEncapsulation,
  forwardRef,
} from "@angular/core";
import { ConnectedPosition, OverlayModule } from "@angular/cdk/overlay";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";
import {
  HOVER_CARD_CONTEXT,
  HoverCardContext,
  RecursicaHoverCardAlign,
  RecursicaHoverCardBaseSide,
  RecursicaHoverCardPosition,
} from "./hover-card-context";

/**
 * Translates every `RecursicaHoverCardPosition` (12 values: `top`/`bottom`/
 * `left`/`right`, each optionally suffixed `-start`/`-end`) into a real
 * `ConnectedPosition` — unlike `Tooltip` (which wraps `MatTooltip` and is
 * capped at 4 positions, `TooltipPosition` has no `-start`/`-end` alignment
 * variants at all, confirmed in `@angular/material/tooltip`'s compiled
 * declarations), this component is hand-built directly on
 * `CdkConnectedOverlay`, so it can support the reference's full
 * `FloatingPosition`-shaped union with no capability gap.
 */
function toConnectedPosition(
  position: RecursicaHoverCardPosition,
  offset: number,
): ConnectedPosition {
  const [side, align] = position.split("-") as [
    RecursicaHoverCardBaseSide,
    RecursicaHoverCardAlign | undefined,
  ];

  if (side === "top" || side === "bottom") {
    const cross =
      align === "start" ? "start" : align === "end" ? "end" : "center";
    return side === "top"
      ? {
          originX: cross,
          originY: "top",
          overlayX: cross,
          overlayY: "bottom",
          offsetY: -offset,
        }
      : {
          originX: cross,
          originY: "bottom",
          overlayX: cross,
          overlayY: "top",
          offsetY: offset,
        };
  }

  const cross =
    align === "start" ? "top" : align === "end" ? "bottom" : "center";
  return side === "left"
    ? {
        originX: "start",
        originY: cross,
        overlayX: "end",
        overlayY: cross,
        offsetX: -offset,
      }
    : {
        originX: "end",
        originY: cross,
        overlayX: "start",
        overlayY: cross,
        offsetX: offset,
      };
}

/**
 * Recursica `HoverCard` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). The stub's
 * own `IMPLEMENTATION_NOTES.md` already flagged `Category: REQUIRES WORK`
 * ("same toolkit as Popover; no packaged hover-triggered variant exists,
 * needs a manual `mouseenter`/`FocusMonitor`-driven open state on top of
 * the same Overlay primitives") — re-confirmed at build time, and exactly
 * the approach taken: built directly on `@angular/cdk/overlay`'s
 * `CdkConnectedOverlay`, the same primitive `Dropdown`/`AutoComplete` use,
 * not `MatTooltip` (which only accepts a plain string message, no slot for
 * `HoverCard.Dropdown`'s arbitrary rich content — same class of rejection
 * `Dropdown`'s own `MatSelect` finding documents, applied here to
 * `matTooltip` instead).
 *
 * ## Compound `<rec-hover-card>`/`<rec-hover-card-target>`/`<rec-hover-card-dropdown>` — DI, not `@Input()`
 *
 * Mirrors the reference's own `<HoverCard>`/`<HoverCard.Target>`/
 * `<HoverCard.Dropdown>` composition shape. `HOVER_CARD_CONTEXT`
 * (`hover-card-context.ts`) is the same DI-based translation of an
 * implicit React context `TABS_CONTEXT`/`STEPPER_CONTEXT` already
 * establish in this adapter — see `tabs/tabs-context.ts`'s own doc comment
 * for the full reasoning, not repeated here.
 *
 * ## Hover-intent coordination: both the target *and* the dropdown keep it open
 *
 * Confirmed by reading `HOVERCARD_IMPLEMENTATION_NOTES.md` directly
 * ("Mantine manages hover detection across target and dropdown... the
 * dropdown stays open while the user hovers over it, allowing interaction
 * with its content") — `requestOpen()`/`requestClose()` are called from
 * *both* `HoverCardTargetComponent` (on `mouseenter`/`mouseleave`/
 * `focusin`/`focusout`) and this component's own dropdown-panel template
 * (on `mouseenter`/`mouseleave`), each cancelling the other's pending
 * timer — moving the pointer from the target straight onto the dropdown
 * never triggers a flicker-close in between, since `requestOpen()` always
 * clears any pending close timer first, before checking whether a new
 * open timer is even needed.
 *
 * ## No automatic position-flip fallback — a real, documented scope cut
 *
 * `Dropdown`'s own `positions` array carries a second, opposite-side entry
 * for CDK to fall back to if the primary position doesn't fit the
 * viewport. This component only supplies the single, exact
 * `ConnectedPosition` the caller's `position` input maps to — the
 * reference's underlying Floating UI engine likely does automatic
 * viewport-aware flipping, but none of this adapter's 3 golden stories
 * exercise a viewport-edge scenario that would need it, so replicating
 * that automatic behavior here would be speculative scope.
 *
 * ## Beak placement: correct for the 4 base sides, centered for `-start`/`-end` variants
 *
 * The beak's own position (which edge of the dropdown it sits on, and
 * whether it's centered vs. offset toward the aligned corner) is driven by
 * `[attr.data-position]` set to the *base side* only (`top`/`bottom`/
 * `left`/`right`, the `-start`/`-end` suffix dropped) — the beak sits at
 * the horizontal/vertical center of that edge regardless of `-start`/
 * `-end` alignment. A pixel-perfect corner-offset beak for all 8 diagonal
 * variants was not built — none of the 3 golden stories use anything but
 * plain `top`, so building that precision would be speculative scope, the
 * same reasoning `Tabs`' own "Outline uses the same bottom-border as
 * Default rather than Mantine's corner-joining pseudo-element trick"
 * simplification documents for a different component.
 */
@Component({
  selector: "rec-hover-card",
  imports: [OverlayModule, NgTemplateOutlet],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./hover-card.component.css",
  providers: [
    {
      provide: HOVER_CARD_CONTEXT,
      useExisting: forwardRef(() => HoverCardComponent),
    },
  ],
  template: `
    <ng-content />
    @if (origin) {
      <ng-template
        cdkConnectedOverlay
        [cdkConnectedOverlayOrigin]="origin"
        [cdkConnectedOverlayOpen]="isOpen && !disabled"
        [cdkConnectedOverlayPositions]="positions"
        [cdkConnectedOverlayHasBackdrop]="false"
      >
        <div
          class="dropdown rec-hover-card-panel"
          [class]="resolvedOverStyle.class"
          [style]="resolvedOverStyle.style"
          [attr.data-position]="baseSide"
          [attr.data-beak]="resolvedWithBeak ? '' : null"
          (mouseenter)="requestOpen()"
          (mouseleave)="requestClose()"
        >
          @if (resolvedWithBeak) {
            <span class="arrow" aria-hidden="true"></span>
          }
          <ng-container [ngTemplateOutlet]="dropdownTemplate ?? null" />
        </div>
      </ng-template>
    }
  `,
})
export class HoverCardComponent
  implements HoverCardContext, RecursicaOverStyled, OnDestroy
{
  @Input() position: RecursicaHoverCardPosition = "top";
  @Input() withBeak = true;
  @Input() withArrow?: boolean;
  @Input() offset = 5;
  @Input() openDelay = 0;
  @Input() closeDelay = 150;
  @Input() disabled = false;

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  isOpen = false;
  origin?: ElementRef<HTMLElement>;
  dropdownTemplate: TemplateRef<unknown> | null = null;

  private openTimeout?: ReturnType<typeof setTimeout>;
  private closeTimeout?: ReturnType<typeof setTimeout>;

  get resolvedWithBeak(): boolean {
    return this.withBeak ?? this.withArrow ?? true;
  }

  get baseSide(): RecursicaHoverCardBaseSide {
    return this.position.split("-")[0] as RecursicaHoverCardBaseSide;
  }

  get positions(): ConnectedPosition[] {
    return [toConnectedPosition(this.position, this.offset)];
  }

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }

  registerOrigin(el: ElementRef<HTMLElement>): void {
    this.origin = el;
  }

  registerDropdownTemplate(template: TemplateRef<unknown> | null): void {
    this.dropdownTemplate = template;
  }

  requestOpen(): void {
    if (this.disabled) {
      return;
    }
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = undefined;
    }
    if (this.isOpen || this.openTimeout) {
      return;
    }
    this.openTimeout = setTimeout(() => {
      this.isOpen = true;
      this.openTimeout = undefined;
    }, this.openDelay);
  }

  requestClose(): void {
    if (this.openTimeout) {
      clearTimeout(this.openTimeout);
      this.openTimeout = undefined;
    }
    if (!this.isOpen || this.closeTimeout) {
      return;
    }
    this.closeTimeout = setTimeout(() => {
      this.isOpen = false;
      this.closeTimeout = undefined;
    }, this.closeDelay);
  }

  ngOnDestroy(): void {
    if (this.openTimeout) {
      clearTimeout(this.openTimeout);
    }
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }
  }
}
