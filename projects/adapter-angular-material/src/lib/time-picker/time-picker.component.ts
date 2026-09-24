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
import { TimePickerControlComponent } from "./time-picker-control.component";

let nextId = 0;

/** Formats a 24-hour "HH:mm[:ss]" string as "H:MM[:SS] AM/PM" for read-only display. */
function formatReadOnlyTime(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const [hourStr, minute, second] = value.split(":");
  const hour24 = parseInt(hourStr, 10);
  if (Number.isNaN(hour24) || minute === undefined) {
    return value;
  }
  const isPM = hour24 >= 12;
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const rest = second !== undefined ? `${minute}:${second}` : minute;
  return `${hour12}:${rest} ${isPM ? "PM" : "AM"}`;
}

/**
 * Recursica `TimePicker` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). Same
 * architecture as `TextArea`/`NumberInput`/`DatePicker` (built directly on
 * `rec-with-read-only-wrapper` internally, matching the genesis reference's
 * own `TimePicker.tsx`). See `time-picker-control.component.ts`'s own class
 * doc comment for the full `MatTimepicker` rejection reasoning and the
 * `rec-dropdown`-reused-directly AM/PM design — not repeated here.
 *
 * ## Read-only value: formatted 12-hour + AM/PM, matching the reference
 *
 * `formatReadOnlyTime` above is a direct port of the reference's own
 * identically-named helper (`TimePicker.tsx`) — same reasoning
 * (`DATEPICKER`-style raw-string read-only would be wrong, a read-only
 * `TimePicker` should show "2:30 PM", not "14:30").
 */
@Component({
  selector: "rec-time-picker",
  imports: [WithReadOnlyWrapperComponent, TimePickerControlComponent],
  encapsulation: ViewEncapsulation.Emulated,
  providers: [recursicaValueAccessorProvider(TimePickerComponent)],
  template: `
    <rec-with-read-only-wrapper
      [readOnly]="readOnly"
      [activeTemplate]="active"
      readOnlyType="text"
      [readOnlyValue]="formattedReadOnlyValue"
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
      <rec-time-picker-control
        [id]="id"
        [value]="currentValue"
        [disabled]="disabled"
        [required]="required"
        [error]="!!error"
        [name]="name"
        [withSeconds]="withSeconds"
        [leftSection]="leftSection"
        (valueChange)="onValueChange($event)"
        (blurred)="onBlur()"
      />
    </ng-template>
  `,
})
export class TimePickerComponent implements ControlValueAccessor, OnInit {
  @Input() value?: string;
  @Input() defaultValue?: string;
  @Output() valueChange = new EventEmitter<string | undefined>();

  @Input() name?: string;
  @Input() disabled = false;
  @Input() required = false;
  @Input() readOnly = false;

  /** Doubles as the wrapper's error message and the control's visual flag — mirrors `TextArea`/`NumberInput`/`DatePicker`'s identical `error` input. */
  @Input() error?: string;

  @Input() withSeconds = false;

  @Input() leftSection?: TemplateRef<unknown>;

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

  private readonly baseId = `rec-time-picker-${nextId++}`;
  @Input() id = this.baseId;

  /**
   * Uncontrolled-value fallback, seeded from `defaultValue` in `ngOnInit`
   * (never the constructor/field initializer) — same bug class documented
   * in `checkbox.component.ts`/`radio.component.ts`/`text-area.component.ts`/
   * `number-input.component.ts`/`date-picker.component.ts`.
   */
  private readonly _uncontrolledValue = signal<string | undefined>(undefined);

  private readonly cva = new RecursicaValueAccessor<string | undefined>();

  ngOnInit(): void {
    this._uncontrolledValue.set(this.defaultValue);
  }

  get currentValue(): string | undefined {
    return this.value !== undefined ? this.value : this._uncontrolledValue();
  }

  get formattedReadOnlyValue(): string | undefined {
    return formatReadOnlyTime(this.currentValue);
  }

  onValueChange(next: string | undefined): void {
    if (this.value === undefined) {
      this._uncontrolledValue.set(next);
    }
    this.valueChange.emit(next);
    this.cva.notifyChange(next);
  }

  onBlur(): void {
    this.cva.notifyTouched();
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
}
