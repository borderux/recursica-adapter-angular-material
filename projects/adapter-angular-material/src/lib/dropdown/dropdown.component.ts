import { NgTemplateOutlet } from "@angular/common";
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
  forwardRef,
} from "@angular/core";
import { ConnectedPosition, OverlayModule } from "@angular/cdk/overlay";
import { ControlValueAccessor } from "@angular/forms";
import {
  RECURSICA_FORM_CONTROL,
  RecursicaFormControl,
} from "../utils/recursica-form-control";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";
import {
  RecursicaValueAccessor,
  recursicaValueAccessorProvider,
} from "../utils/recursica-value-accessor";
import {
  RecursicaDropdownData,
  RecursicaDropdownOption,
  normalizeDropdownOption,
} from "./dropdown-option";

let nextId = 0;

/**
 * Recursica `Dropdown` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). The
 * step-9 stub guessed `MatSelect` as an EASY match — re-investigated
 * against the real compiled source
 * (`node_modules/@angular/material/fesm2022/select-module.mjs`) before
 * writing any code, the same rigor `Tabs`/`Stepper`/`Chip` already applied
 * to their own Material candidates, and it doesn't survive contact any
 * better than `MatTabGroup` did:
 *
 * 1. **`MatSelect` declares `encapsulation: ViewEncapsulation.None`**
 *    (confirmed: `args: [{ selector: 'mat-select', ..., encapsulation:
 *    ViewEncapsulation.None, ... }]`) and **builds its entire trigger DOM
 *    itself**, inside its own component view:
 *    ```html
 *    <div cdk-overlay-origin class="mat-mdc-select-trigger" (click)="open()" #trigger>
 *      <div class="mat-mdc-select-value" [attr.id]="_valueId"> ... </div>
 *      <div class="mat-mdc-select-arrow-wrapper"> ... </div>
 *    </div>
 *    ```
 *    There is no slot in that fixed template for Recursica's leading-icon
 *    `.section[data-position="left"]` or its own `.clearButton` — the only
 *    customization point is `<mat-select-trigger>` (`MatSelectTrigger`,
 *    `MAT_SELECT_TRIGGER`), which replaces `.mat-mdc-select-value-text`
 *    only, leaving the rest of the fixed trigger div (and its lack of a
 *    left-icon slot) untouched. Same structural blocker as `Tabs.md`'s
 *    `MatTabGroup` finding — a Material component's own
 *    `ViewEncapsulation.None` template owning DOM this adapter has no way
 *    to reshape from outside.
 * 2. **The options panel has the identical problem, twice over.** The
 *    panel (`.mat-mdc-select-panel`) renders via the same `<ng-template
 *    cdk-connected-overlay>` pattern this component itself now uses — but
 *    because it's declared inside *`MatSelect`'s own* `ViewEncapsulation.None`
 *    template, the panel content is `<ng-content></ng-content>` (i.e.
 *    projected `<mat-option>` elements), not markup this adapter controls,
 *    so `leadingIcon`/`supportingText` rich-option content would have to be
 *    smuggled through `MatOption`'s own single-slot content projection —
 *    workable for plain text, not for the "icon left of a two-line label"
 *    shape `Dropdown.module.css`'s `.optionContent` expects.
 * 3. **Value/selection model mismatch**: `MatSelect` derives its trigger
 *    text from `MatOption.viewValue` (`ContentChildren(MatOption)`, each
 *    option's own rendered text content) via `_getTriggerValue()`, not
 *    from a declarative `data: RecursicaDropdownOption[]` array the way
 *    Recursica's own `Dropdown` (mirroring the genesis adapter's Mantine
 *    `Select`) expects — every consumer would need to hand-generate
 *    `<mat-option>` elements from `data` anyway, at which point `MatSelect`
 *    contributes little beyond `ControlValueAccessor` wiring this component
 *    doesn't need either (Recursica's own `value`/`(valueChange)` contract,
 *    matching `Tabs`' identical reasoning for skipping `MatTabGroup`'s
 *    `selectedIndex` model).
 *
 * **Decision**: build `Dropdown` directly on `@angular/cdk/overlay`'s
 * `CdkConnectedOverlay`/`CdkOverlayOrigin` — the same underlying primitive
 * `MatSelect`/`MatMenu` are themselves built on, just without either
 * component's own fixed template wrapped around it. This is "the same
 * category as Menu" (per the task brief) in the sense that both are
 * CDK-Overlay-backed dropdown panels, but concretely different from
 * `Menu`'s own approach: `Menu` wraps the *complete* `MatMenu` component
 * (a good fit for its action-list semantics); `Dropdown` needed a listbox/
 * combobox selection model `MatMenu`/`MatMenuItem` don't have either
 * (`MatMenuItem` is action-oriented — `(click)` handlers, no `aria-selected`/
 * value concept), so it goes one level lower, straight to the overlay
 * primitive.
 *
 * ## `dropdown-overlay.css`: a global stylesheet is needed after all — initial theory was wrong, corrected live
 *
 * The first draft of this component assumed that because `<ng-template
 * cdkConnectedOverlay>` (below) is declared directly inside
 * `DropdownComponent`'s own template, the `.dropdown`/`.option` elements it
 * stamps via `@for` would carry `DropdownComponent`'s own
 * `_ngcontent-<hash>` attribute even after CDK Overlay reparents them into
 * `cdk-overlay-container` — i.e. that normal `Emulated`-scoped CSS in
 * `dropdown.component.css` would just reach the panel, no
 * `menu-overlay.css`/`tooltip-overlay.css`-style global stylesheet needed.
 *
 * **This was wrong, confirmed live** (Playwright + DOM inspection against
 * a real running Storybook, the same "verify live, don't just trust the
 * mechanism" standard `Tabs`' `:host-context()` claims and `Menu`'s
 * `menu-item.component.ts` both already applied): opening the panel and
 * reading real attributes off `.root` vs `.dropdown` showed **two
 * different** `_ngcontent-*` values (e.g. `_ngcontent-ng-c4119835729` on
 * `.root`, `_ngcontent-ng-c770600461` on `.dropdown`/`.option`) — not the
 * same one. The panel rendered with zero token styling as a result: no
 * border/background/padding, browser-default serif text, overlapping the
 * assistive text beneath the trigger. Root cause not fully isolated (best
 * guess: `CdkConnectedOverlay`'s `TemplatePortal` attaches via a
 * `ViewContainerRef`/injector path that produces a distinct Angular view
 * context from `DropdownComponent`'s own for encapsulation-hashing
 * purposes, even though the `<ng-template>` is lexically declared inside
 * this component's template) — but the empirical result is unambiguous
 * regardless of the exact mechanism, so this is documented as a confirmed
 * finding, not a theory.
 *
 * **Fix**: same pattern as `Menu`/`Tooltip` after all — `.dropdown`/
 * `.option`/etc. styling moved to `dropdown-overlay.css`, a real global
 * stylesheet a consuming app imports once (see `SETUP.md`), scoped under
 * a dedicated `.rec-dropdown-panel` class (added directly on the panel
 * `<div>` alongside `.dropdown`, the same "extra guard class" convention
 * `.rec-menu`/`.rec-tooltip` use) and gated behind
 * `[data-recursica-theme]`. `dropdown.component.css` keeps only the
 * trigger (`.root`/`.input`/`.section`/`.clearButton`/`.chevron` and
 * focus/error/disabled state) — that part *is* reachable by normal scoped
 * CSS (confirmed by the same DOM inspection: `.root` carries
 * `DropdownComponent`'s own attribute, and the trigger renders correctly
 * styled in every screenshot), since it's rendered directly in this
 * component's own template, never through the overlay portal.
 *
 * ## Keyboard model: `aria-activedescendant`, not real DOM focus moves
 *
 * Matches the W3C "select-only combobox" pattern (and the genesis adapter's
 * own Mantine `Combobox` engine underneath `Select`): DOM focus stays on
 * the trigger button (`role="combobox"`) the entire time the panel is
 * open; `highlightedIndex` drives `aria-activedescendant` pointing at the
 * highlighted `.option`'s `id`, and arrow keys/Home/End/type-ahead only
 * move that index, never call `.focus()` on an option element. This is
 * simpler and more robust than a `FocusKeyManager`/`ActiveDescendantKeyManager`
 * over content children (`Tabs`' approach) because the options here are
 * this component's *own* `@for`-generated view children, not projected
 * content — plain index arithmetic over the already-known `normalizedData`
 * array is enough, no CDK key-manager query needed.
 *
 * ## `RECURSICA_FORM_CONTROL`: composed like a real field, not internally
 *
 * Unlike the genesis adapter's `Dropdown.tsx` (which renders its own
 * `FormControlWrapper` internally, flattening `label`/`error`/etc. onto
 * `Dropdown`'s own prop surface), this component does **not** wrap
 * `FormControlWrapperComponent` itself — it provides itself under
 * `RECURSICA_FORM_CONTROL` and is meant to be composed the same way
 * `form-control-wrapper.stories.ts`'s own demo control is: the caller
 * writes `<rec-form-control-wrapper><rec-dropdown ...></rec-dropdown></rec-form-control-wrapper>`.
 * This is the Angular-native shape `FormControlWrapper`'s own
 * `ContentChild(RECURSICA_FORM_CONTROL)` mechanism was built for (see
 * `form-control-wrapper/IMPLEMENTATION_NOTES.md`) — there is no
 * `React.cloneElement()` equivalent to flatten the two components into one
 * the way the React reference does.
 *
 * ## Known gap: `readOnly`/static variants approximate `ReadOnlyField`, which doesn't exist yet
 *
 * See IMPLEMENTATION_NOTES.md's "ReadOnlyField gap" section.
 */
