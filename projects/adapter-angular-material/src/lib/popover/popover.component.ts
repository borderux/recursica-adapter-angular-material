import { readBeakSize } from "../utils/beak-size";
import { NgTemplateOutlet } from "@angular/common";
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewEncapsulation,
  forwardRef,
  inject,
} from "@angular/core";
import {
  ConnectedOverlayPositionChange,
  ConnectedPosition,
  OverlayModule,
} from "@angular/cdk/overlay";
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
import {
  RECURSICA_ARIA_LABELLING_INPUTS,
  RecursicaAriaLabelling,
} from "../utils/recursica-aria";

let nextId = 0;

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

const OPPOSITE_SIDE: Record<
  RecursicaPopoverBaseSide,
  RecursicaPopoverBaseSide
> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

/** The same position on the opposite side (`top-start` → `bottom-start`), used as the flip fallback. */
function oppositePosition(
  position: RecursicaPopoverPosition,
): RecursicaPopoverPosition {
  const [side, align] = position.split("-") as [
    RecursicaPopoverBaseSide,
    RecursicaPopoverAlign | undefined,
  ];
  return (
    align ? `${OPPOSITE_SIDE[side]}-${align}` : OPPOSITE_SIDE[side]
  ) as RecursicaPopoverPosition;
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
 * click-toggle plus a document-level `pointerdown` listener for
 * click-outside-close (no backdrop: see `IMPLEMENTATION_NOTES.md`,
 * "Outside click and trigger/panel accessibility").
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
 * ## Position flip fallback
 *
 * The caller's `position` is tried first; if the panel would not fit in the viewport, the same
 * position on the opposite side is used (CDK picks the first candidate that fits). The beak follows
 * the side actually used via `(positionChange)`, so a flipped popover points back at its target.
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
  hostDirectives: [
    {
      directive: RecursicaAriaLabelling,
      inputs: RECURSICA_ARIA_LABELLING_INPUTS,
    },
  ],
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
        [cdkConnectedOverlayHasBackdrop]="false"
        (positionChange)="onPositionChange($event)"
        (attach)="watchOutsidePresses()"
        (detach)="onDetach()"
      >
        <div
          class="dropdown rec-popover-panel"
          role="dialog"
          [id]="panelId"
          [attr.aria-label]="aria.ariaLabel ?? null"
          [attr.aria-labelledby]="aria.ariaLabelledby ?? null"
          [attr.aria-describedby]="aria.ariaDescribedby ?? null"
          [class]="resolvedOverStyle.class"
          [style]="resolvedOverStyle.style"
          [attr.data-position]="actualSide ?? baseSide"
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
  implements PopoverContext, RecursicaOverStyled, OnInit, OnDestroy
{
  protected readonly aria = inject(RecursicaAriaLabelling);
  private readonly zone = inject(NgZone);
  private stopWatching?: () => void;

  /** Generated id of the panel; the trigger's `aria-controls` points at it. */
  readonly panelId = `rec-popover-${nextId++}`;

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

  /**
   * Closes on a press outside the target and the panel. A document-level capture listener
   * rather than a backdrop: a backdrop swallows the first outside click, this lets it through
   * to the page (Mantine's behaviour). The target is ignored because its own click toggles.
   */
  watchOutsidePresses(): void {
    this.stopWatching?.();
    const onPointerDown = (event: PointerEvent) => {
      if (!this.closeOnClickOutside) return;
      const node = event.target as Node | null;
      if (
        node &&
        (this.origin?.nativeElement.contains(node) ||
          document.getElementById(this.panelId)?.contains(node))
      ) {
        return;
      }
      this.zone.run(() => this.close());
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    this.stopWatching = () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }

  onDetach(): void {
    this.stopWatching?.();
    this.stopWatching = undefined;
    this.close();
  }

  ngOnDestroy(): void {
    this.stopWatching?.();
  }

  get isOpen(): boolean {
    return this.opened !== undefined ? this.opened : this._uncontrolledOpen;
  }

  get baseSide(): RecursicaPopoverBaseSide {
    return this.position.split("-")[0] as RecursicaPopoverBaseSide;
  }

  get positions(): ConnectedPosition[] {
    const offset = this.offset + (this.withBeak ? readBeakSize() / 2 : 0);
    return [
      toConnectedPosition(this.position, offset),
      toConnectedPosition(oppositePosition(this.position), offset),
    ];
  }

  /** Side the panel was actually placed on (differs from `position` after a flip); drives the beak. */
  actualSide: RecursicaPopoverBaseSide | null = null;

  onPositionChange(change: ConnectedOverlayPositionChange): void {
    const { originX, originY } = change.connectionPair;
    const vertical = this.baseSide === "top" || this.baseSide === "bottom";
    this.actualSide = vertical
      ? originY === "top"
        ? "top"
        : "bottom"
      : originX === "start"
        ? "left"
        : "right";
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
