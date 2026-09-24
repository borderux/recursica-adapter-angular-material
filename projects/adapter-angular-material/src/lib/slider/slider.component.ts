import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ViewEncapsulation,
  signal,
} from "@angular/core";
import { ControlValueAccessor } from "@angular/forms";
import type {
  RecursicaFormControlLabelSize,
  RecursicaFormLayout,
} from "../form-control-layout/form-control-layout.component";
import type { RecursicaLabelAlignment } from "../label/label.component";
import { WithReadOnlyWrapperComponent } from "../read-only-field/with-read-only-wrapper.component";
import {
  RecursicaValueAccessor,
  recursicaValueAccessorProvider,
} from "../utils/recursica-value-accessor";
import {
  RecursicaSliderMark,
  RecursicaSliderValue,
  SliderControlComponent,
} from "./slider-control.component";

let nextId = 0;

/**
 * Recursica `Slider` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). Same
 * architecture as `NumberInput` (built directly on
 * `rec-with-read-only-wrapper` internally, matching the reference's own
 * `Slider.tsx` — confirmed by reading it, not assumed: it flattens
 * `FormControlWrapper`'s own prop surface onto `Slider`'s public props,
 * not a separate composed component the way `Dropdown` is) — see
 * `slider-control.component.ts`'s own doc comment for the full
 * `MatSlider`-rejection reasoning and the hand-built track/thumb/mark
 * design this doesn't repeat.
 *
 * ## `value`/`defaultValue`: `number | [number, number]` — range mode is a value-shape switch, not a separate component
 *
 * Matches the reference exactly: passing a `[number, number]` tuple
 * renders two thumbs (Mantine's `RangeSlider` internally), a plain
 * `number` renders one. This adapter reproduces that as a single
 * `RecursicaSliderValue` union rather than a `range: boolean` flag plus
 * two differently-shaped value inputs — the stub's own first-pass
 * `@Input()` guess (`range: boolean`) is superseded here once the real
 * reference API was read directly.
 *
 * ## Read-only display: a custom `readOnlyTemplate`, not the generic `text` type
 *
 * The reference's own `SliderReadOnlyValue` renders `"lower – upper"` for
 * a range tuple, styled with Slider-specific `read-only-value_*`
 * typography tokens (confirmed in `recursica_variables_scoped.css` — a
 * distinct token group from `ReadOnlyField`'s own generic text styling).
 * `formattedReadOnlyValue` reproduces the `"lower – upper"` formatting;
 * `readOnlyTemplate` (not the default `readOnlyType="text"` branch) is
 * used so `slider.component.css`'s own `.readOnlyValue` rule can apply
 * those dedicated tokens, matching the reference's own dedicated
 * sub-component instead of approximating it with generic text styling.
 */
@Component({
  selector: "rec-slider",
  imports: [WithReadOnlyWrapperComponent, SliderControlComponent],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./slider.component.css",
  providers: [recursicaValueAccessorProvider(SliderComponent)],
  template: `
    <rec-with-read-only-wrapper
      [readOnly]="readOnly"
      [activeTemplate]="active"
      [readOnlyTemplate]="readOnlyView"
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
      [error]="error"
      [assistiveWithIcon]="assistiveWithIcon"
      [required]="required"
      [withAsterisk]="withAsterisk"
      [overStyled]="overStyled"
      [overClass]="overClass"
      [overStyle]="overStyle"
      (labelEditClick)="labelEditClick.emit($event)"
    />
    <ng-template #active>
      <rec-slider-control
        [id]="id"
        [value]="currentValue"
        [min]="min"
        [max]="max"
        [step]="step"
        [disabled]="disabled"
        [required]="required"
        [error]="!!error"
        [marks]="marks"
        [showMinMaxLabels]="showMinMaxLabels"
        [minLabel]="minLabel"
        [maxLabel]="maxLabel"
        [showInput]="showInput"
        [icon]="icon"
        [trailingIcon]="trailingIcon"
        (valueChange)="onValueChange($event)"
      />
    </ng-template>
    <ng-template #readOnlyView>
      <div class="readOnlyValue">{{ formattedReadOnlyValue }}</div>
    </ng-template>
  `,
})
export class SliderComponent implements ControlValueAccessor, OnInit {
  @Input() value?: RecursicaSliderValue;
  @Input() defaultValue?: RecursicaSliderValue;
  @Output() valueChange = new EventEmitter<RecursicaSliderValue>();

  @Input() disabled = false;
  @Input() required = false;
  @Input() readOnly = false;

  /** Doubles as the wrapper's error message and the control's visual flag — mirrors `NumberInput`'s identical `error` input. */
  @Input() error?: string;

  @Input() min = 0;
  @Input() max = 100;
  @Input() step = 1;

  @Input() marks?: RecursicaSliderMark[];
  @Input() showMinMaxLabels = false;
  @Input() minLabel?: string;
  @Input() maxLabel?: string;
  @Input() showInput = false;

  @Input() icon?: TemplateRef<unknown>;
  @Input() trailingIcon?: TemplateRef<unknown>;

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
  @Input() withAsterisk?: boolean;

  @Output() labelEditClick = new EventEmitter<MouseEvent>();

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  private readonly baseId = `rec-slider-${nextId++}`;
  @Input() id = this.baseId;

  /**
   * Uncontrolled-value fallback, seeded from `defaultValue` in `ngOnInit`
   * (never the constructor/field initializer) — same bug class documented
   * in `checkbox.component.ts`/`radio.component.ts`/`number-input.component.ts`.
   */
  private readonly _uncontrolledValue = signal<
    RecursicaSliderValue | undefined
  >(undefined);

  private readonly cva = new RecursicaValueAccessor<
    RecursicaSliderValue | undefined
  >();

  ngOnInit(): void {
    this._uncontrolledValue.set(this.defaultValue ?? this.min);
  }

  get currentValue(): RecursicaSliderValue {
    const v = this.value !== undefined ? this.value : this._uncontrolledValue();
    return v ?? this.min;
  }

  get formattedReadOnlyValue(): string {
    const v = this.currentValue;
    return Array.isArray(v) ? `${v[0]} – ${v[1]}` : `${v}`;
  }

  onValueChange(next: RecursicaSliderValue): void {
    if (this.value === undefined) {
      this._uncontrolledValue.set(next);
    }
    this.valueChange.emit(next);
    this.cva.notifyChange(next);
    this.cva.notifyTouched();
  }

  writeValue(value: RecursicaSliderValue | undefined): void {
    this.value = value;
  }

  registerOnChange(
    fn: (value: RecursicaSliderValue | undefined) => void,
  ): void {
    this.cva.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.cva.registerOnTouched(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