@Component({
  selector: "rec-dropdown",
  imports: [OverlayModule, NgTemplateOutlet],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./dropdown.component.css",
  providers: [
    {
      provide: RECURSICA_FORM_CONTROL,
      useExisting: forwardRef(() => DropdownComponent),
    },
    recursicaValueAccessorProvider(DropdownComponent),
  ],
  template: `
    <div
      class="root"
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
      [attr.data-with-left-section]="leftSection ? '' : null"
      [attr.data-with-right-section]="readOnly ? null : ''"
      [attr.data-disabled]="disabled ? '' : null"
      [attr.data-error]="error ? '' : null"
    >
      @if (readOnly) {
        <!--
          Simplified read-only approximation — no real ReadOnlyField/
          WithReadOnlyWrapper yet (see IMPLEMENTATION_NOTES.md's
          "ReadOnlyField gap" section). Plain static text using the same
          .input token-driven look, no interactivity at all.
        -->
        <div
          class="input readOnlyDisplay"
          [id]="id"
          aria-readonly="true"
          [attr.aria-describedby]="describedByAttr"
        >
          @if (leftSection) {
            <span class="section" data-position="left">
              <ng-container [ngTemplateOutlet]="leftSection" />
            </span>
          }
          <span class="valueText">
            @if (selectedOption) {
              {{ selectedOption.label }}
            } @else {
              <span class="placeholder">{{ placeholder }}</span>
            }
          </span>
        </div>
      } @else {
        <button
          #trigger
          cdkOverlayOrigin
          #origin="cdkOverlayOrigin"
          type="button"
          class="input"
          [id]="id"
          role="combobox"
          aria-haspopup="listbox"
          [attr.aria-expanded]="isOpen"
          [attr.aria-controls]="isOpen ? panelId : null"
          [attr.aria-activedescendant]="activeDescendantId"
          [attr.aria-required]="required ? 'true' : null"
          [attr.aria-describedby]="describedByAttr"
          [disabled]="disabled"
          (click)="toggle()"
          (keydown)="onTriggerKeydown($event)"
        >
          @if (leftSection) {
            <span class="section" data-position="left">
              <ng-container [ngTemplateOutlet]="leftSection" />
            </span>
          }
          <span class="valueText">
            @if (selectedOption) {
              {{ selectedOption.label }}
            } @else {
              <span class="placeholder">{{ placeholder }}</span>
            }
          </span>
          <span class="section" data-position="right">
            @if (clearable && selectedOption && !disabled) {
              <span
                class="clearButton"
                role="button"
                tabindex="0"
                aria-label="Clear selection"
                (click)="clear($event)"
                (keydown)="onClearKeydown($event)"
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
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </span>
            }
            <span
              class="chevron"
              [attr.data-open]="isOpen ? '' : null"
              aria-hidden="true"
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
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          </span>
        </button>

        <ng-template
          cdkConnectedOverlay
          [cdkConnectedOverlayOrigin]="origin"
          [cdkConnectedOverlayOpen]="isOpen"
          [cdkConnectedOverlayPositions]="positions"
          [cdkConnectedOverlayWidth]="overlayWidth"
          [cdkConnectedOverlayHasBackdrop]="true"
          cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
          (backdropClick)="close()"
          (detach)="close()"
          (overlayOutsideClick)="close()"
        >
          <div
            class="dropdown rec-dropdown-panel"
            role="listbox"
            [id]="panelId"
          >
            @for (opt of normalizedData; track opt.value; let i = $index) {
              <div
                class="option"
                role="option"
                tabindex="-1"
                [id]="optionId(i)"
                [attr.aria-selected]="opt.value === value ? 'true' : 'false'"
                [attr.aria-disabled]="opt.disabled ? 'true' : null"
                [attr.data-selected]="opt.value === value ? 'true' : null"
                [attr.data-hovered]="
                  i === highlightedIndex && !opt.disabled ? 'true' : null
                "
                [attr.data-disabled]="opt.disabled ? '' : null"
                (mouseenter)="!opt.disabled && setHighlighted(i)"
                (click)="selectOption(opt)"
                (keydown)="onOptionKeydown($event, opt)"
              >
                <span class="optionContent">
                  @if (opt.leadingIcon) {
                    <span class="optionIcon">
                      <ng-container [ngTemplateOutlet]="opt.leadingIcon" />
                    </span>
                  }
                  <span
                    class="optionText"
                    [class.optionTextWrap]="wrapItemText"
                  >
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
      }
    </div>
  `,
})
export class DropdownComponent
  implements
    RecursicaFormControl,
    RecursicaOverStyled,
    ControlValueAccessor,
    AfterViewInit,
    OnDestroy
{
  @Input() data: RecursicaDropdownData = [];
  @Input() value: string | null = null;
  @Output() valueChange = new EventEmitter<string | null>();

  @Input() placeholder?: string;
  @Input() disabled = false;
  @Input() required = false;
  @Input() clearable = false;
  @Input() wrapItemText = false;

  /**
   * Visual-only error state (mirrors `BareDropdown`'s own boolean `error`
   * prop) — the error *message* is `FormControlWrapper`'s concern, not
   * this component's; see this class's doc comment for why the two
   * compose as siblings, not one flattened component.
   */
  @Input() error = false;

  /**
   * Simplified read-only display — see class doc comment's "Known gap"
   * section and IMPLEMENTATION_NOTES.md. Not real `ReadOnlyField` parity.
   */
  @Input() readOnly = false;

  @Input() leftSection?: TemplateRef<unknown>;

  /**
   * Storybook/visual-regression-only escape hatch — forces the panel open
   * on init so a static screenshot can capture it without a real click
   * (mirrors the *intent* of the genesis adapter's own
   * `RichOptionRowPreview` story, which bypasses the portal entirely for
   * screenshot stability; this keeps the real overlay code path instead of
   * a fake preview markup duplicate). **Not** part of the Recursica
   * `Dropdown` props contract — never referenced outside this component's
   * own stories. See IMPLEMENTATION_NOTES.md.
   */
  @Input() debugForceOpen = false;

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  @Output() opened = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  @ViewChild("trigger")
  private readonly triggerRef?: ElementRef<HTMLButtonElement>;

  private readonly baseId = `rec-dropdown-${nextId++}`;
  @Input() id = this.baseId;
  readonly panelId = `${this.baseId}-panel`;

  private readonly cva = new RecursicaValueAccessor<string | null>();

  private describedByIds: string[] = [];

  isOpen = false;
  highlightedIndex = -1;
  overlayWidth: number = 0;

  private typeaheadBuffer = "";
  private typeaheadTimeout?: ReturnType<typeof setTimeout>;

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

  get normalizedData(): RecursicaDropdownOption[] {
    return this.data.map(normalizeDropdownOption);
  }

  get selectedOption(): RecursicaDropdownOption | undefined {
    if (this.value == null) return undefined;
    return this.normalizedData.find((opt) => opt.value === this.value);
  }

  get describedByAttr(): string | null {
    return this.describedByIds.length ? this.describedByIds.join(" ") : null;
  }

  get activeDescendantId(): string | null {
    if (!this.isOpen || this.highlightedIndex < 0) return null;
    return this.optionId(this.highlightedIndex);
  }

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }

  optionId(index: number): string {
    return `${this.panelId}-option-${index}`;
  }

  setDescribedByIds(ids: string[]): void {
    this.describedByIds = ids;
  }

  toggle(): void {
    if (this.disabled) return;
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open(): void {
    if (this.disabled || this.isOpen) return;
    this.overlayWidth = this.triggerRef?.nativeElement.offsetWidth ?? 0;
    const data = this.normalizedData;
    const currentIndex = data.findIndex((opt) => opt.value === this.value);
    this.highlightedIndex =
      currentIndex >= 0 ? currentIndex : this.firstEnabledIndex();
    this.isOpen = true;
    this.opened.emit();
  }

  close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.highlightedIndex = -1;
    this.closed.emit();
    this.cva.notifyTouched();
  }

  writeValue(value: string | null): void {
    this.value = value;
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.cva.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.cva.registerOnTouched(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  clear(event: Event): void {
    event.stopPropagation();
    if (this.disabled) return;
    this.value = null;
    this.valueChange.emit(null);
    this.cva.notifyChange(null);
  }

  /**
   * The clear "button" is a `<span role="button">`, not a real
   * `<button>` — real interactive-content HTML forbids nesting a
   * `<button>` inside `DropdownComponent`'s own trigger `<button
   * class="input">`. Keyboard support (Enter/Space) is hand-rolled to
   * compensate, with `stopPropagation()` so it never also bubbles into
   * `onTriggerKeydown()` (which would otherwise interpret the same
   * keypress as "open the panel").
   */
  onClearKeydown(event: KeyboardEvent): void {
    event.stopPropagation();
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.clear(event);
    }
  }

  setHighlighted(index: number): void {
    this.highlightedIndex = index;
  }

  selectOption(opt: RecursicaDropdownOption): void {
    if (opt.disabled) return;
    this.value = opt.value;
    this.valueChange.emit(opt.value);
    this.cva.notifyChange(opt.value);
    this.close();
    this.triggerRef?.nativeElement.focus();
  }

  /**
   * `tabindex="-1"` on `.option` (template, above) makes each option
   * script-focusable but never a real `Tab` stop — by design, DOM focus
   * never leaves the trigger button (see this class's doc comment's
   * "Keyboard model" section). This handler exists so the option's own
   * `(click)` isn't the *only* way to activate it (satisfies
   * `@angular-eslint/template/click-events-have-key-events`), covering the
   * case where something external (e.g. assistive tech) does move focus
   * here directly — real keyboard users select via `onTriggerKeydown()`'s
   * `Enter`/`Space` while focus stays on the trigger, which is the
   * primary, tested path.
   */
  onOptionKeydown(event: KeyboardEvent, opt: RecursicaDropdownOption): void {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.selectOption(opt);
    }
  }

  private firstEnabledIndex(): number {
    return this.normalizedData.findIndex((opt) => !opt.disabled);
  }

  private lastEnabledIndex(): number {
    const data = this.normalizedData;
    for (let i = data.length - 1; i >= 0; i--) {
      if (!data[i].disabled) return i;
    }
    return -1;
  }

  private nextEnabledIndex(from: number, dir: 1 | -1): number {
    const data = this.normalizedData;
    if (!data.length) return -1;
    let i = from;
    for (let step = 0; step < data.length; step++) {
      i = (i + dir + data.length) % data.length;
      if (!data[i].disabled) return i;
    }
    return from;
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (this.disabled) return;

    if (!this.isOpen) {
      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        this.open();
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        this.highlightedIndex = this.nextEnabledIndex(this.highlightedIndex, 1);
        return;
      case "ArrowUp":
        event.preventDefault();
        this.highlightedIndex = this.nextEnabledIndex(
          this.highlightedIndex,
          -1,
        );
        return;
      case "Home":
        event.preventDefault();
        this.highlightedIndex = this.firstEnabledIndex();
        return;
      case "End":
        event.preventDefault();
        this.highlightedIndex = this.lastEnabledIndex();
        return;
      case "Enter":
      case " ": {
        event.preventDefault();
        const opt = this.normalizedData[this.highlightedIndex];
        if (opt) this.selectOption(opt);
        return;
      }
      case "Escape":
        event.preventDefault();
        this.close();
        return;
      case "Tab":
        this.close();
        return;
      default:
        if (
          event.key.length === 1 &&
          !event.altKey &&
          !event.ctrlKey &&
          !event.metaKey
        ) {
          this.handleTypeahead(event.key);
        }
        return;
    }
  }

  private handleTypeahead(char: string): void {
    this.typeaheadBuffer += char.toLowerCase();
    if (this.typeaheadTimeout) clearTimeout(this.typeaheadTimeout);
    this.typeaheadTimeout = setTimeout(() => {
      this.typeaheadBuffer = "";
    }, 500);

    const data = this.normalizedData;
    if (!data.length) return;
    const startIndex = (this.highlightedIndex + 1) % data.length;
    for (let step = 0; step < data.length; step++) {
      const i = (startIndex + step) % data.length;
      const opt = data[i];
      if (
        !opt.disabled &&
        (opt.label ?? "").toLowerCase().startsWith(this.typeaheadBuffer)
      ) {
        this.highlightedIndex = i;
        return;
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.debugForceOpen) {
      // Deferred one tick so `triggerRef` is fully settled before `open()` reads its width.
      Promise.resolve().then(() => this.open());
    }
  }

  ngOnDestroy(): void {
    if (this.typeaheadTimeout) clearTimeout(this.typeaheadTimeout);
  }
}
