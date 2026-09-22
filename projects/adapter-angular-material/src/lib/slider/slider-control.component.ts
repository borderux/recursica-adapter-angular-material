import { NgTemplateOutlet } from "@angular/common";
import {
  Component,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  ViewEncapsulation,
  forwardRef,
} from "@angular/core";
import {
  RECURSICA_FORM_CONTROL,
  RecursicaFormControl,
} from "../utils/recursica-form-control";

let nextId = 0;

export interface RecursicaSliderMark {
  value: number;
  label?: string;
}

export type RecursicaSliderValue = number | [number, number];

/**
 * Internal slider primitive backing `rec-slider` — same two-tier split as
 * `NumberInput`/`NumberInputControlComponent` (see that component's own
 * doc comment for why the `RECURSICA_FORM_CONTROL` provider has to live on
 * a node *inside* `rec-with-read-only-wrapper`'s projected `activeTemplate`,
 * not the outer public component).
 *
 * ## `mat-slider` investigated and rejected — real track/thumb/mark visual model mismatch
 *
 * The stub's own `IMPLEMENTATION_NOTES.md` guessed `Category: EASY–REQUIRES
 * WORK` with `MatSlider`/`MatSliderThumb`/`MatSliderRangeThumb` as the
 * candidate. Re-investigated against the compiled source
 * (`node_modules/@angular/material/fesm2022/slider.mjs`): `mat-slider`
 * (the container) is `ViewEncapsulation.None` with a fixed internal
 * template (track segments, MDC tick-mark dots, a fixed value-indicator
 * bubble) — while `input[matSliderThumb]`/`input[matSliderStartThumb]`/
 * `input[matSliderEndThumb]` are themselves real bare directives on a
 * native `<input type="range">` (confirmed: `host: { attributes: { type:
 * 'range' } }`), the surrounding `mat-slider` chrome owns the track/tick
 * DOM the same way `MatDialogContainer` owns dialog chrome — but unlike
 * `MatDialogContainer` (a genuinely neutral shell `Modal` could adopt),
 * `mat-slider`'s track/tick-mark rendering is real, opinionated visual
 * structure this design system needs to fully replace, not just theme:
 * `recursica_variables_scoped.css` defines ~15 distinct token groups for
 * this component alone (separate `track`/`track-active` colors,
 * independent `step-indicator-color`/`-color-active`/`-width`/
 * `-border-radius`, `thumb-size`/`-border-radius`/`-elevation`, plus a
 * dedicated `disabled`/`error` state variant for nearly every one of them)
 * — finer-grained than the MDC slider's own CSS custom-property surface
 * exposes per-mark, the same class of "real granularity the fixed
 * component doesn't have a hook for" finding that sank `MatTabGroup`/
 * `MatSelect` elsewhere in this adapter.
 *
 * **Decision**: hand-built, using real native `<input type="range">`
 * elements for genuine keyboard/screen-reader slider semantics (inherent
 * `role="slider"`, arrow-key stepping, `aria-valuenow`/`-min`/`-max` all
 * free from the platform), styled via `::-webkit-slider-thumb`/
 * `::-moz-range-thumb` pseudo-elements, with a separate absolutely-positioned
 * `.trackFill`/`.stepIndicator` overlay computed from `value`/`min`/`max`
 * — the same "leverage native semantics, hand-build the visual chrome
 * around it" split this adapter already used for the `Pagination`/
 * `SegmentedControl` primitives it hand-built this session.
 *
 * ## Range mode: two overlapping native range inputs — a known, documented trade-off
 *
 * A native `<input type="range">` has exactly one thumb; two-thumb range
 * selection is built the well-known way — two absolutely-stacked range
 * inputs sharing the same track box, each independently focusable/
 * keyboard-operable. `pointer-events: none` on both inputs (their own CSS)
 * with `pointer-events: auto` scoped back onto each one's own
 * `::-webkit-slider-thumb`/`::-moz-range-thumb` lets clicks pass through
 * empty track space to whichever thumb is actually under the pointer,
 * rather than always capturing them on one fixed input.
 *
 * **Known, documented gap**: this means clicking on empty track space
 * between the two thumbs does *not* jump the nearest thumb to that point
 * the way a single native range input's own click-to-seek behavior would
 * (each input's own hit area is scoped to its thumb only, by the
 * `pointer-events` override above) — only dragging a thumb handle moves
 * it. No golden story exercises click-to-seek in range mode specifically
 * (`RangeMode`'s own description says "Pass a `[number, number]` tuple to
 * render two thumbs", not "click track to seek"), so this wasn't verified
 * against a concrete failure, flagged here as a known, real consequence of
 * the two-overlapping-inputs technique rather than fixed speculatively.
 */
