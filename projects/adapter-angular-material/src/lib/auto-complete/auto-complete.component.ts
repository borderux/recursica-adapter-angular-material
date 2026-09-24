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
import { RecursicaDropdownData } from "../dropdown/dropdown-option";
import { WithReadOnlyWrapperComponent } from "../read-only-field/with-read-only-wrapper.component";
import {
  RecursicaValueAccessor,
  recursicaValueAccessorProvider,
} from "../utils/recursica-value-accessor";
import { AutoCompleteControlComponent } from "./auto-complete-control.component";

let nextId = 0;

/**
 * Recursica `AutoComplete` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). Same
 * architecture as `TextArea`/`NumberInput`/`DatePicker`/`TimePicker` (built
 * directly on `rec-with-read-only-wrapper` internally, matching the genesis
 * reference's own `AutoComplete.tsx`). See
 * `auto-complete-control.component.ts`'s own class doc comment for the full
 * `MatAutocomplete` rejection reasoning and the free-text-vs-closed-set
 * differences from `Dropdown` — not repeated here.
 */
@Component({
  selector: "rec-auto-complete",
  imports: [WithReadOnlyWrapperComponent, AutoCompleteControlComponent],
  encapsulation: ViewEncapsulation.Emulated,
  providers: [recursicaValueAccessorProvider(AutoCompleteComponent)],
  template: `
    <rec-with-read-only-wrapper
      [readOnly]="readOnly"
      [activeTemplate]="active"
      readOnlyType="text"
      [readOnlyValue]="currentValue"
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
      [controlMaxWidth]="resolvedControlMaxWidth"
      [controlMinWidth]="resolvedControlMinWidth"
      [required]="required"
      [withAsterisk]="withAsterisk"
      [overStyled]="overStyled"
      [overClass]="overClass"
      [overStyle]="overStyle"
      (labelEditClick)="labelEditClick.emit($event)"
    />
    <ng-template #active>
      <rec-auto-complete-control
        [id]="id"
        [data]="data"
        [value]="currentValue"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [required]="required"
        [error]="!!error"
        [name]="name"
        [wrapItemText]="wrapItemText"
        [leftSection]="leftSection"
        [rightSection]="rightSection"
        (valueChange)="onValueChange($event)"
        (blurred)="onBlur()"
      />
    </ng-template>
  `,
})
export class AutoCompleteComponent implements ControlValueAccessor, OnInit {
  @Input() data: RecursicaDropdownData = [];

  @Input() value?: string;
  @Input() defaultValue?: string;
  @Output() valueChange = new EventEmitter<string | undefined>();

  @Input() placeholder?: string;
  @Input() name?: string;
  @Input() disabled = false;
  @Input() required = false;
  @Input() readOnly = false;

  /** Doubles as the wrapper's error message and the control's visual flag — mirrors `TextArea`/`NumberInput`/`DatePicker`/`TimePicker`'s identical `error` input. */
  @Input() error?: string;

  @Input() wrapItemText = false;

  @Input() leftSection?: TemplateRef<unknown>;
  @Input() rightSection?: TemplateRef<unknown>;

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

  private readonly baseId = `rec-auto-complete-${nextId++}`;
  @Input() id = this.baseId;

  /**
   * Uncontrolled-value fallback, seeded from `defaultValue` in `ngOnInit`
   * (never the constructor/field initializer) — same bug class documented
   * in `checkbox.component.ts`/`radio.component.ts`/`text-area.component.ts`/
   * `number-input.component.ts`/`date-picker.component.ts`/`time-picker.component.ts`.
   */
  private readonly _uncontrolledValue = signal("");

  private readonly cva = new RecursicaValueAccessor<string | undefined>();

  ngOnInit(): void {
    this._uncontrolledValue.set(this.defaultValue ?? "");
  }

  get currentValue(): string {
    return this.value !== undefined ? this.value : this._uncontrolledValue();
  }

  get resolvedControlMaxWidth(): string {
    return `var(--recursica_ui-kit_components_autocomplete_variants_layouts_${this.formLayout}_properties_max-width)`;
  }

  get resolvedControlMinWidth(): string {
    return `var(--recursica_ui-kit_components_autocomplete_variants_layouts_${this.formLayout}_properties_min-width)`;
  }

  onValueChange(next: string | undefined): void {
    if (this.value === undefined) {
      this._uncontrolledValue.set(next ?? "");
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
