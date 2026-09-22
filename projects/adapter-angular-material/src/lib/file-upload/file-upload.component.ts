import { NgTemplateOutlet } from "@angular/common";
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  QueryList,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewChildren,
  ViewEncapsulation,
} from "@angular/core";
import { ButtonComponent } from "../button/button.component";
import { ChipComponent } from "../chip/chip.component";
import {
  fileMatchesAccept,
  RecursicaFileUploadItem,
} from "../file-input/file-input-item";
import type {
  RecursicaFormControlLabelSize,
  RecursicaFormLayout,
} from "../form-control-layout/form-control-layout.component";
import { FormControlWrapperComponent } from "../form-control-wrapper/form-control-wrapper.component";
import type { RecursicaLabelAlignment } from "../label/label.component";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";

let nextId = 0;

/**
 * Recursica `FileUpload` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). Same "does
 * not exist" finding as `FileInput` (see that component's own class doc
 * comment — not repeated here) — a dropzone sibling sharing `FileInput`'s
 * validation/roving-tabindex machinery behind a different presentation.
 *
 * ## Reuses `FileInput`'s item type and `fileMatchesAccept` directly
 *
 * `RecursicaFileUploadItem`/`fileMatchesAccept` are imported from
 * `../file-input/file-input-item` rather than duplicated — the genesis
 * reference's own `FileUpload.tsx` and `FileInput.tsx` both import the
 * identical `RecursicaFileUploadItem`/`fileMatchesAccept` from
 * `@recursica/adapter-common` for exactly this reason. Same real,
 * documented cross-component dependency `auto-complete-control.component.ts`
 * already has on `Dropdown`'s own option types, for the same underlying
 * reason (no shared-utils package in this adapter to hold it instead).
 *
 * ## Real, meaningful difference from `FileInput`: only the Browse button opens the picker
 *
 * Confirmed by reading `FileUpload.tsx` directly: unlike `FileInput`
 * (where the *entire* control is `role="button"` and clicking anywhere
 * opens the file picker), `FileUpload`'s `.dropzone` div has no click
 * handler of its own at all — only the `<Button onClick={openFilePicker}>`
 * does. The dropzone area still accepts drag-and-drop across its whole
 * surface, but a plain click on empty dropzone space (not the button) does
 * nothing, matching the reference exactly rather than assuming the same
 * click-anywhere behavior `FileInput` has.
 *
 * ## `readOnly` hides the dropzone entirely, doesn't disable it
 *
 * Confirmed by reading `FileUpload.tsx`: `{!readOnly && <div className={styles.dropzone}>...}`
 * — read-only mode renders *only* the (non-interactive) file chip list, no
 * dropzone/browse-button/hidden-input at all, a real structural
 * difference from `disabled` (which keeps the dropzone visible but
 * non-functional). Reproduced the same way here via `@if (!readOnly)`.
 *
 * ## Roving tabindex + drag counter: same mechanism as `FileInput`, not re-derived
 *
 * See `file-input.component.ts`'s own class doc comment for the
 * `.deleteIcon`-querying/`@ViewChildren` reasoning — identical here.
 */
