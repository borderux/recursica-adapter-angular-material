import {
  AfterViewInit,
  Component,
  DOCUMENT,
  EventEmitter,
  Injector,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation,
  afterNextRender,
  inject,
} from "@angular/core";
import {
  GlobalPositionStrategy,
  Overlay,
  OverlayRef,
} from "@angular/cdk/overlay";
import { TemplatePortal } from "@angular/cdk/portal";

export type RecursicaPanelPlacement = "left" | "right" | "top" | "bottom";

let nextId = 0;

/**
 * Recursica `Panel` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). The stub's
 * own `IMPLEMENTATION_NOTES.md` flagged `MatSidenav`/`MatDrawer` as the
 * candidate, but noted it's designed to live inside a `MatSidenavContainer`
 * shell — "a heavier structural commitment than a single drop-in `Panel`
 * component", the same category of finding that sank `MatSelect`/
 * `MatTabGroup` elsewhere in this adapter (a structural prerequisite this
 * adapter's other single drop-in components don't impose on callers).
 * Re-confirmed at build time — not adopted.
 *
 * ## A CDK overlay, not `MatDialog` — Panel is always non-modal
 *
 * Panel is never modal (React's Panel is always non-modal, with no props to
 * change it — see `IMPLEMENTATION_NOTES.md`): no backdrop, no focus trap, no
 * `aria-modal`, no `aria-hidden` on the rest of the page, no scroll lock,
 * `Escape` always closes it and clicking the page behind never does. `MatDialog`
 * cannot do that: its CDK container always adds focus-trap sentinels and always
 * sets `aria-hidden="true"` on every sibling of the overlay container while a
 * dialog is open (confirmed in `@angular/cdk/dialog`). So Panel renders its
 * content into a plain CDK `Overlay` (global position strategy anchored to the
 * placement edge, `TemplatePortal`) and handles `Escape`, focus on open and
 * focus return itself. It is a `role="dialog"` with `aria-modal="false"` — a
 * non-modal dialog — named by its title or by `ariaLabel`/`ariaLabelledby`.
 *
 * ## Global overlay CSS — same reachability finding as `Modal`/`Dropdown`/`HoverCard`
 *
 * `panel-overlay.css` carries the real token styling, scoped under
 * `.rec-panel-panel-content` — see `modal.component.ts`'s own class doc
 * comment for the underlying CDK-portal reachability finding this repeats.
 *
 * **Real, panel-specific finding**: `recursica_variables_scoped.css` only
 * defines `recursica_ui-kit_components_panel_properties_{min-width,
 * max-width}` — no `min-height`/`max-height` token pair exists for Panel
 * the way Modal has both dimensions. This reflects the design system
 * treating Panel primarily as a left/right side-drawer (height is always
 * 100% of the viewport along that axis); `top`/`bottom` placements are
 * still supported functionally (own CSS `max-height` fallback, same
 * `calc(100vh - 4rem)` safety cap `modal-overlay.css` uses), but have no
 * dedicated design token to size against.
 *
 * ## No scroll-divider directive — unlike `Modal`
 *
 * `Panel.module.css` (the reference) has no scroll-divider treatment the
 * way `Modal.module.css` does (no `scroll-divider-size`/
 * `colors_scroll-divider` token exists for Panel either) — confirmed by
 * reading both the reference CSS and `recursica_variables_scoped.css`
 * directly, not assumed from Modal's own precedent. `ModalScrollDividerDirective`
 * is intentionally not reused here.
 *
 * ## Not built: the granular `Panel.Root`/`.Overlay`/`.Content`/`.Header`/
 * `.Title`/`.CloseButton`/`.Body`/`.Stack` sub-components
 *
 * Confirmed by reading `Panel.stories.tsx` directly: all 4 golden stories
 * (Default, LeftPlacement, ScrollableContent, LongTitle) use only the
 * top-level `<Panel opened title placement>children<Panel.Footer>` shape —
 * the same reasoning `Modal`'s own granular sub-components were skipped
 * for.
 *
 * ## `viewInitialized` guard — same crash `Modal` had
 *
 * Every story here starts `opened: true`, same as `Modal`'s own stories —
 * `ngOnChanges` fires before the `@ViewChild("contentTpl")` query resolves
 * (only in `ngAfterViewInit`), so `openDialog()` used to call
 * `dialog.open(this.contentTemplate, ...)` with `contentTemplate` still
 * `undefined`, throwing inside `MatDialog.open()` itself. See
 * `modal.component.ts`'s own class doc comment for the full explanation —
 * this is the identical fix.
 */
