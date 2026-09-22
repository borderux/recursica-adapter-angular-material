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
import type {
  RecursicaFormControlLabelSize,
  RecursicaFormLayout,
} from "../form-control-layout/form-control-layout.component";
import type { RecursicaLabelAlignment } from "../label/label.component";
import { WithReadOnlyWrapperComponent } from "../read-only-field/with-read-only-wrapper.component";
import { DatePickerControlComponent } from "./date-picker-control.component";

let nextId = 0;

const READ_ONLY_FORMAT: Intl.DateTimeFormatOptions = {
  year: "2-digit",
  month: "2-digit",
  day: "2-digit",
};

/**
 * Recursica `DatePicker` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). Same
 * architecture as `TextArea`/`NumberInput` (built directly on
 * `rec-with-read-only-wrapper` internally, matching the genesis reference's
 * own `DatePicker.tsx` — confirmed by reading it). See
 * `date-picker-control.component.ts`'s own doc comment for the full
 * `MatDatepicker`/`MatDatepickerInput` adoption reasoning and the calendar
 * popup's global-stylesheet styling approach — not repeated here.
 *
 * ## Read-only value: formatted, not a raw `Date.toString()`
 *
 * Matches the reference's own bug-fix intent (`DATEPICKER_IMPLEMENTATION_NOTES.md`,
 * "Read-only value format"): a read-only `DatePicker` should show the same
 * `MM/DD/YY`-shaped text the same value renders as while editable, not
 * JS's own verbose `Date.toString()`. Formatted here via `Intl.DateTimeFormat`
 * with the identical `{ month: "2-digit", day: "2-digit", year: "2-digit" }`
 * options `DatePickerControlComponent`'s own `MAT_DATE_FORMATS` override
 * uses for the editable display, so both paths can never disagree.
 */
@Component({
  selector: "rec-date-picker",
  imports: [WithReadOnlyWrapperComponent, DatePickerControlComponent],
  encapsulation: ViewEncapsulation.Emulated,
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
      <rec-date-picker-control
        [id]="id"
        [value]="currentValue"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [required]="required"
        [error]="!!error"
        [name]="name"
        [min]="min"
        [max]="max"
        [leftSection]="leftSection"
        [opened]="opened"
        (valueChange)="onValueChange($event)"
      />
    </ng-template>
  `,
})
export class DatePickerComponent implements OnInit {
  @Input() value?: Date | null;
  @Input() defaultValue?: Date | null;
  @Output() valueChange = new EventEmitter<Date | null>();

  @Input() placeholder?: string;
  @Input() name?: string;
  @Input() disabled = false;
  @Input() required = false;
  @Input() readOnly = false;

  /** Doubles as the wrapper's error message and the control's visual flag — mirrors `TextArea`/`NumberInput`'s identical `error` input. */
  @Input() error?: string;

  @Input() min?: Date;
  @Input() max?: Date;

  @Input() leftSection?: TemplateRef<unknown>;

  /** Forces the calendar open with no click required — see `DatePickerControlComponent`'s identical input. */
  @Input() opened = false;

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

  private readonly baseId = `rec-date-picker-${nextId++}`;
  @Input() id = this.baseId;

  /**
   * Uncontrolled-value fallback, seeded from `defaultValue` in `ngOnInit`
   * (never the constructor/field initializer) — same bug class documented
   * in `checkbox.component.ts`/`radio.component.ts`/`text-area.component.ts`/
   * `number-input.component.ts`.
   */
  private readonly _uncontrolledValue = signal<Date | null | undefined>(
    undefined,
  );

  ngOnInit(): void {
    this._uncontrolledValue.set(this.defaultValue ?? null);
  }

  get currentValue(): Date | null | undefined {
    return this.value !== undefined ? this.value : this._uncontrolledValue();
  }

  get formattedReadOnlyValue(): string | undefined {
    const date = this.currentValue;
    if (!date) {
      return undefined;
    }
    return new Intl.DateTimeFormat("en-US", READ_ONLY_FORMAT).format(date);
  }

  onValueChange(next: Date | null): void {
    if (this.value === undefined) {
      this._uncontrolledValue.set(next);
    }
    this.valueChange.emit(next);
  }
}