@Component({
  selector: "rec-file-upload",
  imports: [
    NgTemplateOutlet,
    FormControlWrapperComponent,
    ChipComponent,
    ButtonComponent,
  ],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./file-upload.component.css",
  template: `
    <rec-form-control-wrapper
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
      [formLayout]="formLayout"
      [labelSize]="labelSize"
      [labelAlignment]="labelAlignment"
      [labelOptionalText]="labelOptionalText"
      [labelWithEditIcon]="labelWithEditIcon"
      [labelActionArea]="labelActionArea"
      [label]="label"
      [description]="description"
      [assistiveText]="assistiveText"
      [helperText]="helperText"
      [error]="effectiveError"
      [assistiveWithIcon]="assistiveWithIcon"
      [required]="required"
      [withAsterisk]="withAsterisk"
      (labelEditClick)="labelEditClick.emit($event)"
    >
      <div
        class="root"
        [id]="id"
        [attr.data-disabled]="disabled ? 'true' : null"
        [attr.data-error]="effectiveError ? 'true' : null"
      >
        @if (!readOnly) {
          <div
            class="dropzone"
            [attr.data-dragging]="isDragging ? 'true' : null"
            (dragenter)="!disabled && onDragEnter($event)"
            (dragleave)="!disabled && onDragLeave($event)"
            (dragover)="!disabled && onDragOver($event)"
            (drop)="!disabled && onDrop($event)"
          >
            <span class="uploadIcon">
              @if (icon) {
                <ng-container [ngTemplateOutlet]="icon" />
              } @else {
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
                  <path d="M12 3v12" />
                  <path d="M7 8l5-5 5 5" />
                  <path d="M4 21h16" />
                </svg>
              }
            </span>
            <span class="dropzoneText">{{ dropzoneLabel }}</span>
            <rec-button
              variant="outline"
              [disabled]="disabled"
              (click)="openFilePicker()"
              >{{ browseButtonLabel }}</rec-button
            >
            <input
              #fileInputEl
              type="file"
              hidden
              [attr.accept]="accept ?? null"
              [multiple]="multiple"
              [disabled]="disabled"
              (change)="onInputChange($event)"
            />
          </div>
        }

        @if (hasFiles) {
          @if (readOnly) {
            <div class="fileList">
              @for (item of files; track itemId(item)) {
                <rec-chip [checked]="false" [deleteTabIndex]="-1">{{
                  item.file.name
                }}</rec-chip>
              }
            </div>
          } @else {
            <div
              class="fileList"
              role="group"
              aria-label="Selected files"
              (keydown)="onFileListKeydown($event)"
            >
              @for (item of files; track itemId(item); let i = $index) {
                <span #chipHost>
                  <rec-chip
                    [checked]="false"
                    [deleteLabel]="removeFileLabel"
                    [deleteTabIndex]="i === activeChipIndex ? 0 : -1"
                    (remove)="onFileRemoveClick(itemId(item))"
                    >{{ item.file.name }}</rec-chip
                  >
                </span>
              }
            </div>
          }
        }
      </div>
    </rec-form-control-wrapper>
  `,
})
export class FileUploadComponent implements RecursicaOverStyled, OnChanges {
  @Input() files: RecursicaFileUploadItem[] = [];
  @Output() filesAdded = new EventEmitter<File[]>();
  @Output() fileRemove = new EventEmitter<string>();
  @Output() filesRejected = new EventEmitter<File[]>();

  @Input() accept?: string;
  @Input() multiple = true;
  @Input() maxSize?: number;
  @Input() maxFiles?: number;

  @Input() disabled = false;
  @Input() readOnly = false;

  @Input() invalidFileTypeMessage = "File type not accepted";
  @Input() maxFilesMessage?: string;

  @Input() icon?: TemplateRef<unknown>;

  @Input() dropzoneLabel = "Drag and drop files here to upload";
  @Input() browseButtonLabel = "Browse files";
  @Input() removeFileLabel = "Remove";

  @Input() error?: string;

  @Input() formLayout: RecursicaFormLayout = "stacked";
  @Input() labelSize: RecursicaFormControlLabelSize = "default";
  @Input() labelAlignment: RecursicaLabelAlignment = "left";
  @Input() labelOptionalText?: boolean | string;
  @Input() labelWithEditIcon = false;
  @Input() labelActionArea?: TemplateRef<unknown>;

  @Input() label?: string | TemplateRef<unknown>;
  @Input() description?: string | TemplateRef<unknown>;
  @Input() assistiveText?: string | TemplateRef<unknown>;
  @Input() helperText?: string | TemplateRef<unknown>;
  @Input() assistiveWithIcon = true;
  @Input() required = false;
  @Input() withAsterisk?: boolean;

  @Output() labelEditClick = new EventEmitter<MouseEvent>();

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  private readonly baseId = `rec-file-upload-${nextId++}`;
  @Input() id = this.baseId;

