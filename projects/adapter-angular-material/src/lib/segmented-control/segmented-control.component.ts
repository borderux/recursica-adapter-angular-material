import { NgTemplateOutlet } from "@angular/common";
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren,
  ViewEncapsulation,
} from "@angular/core";
import { ControlValueAccessor } from "@angular/forms";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";
import {
  RecursicaValueAccessor,
  recursicaValueAccessorProvider,
} from "../utils/recursica-value-accessor";
import {
  RecursicaSegmentedControlData,
  RecursicaSegmentedControlItem,
  normalizeSegmentedControlItem,
} from "./segmented-control-item";

let nextId = 0;

/**
 * Recursica `SegmentedControl` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). The stub's
 * own `IMPLEMENTATION_NOTES.md` guessed `Category: EASY` with
 * `MatButtonToggleGroup`/`MatButtonToggle` as a strong conceptual match —
 * re-investigated against the real compiled source
 * (`node_modules/@angular/material/fesm2022/button-toggle.mjs`) before
 * writing any code, the same rigor every other Material candidate in this
 * adapter gets, and it doesn't survive contact:
 *
 * 1. **`MatButtonToggle` is `ViewEncapsulation.None`** (confirmed) with a
 *    fixed template of its own (`<button class="mat-button-toggle-button">`
 *    wrapping a `mat-pseudo-checkbox` selection indicator and
 *    `<ng-content>` for the label only) — the same category of
 *    "Material owns the DOM, this adapter only gets a content slot"
 *    finding that sank `MatTabGroup`/`MatSelect` elsewhere.
 * 2. **The real, decisive blocker**: the reference's own `SegmentedControl`
 *    (confirmed by reading `SegmentedControl.tsx`/`SegmentedControl.module.css`
 *    directly) renders a single animated `.indicator` element that slides
 *    and resizes to the active segment's own bounding box — not
 *    independent per-button background colors. `MatButtonToggle`'s
 *    selection model is exactly that: each toggle owns its own
 *    `.mat-button-toggle-checked` background independently, with no shared
 *    DOM node representing "the current selection" that could slide
 *    between siblings. No CSS-variable override on `MatButtonToggleGroup`
 *    can conjure a sliding indicator element that doesn't exist in its
 *    template.
 *
 * **Decision**: hand-built, a `role="radiogroup"` of `role="radio"`
 * buttons plus one absolutely-positioned `.indicator` div, matching the
 * reference's own real anatomy instead of the closest-sounding Material
 * name.
 *
 * ## The sliding indicator: measured via `offsetLeft`/`offsetWidth`, written as CSS custom properties
 *
 * `updateIndicator()` reads the active segment's own `<button>` element's
 * `offsetLeft`/`offsetTop`/`offsetWidth`/`offsetHeight` (relative to
 * `.root`, which is `position: relative` — the buttons' own `offsetParent`)
 * and writes them directly onto `.root` as
 * `--rec-segmented-control-indicator-{x,y,width,height}` custom
 * properties (`segmented-control.component.css`'s `.indicator` rule reads
 * them for its `transform`/`width`/`height`) — set imperatively via
 * `nativeElement.style.setProperty()` rather than an Angular
 * `[style.transform]` binding, since it's driven by a manual DOM
 * measurement, not template-bound component state. A CSS `transition` on
 * those same properties produces the slide animation. Recomputed on
 * `value` change, `ngAfterViewInit` (initial paint), and via a
 * `ResizeObserver` on `.root` (catches `fullWidth`/container-resize/
 * responsive reflow the way the reference's own Mantine implementation's
 * internal `ResizeObserver` does).
 *
 * ## Keyboard model: real ARIA radiogroup — roving tabindex, arrow keys change selection immediately
 *
 * Unlike `Dropdown`'s listbox (`aria-activedescendant`, DOM focus stays on
 * one trigger), a `role="radiogroup"` is a set of real, independently
 * focusable `role="radio"` elements per the W3C APG radio-group pattern:
 * only the checked (or, if none checked, first enabled) segment is a
 * `Tab` stop (`tabindex="0"`), every other segment is `tabindex="-1"`;
 * arrow keys move both focus *and* the selection to the next/previous
 * enabled segment immediately (no separate "confirm" keypress — this
 * matches real native `<input type="radio">` group behavior, which
 * `MatButtonToggleGroup`'s own single-selection mode also replicates, so
 * this is not a deviation from what `MatButtonToggleGroup` would have
 * provided, just hand-rolled instead of inherited).
 *
 * ## `data`: string shorthand or `{ value, label, icon, disabled }` — same shape as `Dropdown`'s
 *
 * `segmented-control-item.ts`'s `normalizeSegmentedControlItem` mirrors
 * `normalizeDropdownOption` exactly (`dropdown-option.ts`) — `icon` is a
 * `TemplateRef` instead of a `ReactNode`, the same Angular translation
 * `Dropdown`'s own `leadingIcon` uses.
 *
 * ## No value/defaultValue given: defaults to the first enabled item — matches the reference's own default
 *
 * Confirmed by reading `SegmentedControl.stories.tsx` directly: all 5
 * golden stories omit `value` entirely, yet the reference's own rendered
 * output always shows the first item selected (Mantine's `SegmentedControl`
 * auto-selects `data[0].value` when neither `value` nor `defaultValue` is
 * supplied) — reproduced here in `ngOnInit`'s uncontrolled-value seeding,
 * not left unselected.
 */
