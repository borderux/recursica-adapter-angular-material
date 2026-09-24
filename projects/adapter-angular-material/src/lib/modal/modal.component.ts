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
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { ModalScrollDividerDirective } from "./modal-scroll-divider.directive";

let nextId = 0;

/**
 * Recursica `Modal` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). The stub's
 * own `IMPLEMENTATION_NOTES.md` already flagged `Category: EASY–REQUIRES
 * WORK`: `MatDialog`'s service-based `open()` API is a strong real match,
 * but "a real API-shape difference worth designing deliberately" against
 * the reference's declarative `<Modal opened={...}>` — re-confirmed at
 * build time, and exactly the approach taken.
 *
 * ## `MatDialogContainer` adopted — unlike `MatSelect`/`MatTabGroup`, a genuinely neutral shell
 *
 * `MatDialogContainer` (the real chrome `MatDialog.open()` wraps content
 * in) is `ViewEncapsulation.None`, confirmed directly in the compiled
 * source — the same category of finding that sank `MatSelect`/`MatTabGroup`
 * elsewhere in this adapter. The difference here: `MatDialogTitle`/
 * `MatDialogContent`/`MatDialogActions`/`MatDialogClose` are all **bare
 * directives** (confirmed: `[mat-dialog-title]`/`[mat-dialog-content]`/
 * etc. selectors, no fixed template of their own), and `MatDialog.open()`
 * accepts a `TemplateRef` directly — meaning the *content* inside the
 * dialog is 100% this component's own template, never Material's fixed
 * markup. `MatDialogContainer` itself contributes no visible chrome beyond
 * backdrop/centering/focus-trap/animation — real, valuable accessibility
 * behavior (focus trap on open, focus restoration on close, `Escape`/
 * backdrop-click closing, body scroll lock, `role="dialog"`/`aria-modal`)
 * this adapter doesn't have to hand-build the way `Dropdown` had to
 * rebuild `MatSelect`'s entire trigger/panel model from scratch.
 *
 * ## Declarative `[opened]` wraps the imperative `MatDialog.open()`/`.close()`
 *
 * `ngOnChanges` watches `opened`: rising edge calls
 * `dialog.open(this.contentTemplate, {panelClass: 'rec-modal-panel', ...})`;
 * falling edge calls the held `MatDialogRef.close()`. `(closed)` fires from
 * `MatDialogRef.afterClosed()`, covering both a caller setting
 * `[opened]="false"` *and* the user closing it themselves (close button,
 * backdrop, `Escape`) — the same "closed" signal regardless of cause,
 * matching the reference's own single `onClose` callback shape.
 *
 * `ngOnChanges` fires before the `@ViewChild("contentTpl")` query resolves
 * (that only happens in `ngAfterViewInit`), so a caller mounting this with
 * `[opened]="true"` already `true` at creation — the normal pattern for a
 * modal that only exists while something is selected — used to call
 * `dialog.open(this.contentTemplate, ...)` with `contentTemplate` still
 * `undefined`, throwing inside `MatDialog.open()` itself. `viewInitialized`
 * below guards `ngOnChanges` until the view (and therefore the query) is
 * actually ready; `ngAfterViewInit` opens the dialog itself if `opened` was
 * already `true` by then.
 *
 * ## Global overlay CSS — same reachability finding as `Dropdown`/`HoverCard`
 *
 * `MatDialog` portals its content the same way CDK Overlay does generally
 * (`@angular/cdk/dialog` under the hood) — this component's own
 * `modal.component.css` cannot reach the dialog's rendered content for the
 * same live-verified reason `dropdown.component.ts`'s own "a global
 * stylesheet is needed after all" section documents. `modal-overlay.css`
 * carries the real token styling, scoped under `.rec-modal-panel`
 * (`panelClass`, below).
 *
 * ## Footer routing: named content projection, not `React.Children.forEach`
 *
 * The reference's own `ModalBody` manually scans `children` at render time
 * to pull `Modal.Footer` out into its own fixed-at-bottom slot
 * (`Modal.tsx`). Angular's named `<ng-content select="rec-modal-footer">`
 * does this declaratively — see `modal-footer.component.ts`'s own class
 * doc comment.
 *
 * ## Not built: the granular `Modal.Root`/`.Overlay`/`.Content`/`.Header`/
 * `.Title`/`.CloseButton`/`.Body` sub-components
 *
 * Confirmed by reading `Modal.stories.tsx` directly: all 3 golden stories
 * use only the top-level `<Modal opened title>children<Modal.Footer>`
 * shape — none exercise the reference's own "advanced composition" escape
 * hatch. Building 7 additional public sub-components with no golden
 * coverage would be speculative scope; flagged here rather than silently
 * assumed unnecessary.
 */
@Component({
  selector: "rec-modal",
  imports: [ModalScrollDividerDirective],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./modal.component.css",
  template: `
    <ng-template #contentTpl>
      <div
        class="root rec-modal-panel-content"
        [attr.data-full-screen]="fullScreen ? '' : null"
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
          <div class="scrollArea" recModalScrollDivider>
            <ng-content />
          </div>
          <ng-content select="rec-modal-footer" />
        </div>
      </div>
    </ng-template>
  `,
})
export class ModalComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() opened = false;
  @Output() openedChange = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();

  @Input() title?: string;
  @Input() withCloseButton = true;
  @Input() withOverlay = true;
  @Input() closeOnClickOutside = true;
  @Input() fullScreen = false;

  @ViewChild("contentTpl")
  private readonly contentTemplate!: TemplateRef<unknown>;

  private readonly dialog = inject(MatDialog);
  private readonly id = `rec-modal-${nextId++}`;
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
      panelClass: "rec-modal-panel",
      hasBackdrop: this.withOverlay,
      disableClose: !this.closeOnClickOutside,
      autoFocus: "dialog",
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

  requestClose(): void {
    this.dialogRef?.close();
  }
}
