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
import { RecursicaFileUploadItem, fileMatchesAccept } from "./file-input-item";

let nextId = 0;

/**
 * Recursica `FileInput` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). The stub's
 * own `IMPLEMENTATION_NOTES.md` already confirmed `Category: DOES NOT
 * EXIST` (no file-upload/file-input component anywhere in `@angular/material`
 * or `@angular/cdk`) — re-confirmed, not assumed. Full custom build on a
 * native `<input type="file" hidden>`, matching the reference's own
 * architecture (a `TextField`-shaped clickable/droppable control with a
 * hidden native file input behind it).
 *
 * ## Composes `FormControlWrapper` internally — matches the reference exactly
 *
 * Unlike `TextField`/`Dropdown` (which expose `RECURSICA_FORM_CONTROL` for
 * external composition), `FileInput`'s own reference renders
 * `<FormControlWrapper>` directly around its root `<div role="button">` —
 * confirmed by reading `FileInput.tsx`. `readOnly` here doesn't route
 * through `ReadOnlyField`/`WithReadOnlyWrapper` at all (unlike `TextArea`/
 * `NumberInput`/etc.) — the reference just renders the same chip-list UI
 * non-interactively (`interactive = !disabled && !readOnly`), so this
 * component does the same, no `RECURSICA_FORM_CONTROL`/`RECURSICA_FORM_CONTROL`
 * contract or read-only wrapper needed.
 *
 * ## Roving tabindex across chip delete icons — reuses `Chip`'s own escape hatch
 *
 * `ChipComponent`'s `deleteTabIndex` input is documented on the component
 * itself as "roving-tabindex escape hatch for a caller-managed chip group"
 * — exactly this use case. Only the active chip's delete icon is a real tab
 * stop; Left/Right/Up/Down move it, same as the reference's own
 * `activeChipIndex`/`deleteIconRefs` mechanism. Since `ChipComponent`
 * doesn't expose its internal delete-button `ElementRef` directly (nothing
 * else in this adapter needed that), focus is moved via
 * `nativeElement.querySelector('.deleteIcon')` against each chip host,
 * queried through `@ViewChildren` — `.deleteIcon` is real light DOM (not
 * Shadow DOM), so this is a legitimate, if slightly manual, way to reach
 * it from outside.
 *
 * ## `accept` re-validated on drop, not just relied on for the native picker
 *
 * `fileMatchesAccept` (`file-input-item.ts`) is a direct port of the
 * reference's own `@recursica/adapter-common` helper — the native `accept`
 * attribute only filters the file-picker *dialog*, never a `drop` event, so
 * without re-validating drops manually, `accept` would silently do nothing
 * for drag-and-drop.
 */