@Component({
  selector: "rec-segmented-control",
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./segmented-control.component.css",
  providers: [recursicaValueAccessorProvider(SegmentedControlComponent)],
  template: `
    <div
      #root
      class="root"
      role="radiogroup"
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
      [attr.data-orientation]="orientation"
      [attr.data-full-width]="fullWidth ? '' : null"
    >
      <div class="indicator" aria-hidden="true"></div>
      @for (item of normalizedData; track item.value; let i = $index) {
        <button
          #controlEl
          type="button"
          role="radio"
          class="control"
          [id]="controlId(i)"
          [attr.aria-checked]="item.value === currentValue ? 'true' : 'false'"
          [attr.data-active]="item.value === currentValue ? '' : null"
          [tabindex]="isRovingTabStop(item) ? 0 : -1"
          [disabled]="disabled || item.disabled"
          (click)="selectItem(item)"
          (keydown)="onKeydown($event, i)"
        >
          <span class="label">
            @if (item.icon) {
              <span class="icon">
                <ng-container [ngTemplateOutlet]="item.icon" />
              </span>
            }
            <span class="labelText">{{ item.label }}</span>
          </span>
        </button>
      }
    </div>
  `,
})
export class SegmentedControlComponent
  implements
    RecursicaOverStyled,
    ControlValueAccessor,
    OnInit,
    OnChanges,
    AfterViewInit,
    OnDestroy
{
  @Input() data: RecursicaSegmentedControlData = [];
  @Input() value?: string;
  @Output() valueChange = new EventEmitter<string>();

  @Input() orientation: "horizontal" | "vertical" = "horizontal";
  @Input() fullWidth = false;
  @Input() disabled = false;

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  @ViewChild("root") private readonly rootRef!: ElementRef<HTMLElement>;
  @ViewChildren("controlEl") private readonly controlEls!: QueryList<
    ElementRef<HTMLButtonElement>
  >;

  private readonly baseId = `rec-segmented-control-${nextId++}`;
  private _uncontrolledValue?: string;
  private resizeObserver?: ResizeObserver;

  private readonly cva = new RecursicaValueAccessor<string | undefined>();

  get normalizedData(): RecursicaSegmentedControlItem[] {
    return this.data.map(normalizeSegmentedControlItem);
  }

  get currentValue(): string | undefined {
    return this.value !== undefined ? this.value : this._uncontrolledValue;
  }

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }

  ngOnInit(): void {
    this._uncontrolledValue = this.firstEnabledValue();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["data"] && !changes["data"].firstChange) {
      queueMicrotask(() => this.updateIndicator());
    }
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.updateIndicator());
    this.controlEls.changes.subscribe(() =>
      queueMicrotask(() => this.updateIndicator()),
    );

    this.resizeObserver = new ResizeObserver(() => this.updateIndicator());
    this.resizeObserver.observe(this.rootRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  controlId(index: number): string {
    return `${this.baseId}-item-${index}`;
  }

  isRovingTabStop(item: RecursicaSegmentedControlItem): boolean {
    if (item.disabled || this.disabled) {
      return false;
    }
    if (this.currentValue !== undefined) {
      return item.value === this.currentValue;
    }
    return item.value === this.firstEnabledValue();
  }

  selectItem(item: RecursicaSegmentedControlItem): void {
    if (this.disabled || item.disabled || item.value === this.currentValue) {
      return;
    }
    if (this.value === undefined) {
      this._uncontrolledValue = item.value;
    }
    this.valueChange.emit(item.value);
    this.cva.notifyChange(item.value);
    this.cva.notifyTouched();
    queueMicrotask(() => this.updateIndicator());
  }

  writeValue(value: string | undefined): void {
    this.value = value;
  }

  registerOnChange(fn: (value: string | undefined) => void): void {
    this.cva.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.cva.registerOnTouched(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    if (this.disabled) {
      return;
    }
    const isHorizontal = this.orientation === "horizontal";
    const nextKey = isHorizontal ? "ArrowRight" : "ArrowDown";
    const prevKey = isHorizontal ? "ArrowLeft" : "ArrowUp";

    let targetIndex: number | null = null;
    switch (event.key) {
      case nextKey:
        targetIndex = this.nextEnabledIndex(index, 1);
        break;
      case prevKey:
        targetIndex = this.nextEnabledIndex(index, -1);
        break;
      case "Home":
        targetIndex = this.firstEnabledIndex();
        break;
      case "End":
        targetIndex = this.lastEnabledIndex();
        break;
      default:
        return;
    }

    event.preventDefault();
    if (targetIndex === null || targetIndex < 0) {
      return;
    }
    const data = this.normalizedData;
    this.selectItem(data[targetIndex]);
    this.controlEls.toArray()[targetIndex]?.nativeElement.focus();
  }

  private updateIndicator(): void {
    const data = this.normalizedData;
    const index = data.findIndex((item) => item.value === this.currentValue);
    const rootNativeEl = this.rootRef?.nativeElement;
    const activeEl = this.controlEls?.toArray()[index]?.nativeElement;
    if (!rootNativeEl || !activeEl) {
      return;
    }
    rootNativeEl.style.setProperty(
      "--rec-segmented-control-indicator-x",
      `${activeEl.offsetLeft}px`,
    );
    rootNativeEl.style.setProperty(
      "--rec-segmented-control-indicator-y",
      `${activeEl.offsetTop}px`,
    );
    rootNativeEl.style.setProperty(
      "--rec-segmented-control-indicator-width",
      `${activeEl.offsetWidth}px`,
    );
    rootNativeEl.style.setProperty(
      "--rec-segmented-control-indicator-height",
      `${activeEl.offsetHeight}px`,
    );
  }

  private firstEnabledIndex(): number {
    return this.normalizedData.findIndex((item) => !item.disabled);
  }

  private lastEnabledIndex(): number {
    const data = this.normalizedData;
    for (let i = data.length - 1; i >= 0; i--) {
      if (!data[i].disabled) return i;
    }
    return -1;
  }

  private firstEnabledValue(): string | undefined {
    const index = this.firstEnabledIndex();
    return index >= 0 ? this.normalizedData[index].value : undefined;
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
}
