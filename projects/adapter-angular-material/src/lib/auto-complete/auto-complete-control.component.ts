import { NgTemplateOutlet } from "@angular/common";
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
  forwardRef,
} from "@angular/core";
import { ConnectedPosition, OverlayModule } from "@angular/cdk/overlay";
import {
  RecursicaDropdownData,
  RecursicaDropdownOption,
  normalizeDropdownOption,
} from "../dropdown/dropdown-option";
import {
  RECURSICA_FORM_CONTROL,
  RecursicaFormControl,
} from "../utils/recursica-form-control";

let nextId = 0;

/**
 * Internal free-text `<input>` + suggestions-panel primitive backing
 * `rec-auto-complete` — same two-tier split as `TextArea`/`NumberInput`/
 * `DatePicker`/`TimePicker` (see `text-area-control.component.ts`'s own doc
 * comment for why `RECURSICA_FORM_CONTROL` has to live on a node *inside*
 * `rec-with-read-only-wrapper`'s projected `activeTemplate`).
 *
 * ## `MatAutocomplete`/`MatAutocompleteTrigger` investigated and rejected
 *
 * The stub's own `IMPLEMENTATION_NOTES.md` flagged `MatAutocomplete` as a
 * real candidate — re-confirmed against the compiled source before
 * building, same rigor as every adoption/rejection call in this adapter:
 * `MatAutocomplete` (the panel component) declares
 * `encapsulation: ViewEncapsulation.None` and renders via CDK Overlay,
 * identical structural shape to `MatSelect`, the primitive `Dropdown`
 * already rejected for the same reason (see `dropdown.component.ts`'s own
 * class doc comment, points 1–2: fixed panel content model via
 * `ContentChildren(MatOption)`, no slot for `Dropdown.module.css`'s
 * "icon + two-line label" rich-option shape). Same call made here, for the
 * same reason: build directly on `@angular/cdk/overlay`'s
 * `CdkConnectedOverlay`/`CdkOverlayOrigin` instead — the primitive
 * `MatAutocomplete` itself is built on, without its fixed template.
 *
 * ## Shares `Dropdown`'s option data model and overlay architecture directly
 *
 * `RecursicaDropdownOption`/`RecursicaDropdownData`/`normalizeDropdownOption`
 * are imported from `../dropdown/dropdown-option` rather than duplicated —
 * the genesis reference's own `AutoComplete.tsx` and `Dropdown.tsx` share a
 * single `RecursicaComboboxItem` type from `@recursica/adapter-common` for
 * exactly this reason (confirmed by reading both files: identical
 * `value`/`label`/`leadingIcon`/`supportingText` shape). This adapter has no
 * shared-utils equivalent package, so reusing `Dropdown`'s own type file
 * directly avoids duplicating it — a real, minor architectural wrinkle
 * (`AutoComplete` now has a source-level dependency on `Dropdown`'s own
 * folder) worth flagging honestly rather than hiding by silently
 * duplicating the type instead. Moving it to a shared location would be a
 * larger refactor touching an already-shipped component, out of scope here.
 *
 * The overlay panel itself is architecturally identical to `Dropdown`'s own
 * (same live-verified finding: a `<ng-template cdkConnectedOverlay>`
 * declared in this component's template still gets a different
 * `_ngcontent-*` attribute once CDK Overlay reparents it — see
 * `dropdown.component.ts`'s own "a global stylesheet is needed after all"
 * section) — `auto-complete-overlay.css` follows the identical pattern as
 * `dropdown-overlay.css`, just under its own `.rec-autocomplete-panel`
 * marker class and `autocomplete`-prefixed panel tokens.
 *
 * ## Real difference from `Dropdown`: a free-text `<input>`, not a `<button>` trigger
 *
 * `Dropdown` is a closed-set *select* (trigger is a button, value must be
 * one of `data`'s entries). `AutoComplete` is free text that happens to
 * suggest matches — the trigger is a real, always-editable `<input>`, and
 * `value` is never constrained to match any option. Consequences:
 *
 * - **Filtering**: `filteredOptions` is a case-insensitive "label contains
 *   the current typed value" filter over `data`, computed on every
 *   keystroke — matching the reference's own default Mantine `Combobox`
 *   filter behavior (no golden story or the reference's own
 *   `AUTOCOMPLETE_IMPLEMENTATION_NOTES.md` calls for a different one, e.g.
 *   "starts with").
 * - **Selection sets `value` to the option's `label`, not its `value` key**
 *   — this is a text field, not an enum picker; typing "Jane" and picking
 *   the "Jane Doe" rich option should leave "Jane Doe" typed in the field,
 *   the same way selecting a plain string option leaves that string typed.
 * - **`(mousedown)`, not `(click)`, on each option, with `preventDefault()`**:
 *   a real correctness detail, not a style choice — `<input>` is focusable
 *   and this component closes the panel on `(blur)`; without `preventDefault()`
 *   on `mousedown`, the input would blur (and the panel would close) before
 *   the subsequent `click` event ever fires, so a mouse click on an option
 *   would silently do nothing. `Dropdown` doesn't have this problem (its
 *   trigger is a `<button>`, no separate blur-driven close path competing
 *   with option clicks).
 * - **Opens on focus**, not just on a click/keydown — conventional
 *   autocomplete UX shows suggestions as soon as the field is focused, even
 *   before typing (`Dropdown`'s own click-to-open-a-closed-list model
 *   doesn't need this).
 */