@Component({
  selector: "rec-file-input",
  imports: [
    NgTemplateOutlet,
    FormControlWrapperComponent,
    ChipComponent,
    ButtonComponent,
  ],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./file-input.component.css",
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
      [controlMaxWidth]="resolvedControlMaxWidth"
      [controlMinWidth]="resolvedControlMinWidth"
      [required]="required"
      [withAsterisk]="withAsterisk"
      (labelEditClick)="labelEditClick.emit($event)"
    >
      <div
        class="root"
        role="button"
        [id]="id"
        [attr.aria-label]="browseLabel"
        [attr.aria-disabled]="disabled ? 'true' : null"
        [attr.tabindex]="interactive ? 0 : -1"
        [attr.data-disabled]="disabled ? 'true' : null"
        [attr.data-readonly]="readOnly ? 'true' : null"
        [attr.data-error]="effectiveError ? 'true' : null"
        [attr.data-dragging]="isDragging ? 'true' : null"
        (click)="interactive && onRootClick($event)"
        (keydown)="interactive && onRootKeydown($event)"
        (dragenter)="interactive && onDragEnter($event)"
        (dragleave)="interactive && onDragLeave($event)"
        (dragover)="interactive && onDragOver($event)"
        (drop)="interactive && onDrop($event)"
      >
        <span class="leadingIcon" aria-hidden="true">
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

        <div class="content">
          @if (!hasFiles) {
            <span class="value" data-placeholder="true">{{ placeholder }}</span>
          }

          @if (hasFiles) {
            <div
              class="chipRow"
              role="group"
              aria-label="Selected files"
              (keydown)="!readOnly && onChipRowKeydown($event)"
            >
              @for (item of files; track itemId(item); let i = $index) {
                <span class="chipWrapper" #chipHost>
                  @if (readOnly) {
                    <rec-chip [checked]="false" [deleteTabIndex]="-1">{{
                      item.file.name
                    }}</rec-chip>
                  } @else {
                    <rec-chip
                      [checked]="false"
                      [deleteLabel]="removeFileLabel"
                      [deleteTabIndex]="i === activeChipIndex ? 0 : -1"
                      (remove)="onFileRemoveClick(itemId(item))"
                      >{{ item.file.name }}</rec-chip
                    >
                  }
                </span>
              }
            </div>
          }
        </div>

        @if (hasFiles && !readOnly) {
          <rec-button
            [overStyled]="true"
            variant="text"
            size="small"
            [iconOnly]="true"
            [icon]="clearIcon ?? defaultClearIcon"
            [attr.aria-label]="clearLabel"
            class="trailingIcon"
            [disabled]="disabled"
            (click)="onClearAllClick($event)"
          />
        }
        <ng-template #defaultClearIcon>
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
        </ng-template>

        <input
          #fileInputEl
          type="file"
          hidden
          [attr.accept]="accept ?? null"
          [multiple]="multiple"
          [disabled]="!interactive"
          (change)="onInputChange($event)"
        />
      </div>
    </rec-form-control-wrapper>
  `,
})
export class FileInputComponent implements RecursicaOverStyled, OnChanges {
  @Input() files: RecursicaFileUploadItem[] = [];
  @Output() filesAdded = new EventEmitter<File[]>();
  @Output() fileRemove = new EventEmitter<string>();
  @Output() filesRejected = new EventEmitter<File[]>();

  @Input() accept?: string;
  @Input() multiple = false;
  @Input() maxSize?: number;
  @Input() maxFiles?: number;

  @Input() disabled = false;
  @Input() readOnly = false;

  @Input() invalidFileTypeMessage = "File type not accepted";
  @Input() maxFilesMessage?: string;

  @Input() icon?: TemplateRef<unknown>;
  @Input() clearIcon?: TemplateRef<unknown>;

  @Input() placeholder = "Select a file...";
  @Input() browseLabel = "Choose file";
  @Input() removeFileLabel = "Remove";
  @Input() clearLabel = "Clear";

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

  private readonly baseId = `rec-file-input-${nextId++}`;
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

  get interactive(): boolean {
    return !this.disabled && !this.readOnly;
  }

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
    return (
      this.maxFilesMessage ??
      (this.multiple
        ? `Maximum of ${this.maxFiles} files allowed`
        : "Only one file is allowed")
    );
  }

  get resolvedControlMaxWidth(): string {
    return `var(--recursica_ui-kit_components_file-input_variants_layouts_${this.formLayout}_properties_max-width)`;
  }

  get resolvedControlMinWidth(): string {
    return `var(--recursica_ui-kit_components_file-input_variants_layouts_${this.formLayout}_properties_min-width)`;
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
    if (!this.interactive) {
      return;
    }
    this.fileInputRef?.nativeElement.click();
  }

  /**
   * The reference stops a chip/clear-button click from also opening the
   * file picker via `stopPropagation()` on each of those elements
   * individually. Doing the same here would mean adding click handlers to
   * `.chipWrapper`/`.chipRow` even though neither is itself an interactive
   * control — a real `@angular-eslint/template/interactive-supports-focus`
   * violation, not a style nag (those elements have no keyboard equivalent
   * for a "click" that only exists to swallow bubbling). Checking the
   * click's real target here instead reaches the same outcome without
   * attaching a handler to a non-interactive element.
   */
  onRootClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest(".chipRow, .trailingIcon")) {
      return;
    }
    this.openFilePicker();
  }

  onRootKeydown(event: KeyboardEvent): void {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    this.openFilePicker();
  }

  private handleFiles(incoming: FileList | File[]): void {
    if (!this.interactive) {
      return;
    }
    const list = Array.from(incoming);
    if (list.length === 0) {
      return;
    }

    const effectiveMaxFiles = this.multiple ? this.maxFiles : 1;
    const currentCount = this.multiple ? this.files.length : 0;

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
        effectiveMaxFiles !== undefined &&
        currentCount + accepted.length >= effectiveMaxFiles;
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
    if (!this.interactive) {
      return;
    }
    this.fileRemove.emit(id);
  }

  private clearAll(): void {
    if (!this.interactive || this.files.length === 0) {
      return;
    }
    for (const item of this.files) {
      this.fileRemove.emit(this.itemId(item));
    }
  }

  onClearAllClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.clearAll();
  }

  onChipRowKeydown(event: KeyboardEvent): void {
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
    event.stopPropagation();
    this.activeChipIndex = nextIndex;
    this.focusChipDelete(nextIndex);
  }
}