  @ViewChild("fileInputEl")
  private readonly fileInputRef?: ElementRef<HTMLInputElement>;
  @ViewChildren("chipHost") private readonly chipHosts?: QueryList<
    ElementRef<HTMLElement>
  >;

  invalidTypeRejected = false;
  tooManyFilesRejected = false;
  isDragging = false;
  activeChipIndex = 0;

  private dragCounter = 0;
  private previousFileCount = 0;

  get hasFiles(): boolean {
    return this.files.length > 0;
  }

  get effectiveError(): string | undefined {
    if (this.error) {
      return this.error;
    }
    if (this.invalidTypeRejected) {
      return this.invalidFileTypeMessage;
    }
    if (this.tooManyFilesRejected) {
      return this.resolvedMaxFilesMessage;
    }
    return undefined;
  }

  private get resolvedMaxFilesMessage(): string {
    return this.maxFilesMessage ?? `Maximum of ${this.maxFiles} files allowed`;
  }

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }

  itemId(item: RecursicaFileUploadItem): string {
    return item.id ?? item.file.name;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes["files"]) {
      return;
    }
    const count = this.files.length;
    if (count > 0 && count < this.previousFileCount) {
      const nextIndex = Math.min(this.activeChipIndex, count - 1);
      this.activeChipIndex = nextIndex;
      queueMicrotask(() => this.focusChipDelete(nextIndex));
    }
    this.previousFileCount = count;
  }

  private focusChipDelete(index: number): void {
    const host = this.chipHosts?.get(index)?.nativeElement;
    const deleteButton = host?.querySelector<HTMLElement>(".deleteIcon");
    deleteButton?.focus();
  }

  openFilePicker(): void {
    if (this.disabled) {
      return;
    }
    this.fileInputRef?.nativeElement.click();
  }

  private handleFiles(incoming: FileList | File[]): void {
    if (this.disabled) {
      return;
    }
    const list = Array.from(incoming);
    if (list.length === 0) {
      return;
    }

    const currentCount = this.files.length;
    const accepted: File[] = [];
    const rejected: File[] = [];
    let hasInvalidType = false;
    let hasTooMany = false;
    for (const file of list) {
      const isInvalidType = !fileMatchesAccept(file, this.accept);
      if (isInvalidType) {
        hasInvalidType = true;
      }
      const isTooLarge = this.maxSize !== undefined && file.size > this.maxSize;
      const wouldExceedMax =
        this.maxFiles !== undefined &&
        currentCount + accepted.length >= this.maxFiles;
      if (wouldExceedMax) {
        hasTooMany = true;
      }
      const isRejected = isInvalidType || isTooLarge || wouldExceedMax;
      (isRejected ? rejected : accepted).push(file);
    }
    this.invalidTypeRejected = hasInvalidType;
    this.tooManyFilesRejected = hasTooMany;
    if (accepted.length > 0) {
      this.filesAdded.emit(accepted);
    }
    if (rejected.length > 0) {
      this.filesRejected.emit(rejected);
    }
  }

  onDragEnter(event: DragEvent): void {
    event.preventDefault();
    this.dragCounter += 1;
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragCounter -= 1;
    if (this.dragCounter <= 0) {
      this.dragCounter = 0;
      this.isDragging = false;
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragCounter = 0;
    this.isDragging = false;
    if (event.dataTransfer) {
      this.handleFiles(event.dataTransfer.files);
    }
  }

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(input.files);
    }
    input.value = "";
  }

  onFileRemoveClick(id: string): void {
    this.fileRemove.emit(id);
  }

  onFileListKeydown(event: KeyboardEvent): void {
    const count = this.files.length;
    if (count === 0) {
      return;
    }
    let nextIndex: number | undefined;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (this.activeChipIndex + 1) % count;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (this.activeChipIndex - 1 + count) % count;
    }
    if (nextIndex === undefined) {
      return;
    }
    event.preventDefault();
    this.activeChipIndex = nextIndex;
    this.focusChipDelete(nextIndex);
  }
}