@Component({
  selector: "rec-auto-complete-control",
  imports: [OverlayModule, NgTemplateOutlet],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./auto-complete.component.css",
  providers: [
    {
      provide: RECURSICA_FORM_CONTROL,
      useExisting: forwardRef(() => AutoCompleteControlComponent),
    },
  ],
  template: `
    <div
      class="root"
      [attr.data-with-left-section]="leftSection ? '' : null"
      [attr.data-with-right-section]="rightSection ? '' : null"
      [attr.data-disabled]="disabled ? '' : null"
      [attr.data-error]="error ? '' : null"
    >
      @if (leftSection) {
        <span class="section" data-position="left">
          <ng-container [ngTemplateOutlet]="leftSection" />
        </span>
      }
      <input
        #trigger
        cdkOverlayOrigin
        #origin="cdkOverlayOrigin"
        type="text"
        class="input"
        [id]="id"
        role="combobox"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        [attr.aria-expanded]="isOpen && filteredOptions.length > 0"
        [attr.aria-controls]="
          isOpen && filteredOptions.length > 0 ? panelId : null
        "
        [attr.aria-activedescendant]="activeDescendantId"
        [attr.aria-describedby]="describedByAttr"
        [placeholder]="placeholder ?? ''"
        [disabled]="disabled"
        [required]="required"
        [attr.name]="name ?? null"
        [value]="value ?? ''"
        (input)="onInput($event)"
        (focus)="onFocus()"
        (blur)="close()"
        (keydown)="onKeydown($event)"
      />
      @if (rightSection) {
        <span class="section" data-position="right">
          <ng-container [ngTemplateOutlet]="rightSection" />
        </span>
      }

      <ng-template
        cdkConnectedOverlay
        [cdkConnectedOverlayOrigin]="origin"
        [cdkConnectedOverlayOpen]="isOpen && filteredOptions.length > 0"
        [cdkConnectedOverlayPositions]="positions"
        [cdkConnectedOverlayWidth]="overlayWidth"
        [cdkConnectedOverlayHasBackdrop]="false"
      >
        <div
          class="dropdown rec-autocomplete-panel"
          role="listbox"
          [id]="panelId"
        >
          @for (opt of filteredOptions; track opt.value; let i = $index) {
            <div
              class="option"
              role="option"
              tabindex="-1"
              [id]="optionId(i)"
              [attr.aria-selected]="opt.label === value ? 'true' : 'false'"
              [attr.data-active]="opt.label === value ? 'true' : null"
              [attr.data-hovered]="i === highlightedIndex ? 'true' : null"
              (mouseenter)="setHighlighted(i)"
              (mousedown)="onOptionMousedown($event, opt)"
            >
              <span class="optionContent">
                @if (opt.leadingIcon) {
                  <span class="optionIcon">
                    <ng-container [ngTemplateOutlet]="opt.leadingIcon" />
                  </span>
                }
                <span class="optionText" [class.optionTextWrap]="wrapItemText">
                  <span class="optionLabel">{{ opt.label }}</span>
                  @if (opt.supportingText) {
                    <span class="optionSupportingText">{{
                      opt.supportingText
                    }}</span>
                  }
                </span>
              </span>
            </div>
          }
        </div>
      </ng-template>
    </div>
  `,
})
export class AutoCompleteControlComponent implements RecursicaFormControl {
  @Input() data: RecursicaDropdownData = [];
  @Input() value?: string;
  @Output() valueChange = new EventEmitter<string | undefined>();

