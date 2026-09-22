import { NgTemplateOutlet } from "@angular/common";
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
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
  POPOVER_CONTEXT,
  PopoverContext,
  RecursicaPopoverAlign,
  RecursicaPopoverBaseSide,
  RecursicaPopoverPosition,
} from "./popover-context";

/**
 * Same 12-position → `ConnectedPosition` translation as `HoverCard`'s own
 * `toConnectedPosition` (`hover-card.component.ts`) — Popover and
 * HoverCard share the identical `FloatingPosition`-shaped union in the
 * reference, and this adapter's own `RecursicaPopoverPosition`/
 * `RecursicaHoverCardPosition` types are structurally identical. Not
 * imported from `hover-card.component.ts` (a non-exported private
 * function there) — duplicated rather than reaching into another
 * component's internals for a five-line pure function.
 */
function toConnectedPosition(
  position: RecursicaPopoverPosition,
  offset: number,
): ConnectedPosition {
  const [side, align] = position.split("-") as [
    RecursicaPopoverBaseSide,
    RecursicaPopoverAlign | undefined,
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
 * Recursica `Popover` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). The stub's
 * own `IMPLEMENTATION_NOTES.md` already flagged `Category: REQUIRES WORK`
 * with no packaged Material candidate — build directly on
 * `@angular/cdk/overlay`. Re-confirmed at build time: no Material
 * component wraps arbitrary rich content behind a click-toggled trigger
 * the way this needs (`MatMenu` is action-list-only, `MatSelect` is
 * value-selection-only — the same category of rejection `Dropdown`'s own
 * class doc comment documents for both).
 *
 * ## Built on the same primitives as `HoverCard`, triggered by click instead of hover
 *
 * `Popover` and `HoverCard` share an (almost) identical reference API
 * shape (`Target`/`Dropdown` compound components, `position`, `withBeak`)
 * and — confirmed directly against `recursica_variables_scoped.css` — the
 * exact same token namespace, `recursica_ui-kit_components_hover-card-popover_properties_*`.
 * This component reuses `HoverCard`'s own `CdkConnectedOverlay`/DI-context
 * architecture (`POPOVER_CONTEXT` mirrors `HOVER_CARD_CONTEXT`) and its
 * exact position-translation math, swapping hover-intent timers
 * (`requestOpen`/`requestClose` with open/close delays) for a single
 * click-toggle plus `Dropdown`'s own already-solved click-outside-close
 * pattern (`hasBackdrop` + transparent backdrop class + `(backdropClick)`/
 * `(overlayOutsideClick)` — see `dropdown.component.ts`'s class doc
 * comment for why a transparent backdrop, not `hasBackdrop: false`, is the
 * right primitive for "close on outside click" here).
 *
 * ## Controlled/uncontrolled `opened`: same convention as `Pagination`'s `value`
 *
 * `opened` (controlled) takes precedence over the internal
 * `_uncontrolledOpen` flag (seeded from `defaultOpened` in `ngOnInit`,
 * not a field initializer — `@Input()`s aren't available yet when field
 * initializers run, the same established convention `pagination.component.ts`
 * documents) — matching every other controlled/uncontrolled pair in this
 * adapter.
 *
 * ## Global overlay CSS — same reachability finding as `HoverCard`/`Dropdown`/`Modal`
 *
 * `popover-overlay.css` is a near-verbatim copy of `hover-card-overlay.css`
 * (same tokens, scoped under `.rec-popover-panel` instead of
 * `.rec-hover-card-panel`) — see `hover-card.component.ts`'s/
 * `dropdown.component.ts`'s class doc comments for the underlying
 * CDK-portal reachability finding this repeats.
 *
 * ## No automatic position-flip fallback — same documented scope cut as `HoverCard`
 *
 * Only the single, exact `ConnectedPosition` the caller's `position` input
 * maps to is supplied — none of the 3 golden stories exercise a
 * viewport-edge scenario, so replicating the reference's underlying
 * Floating UI auto-flip behavior would be speculative scope.
 *
 * ## Not built: the granular composition beyond `Target`/`Dropdown`
 *
 * Confirmed by reading `Popover.stories.tsx` directly: all 3 golden
 * stories use only `<Popover><Popover.Target>...<Popover.Dropdown>...`
 * plus `withBeak`/`position`/`width`/`defaultOpened` — nothing else.
 */
@Component({
  selector: "rec-popover",
  imports: [OverlayModule, NgTemplateOutlet],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./popover.component.css",
  providers: [
    {
      provide: POPOVER_CONTEXT,
      useExisting: forwardRef(() => PopoverComponent),
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
        [cdkConnectedOverlayWidth]="width ?? ''"
        [cdkConnectedOverlayHasBackdrop]="closeOnClickOutside"
        cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
        (backdropClick)="close()"
        (overlayOutsideClick)="close()"
        (detach)="close()"
      >
        <div
          class="dropdown rec-popover-panel"
          [class]="resolvedOverStyle.class"
          [style]="resolvedOverStyle.style"
          [attr.data-position]="baseSide"
          [attr.data-beak]="withBeak ? '' : null"
        >
          @if (withBeak) {
            <span class="arrow" aria-hidden="true"></span>
          }
          <ng-container [ngTemplateOutlet]="dropdownTemplate ?? null" />
        </div>
      </ng-template>
    }
  `,
})
export class PopoverComponent
  implements PopoverContext, RecursicaOverStyled, OnInit
{
  @Input() position: RecursicaPopoverPosition = "top";
  @Input() withBeak = true;
  @Input() offset = 5;
  @Input() width?: number;
  @Input() disabled = false;
  @Input() closeOnClickOutside = true;
  @Input() closeOnEscape = true;

  @Input() opened?: boolean;
  @Input() defaultOpened = false;
  @Output() openedChange = new EventEmitter<boolean>();

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  origin?: ElementRef<HTMLElement>;
  dropdownTemplate: TemplateRef<unknown> | null = null;

  private _uncontrolledOpen = false;

  ngOnInit(): void {
    this._uncontrolledOpen = this.defaultOpened;
  }

  @HostListener("document:keydown", ["$event"])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (this.closeOnEscape && event.key === "Escape" && this.isOpen) {
      this.close();
    }
  }

  get isOpen(): boolean {
    return this.opened !== undefined ? this.opened : this._uncontrolledOpen;
  }

  get baseSide(): RecursicaPopoverBaseSide {
    return this.position.split("-")[0] as RecursicaPopoverBaseSide;
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

  requestToggle(): void {
    if (this.disabled) {
      return;
    }
    this.setOpen(!this.isOpen);
  }

  requestClose(): void {
    this.close();
  }

  close(): void {
    this.setOpen(false);
  }

  private setOpen(next: boolean): void {
    if (this.opened === undefined) {
      this._uncontrolledOpen = next;
    }
    this.openedChange.emit(next);
  }
}