@Component({
  selector: "rec-slider-control",
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./slider.component.css",
  providers: [
    {
      provide: RECURSICA_FORM_CONTROL,
      useExisting: forwardRef(() => SliderControlComponent),
    },
  ],
  template: `
    <div
      class="root"
      [attr.data-disabled]="disabled ? '' : null"
      [attr.data-error]="error ? '' : null"
    >
      @if (icon) {
        <span class="icon">
          <ng-container [ngTemplateOutlet]="icon" />
        </span>
      }

      <div class="sliderWrapper">
        <div class="track" [id]="id" [attr.aria-describedby]="describedByAttr">
          <div
            class="trackFill"
            [style.left.%]="fillStartPercent"
            [style.width.%]="fillWidthPercent"
          ></div>
          @for (mark of marks; track mark.value) {
            <span
              class="stepIndicator"
              [style.left.%]="percentFor(mark.value)"
              [attr.data-active]="mark.value <= endValue ? '' : null"
            ></span>
          }
          @if (isRange) {
            <input
              type="range"
              class="thumbInput"
              data-thumb="start"
              [min]="min"
              [max]="max"
              [step]="step"
              [disabled]="disabled"
              [value]="startValue"
              [attr.aria-label]="'Minimum value'"
              (input)="onRangeInput($event, 'start')"
            />
            <input
              type="range"
              class="thumbInput"
              data-thumb="end"
              [min]="min"
              [max]="max"
              [step]="step"
              [disabled]="disabled"
              [value]="endValue"
              [attr.aria-label]="'Maximum value'"
              (input)="onRangeInput($event, 'end')"
            />
          } @else {
            <input
              type="range"
              class="thumbInput"
              data-thumb="single"
              [min]="min"
              [max]="max"
              [step]="step"
              [disabled]="disabled"
              [required]="required"
              [value]="endValue"
              (input)="onSingleInput($event)"
            />
          }
        </div>

        @if (marks && marks.length) {
          <div class="markLabels">
            @for (mark of marks; track mark.value) {
              <span class="markLabel" [style.left.%]="percentFor(mark.value)">{{
                mark.label
              }}</span>
            }
          </div>
        } @else if (showMinMaxLabels) {
          <div class="minMaxLabels">
            <span class="minMaxLabel">{{ minLabel ?? min }}</span>
            <span class="minMaxLabel">{{ maxLabel ?? max }}</span>
          </div>
        }
      </div>

      @if (trailingIcon) {
        <span class="icon">
          <ng-container [ngTemplateOutlet]="trailingIcon" />
        </span>
      }

      @if (showInput) {
        @if (isRange) {
          <input
            type="number"
            class="numberInput"
            [min]="min"
            [max]="endValue"
            [step]="step"
            [disabled]="disabled"
            [value]="startValue"
            [attr.aria-label]="'Minimum value'"
            (change)="onNumberInputChange($event, 'start')"
          />
          <input
            type="number"
            class="numberInput"
            [min]="startValue"
            [max]="max"
            [step]="step"
            [disabled]="disabled"
            [value]="endValue"
            [attr.aria-label]="'Maximum value'"
            (change)="onNumberInputChange($event, 'end')"
          />
        } @else {
          <input
            type="number"
            class="numberInput"
            [min]="min"
            [max]="max"
            [step]="step"
            [disabled]="disabled"
            [value]="endValue"
            (change)="onNumberInputChange($event, 'end')"
          />
        }
      }
    </div>
  `,
})
export class SliderControlComponent implements RecursicaFormControl {
  @Input() value: RecursicaSliderValue = 0;
  @Output() valueChange = new EventEmitter<RecursicaSliderValue>();

  @Input() min = 0;
  @Input() max = 100;
  @Input() step = 1;
  @Input() disabled = false;
  @Input() required = false;
  @Input() error = false;

  @Input() marks?: RecursicaSliderMark[];
  @Input() showMinMaxLabels = false;
  @Input() minLabel?: string;
  @Input() maxLabel?: string;
  @Input() showInput = false;

  @Input() icon?: TemplateRef<unknown>;
  @Input() trailingIcon?: TemplateRef<unknown>;

  private readonly baseId = `rec-slider-${nextId++}`;
  private _id?: string;

  @Input()
  set id(value: string | undefined) {
    this._id = value;
  }
  get id(): string {
    return this._id ?? this.baseId;
  }

  private describedByIds: string[] = [];

  get describedByAttr(): string | null {
    return this.describedByIds.length ? this.describedByIds.join(" ") : null;
  }

  setDescribedByIds(ids: string[]): void {
    this.describedByIds = ids;
  }

  get isRange(): boolean {
    return Array.isArray(this.value);
  }

  get startValue(): number {
    return Array.isArray(this.value) ? this.value[0] : this.min;
  }

  get endValue(): number {
    return Array.isArray(this.value) ? this.value[1] : this.value;
  }

  get fillStartPercent(): number {
    return this.isRange ? this.percentFor(this.startValue) : 0;
  }

  get fillWidthPercent(): number {
    return this.percentFor(this.endValue) - this.fillStartPercent;
  }

  percentFor(v: number): number {
    if (this.max === this.min) return 0;
    return ((v - this.min) / (this.max - this.min)) * 100;
  }

  onSingleInput(event: Event): void {
    const next = (event.target as HTMLInputElement).valueAsNumber;
    this.valueChange.emit(next);
  }

  onRangeInput(event: Event, thumb: "start" | "end"): void {
    const next = (event.target as HTMLInputElement).valueAsNumber;
    const [start, end] = Array.isArray(this.value)
      ? this.value
      : [this.min, this.value];
    if (thumb === "start") {
      this.valueChange.emit([Math.min(next, end), end]);
    } else {
      this.valueChange.emit([start, Math.max(next, start)]);
    }
  }

  onNumberInputChange(event: Event, thumb: "start" | "end"): void {
    const next = (event.target as HTMLInputElement).valueAsNumber;
    if (Number.isNaN(next)) return;
    if (!this.isRange) {
      this.valueChange.emit(Math.min(this.max, Math.max(this.min, next)));
      return;
    }
    const [start, end] = Array.isArray(this.value)
      ? this.value
      : [this.min, this.value];
    if (thumb === "start") {
      this.valueChange.emit([Math.min(Math.max(this.min, next), end), end]);
    } else {
      this.valueChange.emit([start, Math.max(Math.min(this.max, next), start)]);
    }
  }
}
