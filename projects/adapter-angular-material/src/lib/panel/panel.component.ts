import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
  inject,
} from "@angular/core";
import {
  MatDialog,
  MatDialogConfig,
  MatDialogRef,
} from "@angular/material/dialog";

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
 * ## `MatDialog` adopted instead — same reasoning as `Modal`, anchored to an edge
 *
 * Panel's own declarative API (`opened`/`onClose`/`title`/`withOverlay`/
 * `withCloseButton`) is structurally identical to `Modal`'s — the real
 * difference is *where* the content sits (anchored to a screen edge,
 * full-bleed along that edge) and *how* it enters (sliding in from that
 * edge), not the open/close/focus-trap/backdrop mechanics. Reusing
 * `MatDialog` here (rather than duplicating `Modal`'s dialog-lifecycle code
 * with a second, unrelated primitive) inherits the same real, valuable
 * accessibility behavior `Modal`'s own class doc comment documents (focus
 * trap, focus restoration, `Escape`/backdrop-click closing, scroll lock,
 * `role="dialog"`/`aria-modal`) with no `MatSidenavContainer` structural
 * commitment. `MatDialogConfig.position` anchors the dialog's own CDK pane
 * to the requested edge (`{ top: '0', right: '0' }` for `placement="right"`,
 * etc.) instead of Material's own default viewport-centering.
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
        [attr.data-placement]="placement"
      >
        @if (title || withCloseButton) {
          <div class="header">
            @if (title) {
              <h2 class="title">{{ title }}</h2>
            }
            @if (withCloseButton) {
              <button
                type="button"
                class="close"
                aria-label="Close"
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
  @Input() withOverlay = true;
  @Input() closeOnClickOutside = true;

  @ViewChild("contentTpl")
  private readonly contentTemplate!: TemplateRef<unknown>;

  private readonly dialog = inject(MatDialog);
  private readonly id = `rec-panel-${nextId++}`;
  private dialogRef?: MatDialogRef<unknown>;
  private viewInitialized = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes["opened"] || !this.viewInitialized) {
      return;
    }
    if (this.opened) {
      this.openDialog();
    } else {
      this.dialogRef?.close();
    }
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    if (this.opened) {
      this.openDialog();
    }
  }

  ngOnDestroy(): void {
    this.dialogRef?.close();
  }

  private openDialog(): void {
    if (this.dialogRef) {
      return;
    }
    this.dialogRef = this.dialog.open(this.contentTemplate, {
      id: this.id,
      panelClass: ["rec-panel-panel", `rec-panel-panel-${this.placement}`],
      hasBackdrop: this.withOverlay,
      disableClose: !this.closeOnClickOutside,
      autoFocus: "dialog",
      position: this.edgePosition(this.placement),
    });
    this.dialogRef.afterClosed().subscribe(() => {
      this.dialogRef = undefined;
      if (this.opened) {
        this.opened = false;
        this.openedChange.emit(false);
      }
      this.closed.emit();
    });
  }

  private edgePosition(
    placement: RecursicaPanelPlacement,
  ): MatDialogConfig["position"] {
    switch (placement) {
      case "left":
        return { top: "0", left: "0" };
      case "top":
        return { top: "0", left: "0" };
      case "bottom":
        return { bottom: "0", left: "0" };
      case "right":
      default:
        return { top: "0", right: "0" };
    }
  }

  requestClose(): void {
    this.dialogRef?.close();
  }
}
