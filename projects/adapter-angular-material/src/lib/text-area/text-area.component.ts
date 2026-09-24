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
import { TextAreaControlComponent } from "./text-area-control.component";

let nextId = 0;

/**
 * Recursica `TextArea` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). Unlike
 * `TextField`/`Dropdown` (which expose themselves under
 * `RECURSICA_FORM_CONTROL` for the *caller* to compose inside an externally
 * written `<rec-form-control-wrapper>`), this component composes
 * `rec-with-read-only-wrapper` **internally** — matching the genesis
 * reference's own `TextArea.tsx`, which renders `<WithReadOnlyWrapper
 * activeComponent={<MantineTextarea ... />} ... />` directly, not a
 * caller-composed wrapper. That's a real architectural difference from
 * `TextField.tsx` in the reference too (confirmed by reading both
 * source files, not assumed) — `TextArea` was simply built after
 * `WithReadOnlyWrapper`/`ReadOnlyField` already existed in this adapter,
 * so it's the first component here to follow the reference's actual
 * composition shape instead of approximating `readOnly` with a disabled-
 * token render. See `read-only-field/IMPLEMENTATION_NOTES.md` for why
 * `TextField`/`Dropdown`/`Checkbox`/`Radio`/`Switch` still approximate —
 * retrofitting them is a separate, already-flagged follow-up, not touched
 * here.
 *
 * The internal `<textarea>` lives in a separate `TextAreaControlComponent`
 * (`rec-text-area-control`), not this class — see that component's own doc
 * comment for why `RECURSICA_FORM_CONTROL` has to be provided by a node
 * *inside* the projected `activeTemplate`, not by this outer component.
 *
 * ## Layout width tokens: implemented here, not copied as a gap
 *
 * `TextField`/`Dropdown` never wire `controlMaxWidth`/`controlMinWidth` to
 * the `--recursica_ui-kit_components_<name>_variants_layouts_*_properties_
 * {max,min}-width` tokens (confirmed: `text-field.stories.ts` never sets
 * either prop, so `FormControlLayout`'s own `100%`/`auto` CSS fallback
 * always applies instead — a real, already-shipped gap in those two
 * components, not touched here since retrofitting is out of scope). Doing
 * it correctly here costs two getters and was already needed to build this
 * component fresh, so it isn't skipped. `top-bottom-margin` is a different
 * story: `FormControlLayoutComponent`'s own CSS has no consumption point
 * for a per-component margin override at all (it hardcodes the global
 * `--recursica_ui-kit_globals_form_properties_vertical-item-gap` token) —
 * implementing that would mean editing shared `form-control-layout`
 * component CSS every other component also depends on, which is real scope
 * creep beyond one new component. Left as the same gap every component in
 * this adapter already has.
 */
@Component({
  selector: "rec-text-area",
  imports: [WithReadOnlyWrapperComponent, TextAreaControlComponent],
  encapsulation: ViewEncapsulation.Emulated,
  providers: [recursicaValueAccessorProvider(TextAreaComponent)],
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
      <rec-text-area-control
        [id]="id"
        [value]="currentValue"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [required]="required"
        [error]="!!error"
        [name]="name"
        [autosize]="autosize"
        [minRows]="minRows"
        [maxRows]="maxRows"
        (valueChange)="onValueChange($event)"
        (blurred)="onBlur()"
      />
    </ng-template>
  `,
})
export class TextAreaComponent implements ControlValueAccessor, OnInit {
  @Input() value?: string;
  @Input() defaultValue?: string;
  @Output() valueChange = new EventEmitter<string>();

  @Input() placeholder?: string;
  @Input() name?: string;
  @Input() disabled = false;
  @Input() required = false;
  @Input() readOnly = false;

  /**
   * Doubles as the wrapper's error *message* (passed straight through to
   * `rec-with-read-only-wrapper`/`FormControlWrapper`) and the control's
   * visual-only error *flag* (`!!error`) — mirrors the genesis reference's
   * own single `error?: React.ReactNode` prop on `TextArea.tsx`, not two
   * separate inputs the way `TextField`'s external-composition split
   * required.
   */
  @Input() error?: string;

  @Input() autosize = false;
  @Input() minRows?: number;
  @Input() maxRows?: number;

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

  private readonly baseId = `rec-text-area-${nextId++}`;
  @Input() id = this.baseId;

  /**
   * Uncontrolled-value fallback, seeded from `defaultValue` in `ngOnInit`
   * (never the constructor/field initializer) — the same bug class
   * documented in `checkbox.component.ts`/`radio.component.ts` and avoided
   * here from the start.
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
    return `var(--recursica_ui-kit_components_textarea_variants_layouts_${this.formLayout}_properties_max-width)`;
  }

  get resolvedControlMinWidth(): string {
    return `var(--recursica_ui-kit_components_textarea_variants_layouts_${this.formLayout}_properties_min-width)`;
  }

  onValueChange(next: string): void {
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