@Component({
  selector: "rec-panel",
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./panel.component.css",
  template: `
    <ng-template #contentTpl>
      <div
        class="root rec-panel-panel-content"
        role="dialog"
        aria-modal="false"
        tabindex="-1"
        [id]="panelId"
        [attr.data-placement]="placement"
        [attr.aria-label]="ariaLabel ?? null"
        [attr.aria-labelledby]="
          ariaLabelledby ?? (!ariaLabel && title ? titleId : null)
        "
        [attr.aria-describedby]="ariaDescribedby ?? null"
      >
        @if (title || withCloseButton) {
          <div class="header">
            @if (title) {
              <h2
                class="title"
                [id]="titleId"
                [attr.data-truncate]="wrapHeaderText ? '' : null"
              >
                {{ title }}
              </h2>
            }
            @if (withCloseButton) {
              <button
                type="button"
                class="close"
                [attr.aria-label]="closeButtonLabel"
                (click)="requestClose()"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="100%"
                  height="100%"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            }
          </div>
        }
        <div class="bodyWrapper">
          <div class="scrollArea">
            <ng-content />
          </div>
          <ng-content select="rec-panel-footer" />
        </div>
      </div>
    </ng-template>
  `,
})
export class PanelComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() opened = false;
  @Output() openedChange = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();

  @Input() title?: string;
  @Input() placement: RecursicaPanelPlacement = "right";
  @Input() withCloseButton = true;

  /**
   * `RecursicaPanelProps.wrapHeaderText` (default `true`, same as React). Despite the name,
   * `true` keeps the title on a single line and truncates overflow with an ellipsis (React's
   * `styles.titleTruncate`); `false` lets a long title wrap onto several lines (`styles.title`).
   */
  @Input() wrapHeaderText = true;

  /** `aria-label` of the panel (`role="dialog"`). Without it, the panel is named by its `title`. */
  @Input() ariaLabel?: string;

  /** `aria-labelledby` of the panel; overrides the title as its name. */
  @Input() ariaLabelledby?: string;

  /** `aria-describedby` of the panel. */
  @Input() ariaDescribedby?: string;

  /** Accessible name of the close button. */
  @Input() closeButtonLabel = "Close";

  @ViewChild("contentTpl")
  private readonly contentTemplate!: TemplateRef<unknown>;

  private readonly overlay = inject(Overlay);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  private readonly uid = `rec-panel-${nextId++}`;
  protected readonly panelId = this.uid;
  protected readonly titleId = `${this.uid}-title`;
  private overlayRef?: OverlayRef;
  private opener: HTMLElement | null = null;
  private closing = false;
  private viewInitialized = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes["opened"] || !this.viewInitialized) {
      return;
    }
    if (this.opened) {
      this.openPanel();
    } else {
      this.closePanel();
    }
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    if (this.opened) {
      this.openPanel();
    }
  }

  ngOnDestroy(): void {
    this.overlayRef?.dispose();
    this.overlayRef = undefined;
  }

  private openPanel(): void {
    if (this.overlayRef) {
      return;
    }
    this.closing = false;
    this.opener = this.document.activeElement as HTMLElement | null;
    const overlayRef = this.overlay.create({
      panelClass: ["rec-panel-panel", `rec-panel-panel-${this.placement}`],
      // Always non-modal (see IMPLEMENTATION_NOTES.md): no backdrop, no scroll lock.
      hasBackdrop: false,
      scrollStrategy: this.overlay.scrollStrategies.noop(),
      positionStrategy: this.edgePosition(this.placement),
    });
    this.overlayRef = overlayRef;
    overlayRef.attach(
      new TemplatePortal(this.contentTemplate, this.viewContainerRef),
    );
    // Slide in from the placement edge (see `panel-overlay.css`).
    overlayRef.addPanelClass("rec-panel-opening");
    // `Escape` closes the panel; clicking the page behind never does. The dispatcher only
    // forwards keydown to the topmost overlay, so an open popover or dropdown handles it first.
    overlayRef.keydownEvents().subscribe((event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        this.requestClose();
      }
    });
    // The container takes focus so assistive technology announces the panel.
    afterNextRender(
      () =>
        overlayRef.overlayElement
          .querySelector<HTMLElement>(".rec-panel-panel-content")
          ?.focus(),
      {
        injector: this.injector,
      },
    );
  }

  private closePanel(): void {
    const overlayRef = this.overlayRef;
    if (!overlayRef || this.closing) {
      return;
    }
    this.closing = true;
    overlayRef.removePanelClass("rec-panel-opening");
    overlayRef.addPanelClass("rec-panel-closing");
    // Keep the pane mounted while it slides out (200ms, matching Mantine Drawer's transition).
    setTimeout(() => {
      overlayRef.dispose();
      if (this.overlayRef === overlayRef) {
        this.overlayRef = undefined;
      }
      this.closing = false;
      // Return focus to whatever opened the panel, if it is still on the page.
      if (this.opener && this.document.contains(this.opener)) {
        this.opener.focus();
      }
      this.opener = null;
      if (this.opened) {
        this.opened = false;
        this.openedChange.emit(false);
      }
      this.closed.emit();
    }, 200);
  }

  private edgePosition(
    placement: RecursicaPanelPlacement,
  ): GlobalPositionStrategy {
    const position = this.overlay.position().global();
    switch (placement) {
      case "left":
        return position.top("0").left("0");
      case "top":
        return position.top("0").left("0");
      case "bottom":
        return position.bottom("0").left("0");
      case "right":
      default:
        return position.top("0").right("0");
    }
  }

  requestClose(): void {
    this.closePanel();
  }
}
