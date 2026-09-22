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
import { NumberInputControlComponent } from "./number-input-control.component";

let nextId = 0;

/**
 * Recursica `NumberInput` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). Same
 * architecture as `TextArea` (built directly on `rec-with-read-only-wrapper`
 * internally, matching the genesis reference's own `NumberInput.tsx` —
 * confirmed by reading it, not assumed) — see that component's own class
 * doc comment for the full reasoning this doesn't repeat. The real
 * `<input type="number">` lives in `NumberInputControlComponent`
 * (`rec-number-input-control`) for the same `RECURSICA_FORM_CONTROL`
 * positioning reason `TextAreaControlComponent` documents.
 *
 * ## Genuinely does not exist in Angular Material/CDK
 *
 * The stub's own `IMPLEMENTATION_NOTES.md` already flagged this
 * (`Category: DOES NOT EXIST`) — re-confirmed at build time, not just
 * carried over. See `number-input-control.component.ts`'s own doc comment
 * for the `matInput`-on-`type="number"` + native `stepUp()`/`stepDown()`
 * design this hand-built control uses instead.
 *
 * ## `rightSection` overrides the increment/decrement controls
 *
 * Matches the reference's own documented behavior
 * (`NUMBER_INPUT_IMPLEMENTATION_NOTES.md` §2: "Passing a `rightSection`
 * element will natively remove the increment/decrement arrow controls") —
 * `NumberInputControlComponent`'s template renders `.controls` only in the
 * `@else` branch when no `rightSection` is supplied, same precedence.
 */
@Component({
  selector: "rec-number-input",
  imports: [WithReadOnlyWrapperComponent, NumberInputControlComponent],
  encapsulation: ViewEncapsulation.Emulated,
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
      <rec-number-input-control
        [id]="id"
        [value]="currentValue"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [required]="required"
        [error]="!!error"
        [name]="name"
        [min]="min"
        [max]="max"
        [step]="step"
        [hideControls]="hideControls"
        [leftSection]="leftSection"
        [rightSection]="rightSection"
        (valueChange)="onValueChange($event)"
      />
    </ng-template>
  `,
})
export class NumberInputComponent implements OnInit {
  @Input() value?: number;
  @Input() defaultValue?: number;
  @Output() valueChange = new EventEmitter<number | undefined>();

  @Input() placeholder?: string;
  @Input() name?: string;
  @Input() disabled = false;
  @Input() required = false;
  @Input() readOnly = false;

  /** Doubles as the wrapper's error message and the control's visual flag — mirrors `TextArea`'s identical `error` input. */
  @Input() error?: string;

  @Input() min?: number;
  @Input() max?: number;
  @Input() step?: number;
  @Input() hideControls = false;

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

  private readonly baseId = `rec-number-input-${nextId++}`;
  @Input() id = this.baseId;

  /**
   * Uncontrolled-value fallback, seeded from `defaultValue` in `ngOnInit`
   * (never the constructor/field initializer) — same bug class documented
   * in `checkbox.component.ts`/`radio.component.ts`/`text-area.component.ts`.
   */
  private readonly _uncontrolledValue = signal<number | undefined>(undefined);

  ngOnInit(): void {
    this._uncontrolledValue.set(this.defaultValue);
  }

  get currentValue(): number | undefined {
    return this.value !== undefined ? this.value : this._uncontrolledValue();
  }

  get resolvedControlMaxWidth(): string {
    return `var(--recursica_ui-kit_components_number-input_variants_layouts_${this.formLayout}_properties_max-width)`;
  }

  get resolvedControlMinWidth(): string {
    return `var(--recursica_ui-kit_components_number-input_variants_layouts_${this.formLayout}_properties_min-width)`;
  }

  onValueChange(next: number | undefined): void {
    if (this.value === undefined) {
      this._uncontrolledValue.set(next);
    }
    this.valueChange.emit(next);
  }
}