  @Input() placeholder?: string;
  @Input() name?: string;
  @Input() disabled = false;
  @Input() required = false;
  @Input() error = false;
  @Input() wrapItemText = false;

  @Input() leftSection?: TemplateRef<unknown>;
  @Input() rightSection?: TemplateRef<unknown>;

  @ViewChild("trigger")
  private readonly triggerRef?: ElementRef<HTMLInputElement>;

  private readonly baseId = `rec-auto-complete-${nextId++}`;
  private _id?: string;

  @Input()
  set id(value: string | undefined) {
    this._id = value;
  }
  get id(): string {
    return this._id ?? this.baseId;
  }

  readonly panelId = `${this.baseId}-panel`;

  isOpen = false;
  highlightedIndex = -1;
  overlayWidth = 0;

  private describedByIds: string[] = [];

  readonly positions: ConnectedPosition[] = [
    {
      originX: "start",
      originY: "bottom",
      overlayX: "start",
      overlayY: "top",
      offsetY: 4,
    },
    {
      originX: "start",
      originY: "top",
      overlayX: "start",
      overlayY: "bottom",
      offsetY: -4,
    },
  ];

  get describedByAttr(): string | null {
    return this.describedByIds.length ? this.describedByIds.join(" ") : null;
  }

  get filteredOptions(): RecursicaDropdownOption[] {
    const all = this.data.map(normalizeDropdownOption);
    const query = (this.value ?? "").trim().toLowerCase();
    if (!query) {
      return all;
    }
    return all.filter((opt) => (opt.label ?? "").toLowerCase().includes(query));
  }

  get activeDescendantId(): string | null {
    if (!this.isOpen || this.highlightedIndex < 0) {
      return null;
    }
    return this.optionId(this.highlightedIndex);
  }

  optionId(index: number): string {
    return `${this.panelId}-option-${index}`;
  }

  setDescribedByIds(ids: string[]): void {
    this.describedByIds = ids;
  }

  setHighlighted(index: number): void {
    this.highlightedIndex = index;
  }

  onFocus(): void {
    if (this.disabled) {
      return;
    }
    this.overlayWidth = this.triggerRef?.nativeElement.offsetWidth ?? 0;
    this.highlightedIndex = -1;
    this.isOpen = true;
  }

  close(): void {
    this.isOpen = false;
    this.highlightedIndex = -1;
  }

  onInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value;
    this.overlayWidth = this.triggerRef?.nativeElement.offsetWidth ?? 0;
    this.highlightedIndex = -1;
    this.isOpen = true;
    this.valueChange.emit(next);
  }

  /**
   * `mousedown`, not `click` — see this class's doc comment's "Real
   * difference from `Dropdown`" section. `preventDefault()` stops the input
   * from ever blurring for this interaction, so `close()` (bound to
   * `(blur)`) never fires before `selectOption` runs.
   */
  onOptionMousedown(event: MouseEvent, opt: RecursicaDropdownOption): void {
    event.preventDefault();
    this.selectOption(opt);
  }

  selectOption(opt: RecursicaDropdownOption): void {
    this.value = opt.label;
    this.valueChange.emit(opt.label);
    this.close();
    this.triggerRef?.nativeElement.focus();
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.disabled) {
      return;
    }

    if (!this.isOpen) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        this.onFocus();
      }
      return;
    }

    const options = this.filteredOptions;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (options.length) {
          this.highlightedIndex =
            (this.highlightedIndex + 1 + options.length) % options.length;
        }
        return;
      case "ArrowUp":
        event.preventDefault();
        if (options.length) {
          this.highlightedIndex =
            (this.highlightedIndex - 1 + options.length) % options.length;
        }
        return;
      case "Enter": {
        const opt = options[this.highlightedIndex];
        if (opt) {
          event.preventDefault();
          this.selectOption(opt);
        }
        return;
      }
      case "Escape":
        event.preventDefault();
        this.close();
        return;
      default:
        return;
    }
  }
}
