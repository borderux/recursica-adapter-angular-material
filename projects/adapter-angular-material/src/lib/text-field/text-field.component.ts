import { NgTemplateOutlet } from "@angular/common";
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ViewEncapsulation,
  forwardRef,
  signal,
} from "@angular/core";
import { ControlValueAccessor } from "@angular/forms";
import { MatInput } from "@angular/material/input";
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

let nextId = 0;

/**
 * Recursica `TextField` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10) — the first
 * real consumer of `RECURSICA_FORM_CONTROL`/`FormControlWrapper`'s own
 * contract (built weeks earlier against only a demo stand-in directive, see
 * `form-control-wrapper/IMPLEMENTATION_NOTES.md` and this component's own
 * `IMPLEMENTATION_NOTES.md` for the live composition verification).
 *
 * ## `matInput` investigation — adopted, unlike `MatSelect`/`MatTabGroup`
 *
 * Re-investigated against the real compiled source
 * (`node_modules/@angular/material/fesm2022/input.mjs`, `@angular/material@20.2.14`)
 * before writing any code, the same rigor `Dropdown`'s `MatSelect`
 * rejection applied to its own candidate. `matInput`'s situation is
 * fundamentally different from `MatSelect`/`MatTabGroup`, though, so the
 * conclusion is the opposite:
 *
 * 1. **It's a bare directive (`selector: "input[matInput], ..."`), not a
 *    component with its own template.** There is no `ViewEncapsulation.None`
 *    fixed DOM to fight — `matInput` attaches to *this component's own*
 *    `<input>` element, declared directly in `TextFieldComponent`'s own
 *    template. The element stays 100% owned by this component for styling
 *    purposes (`.input` scoped CSS reaches it exactly like any other element
 *    in this template — confirmed the same way `Dropdown`'s own `.root`/
 *    `.input` were confirmed to carry `TextFieldComponent`'s own
 *    `_ngcontent-*` attribute, since unlike the CDK-overlay-portaled content
 *    that bit `Dropdown`, nothing here gets reparented).
 * 2. **`MAT_FORM_FIELD` is `inject(MAT_FORM_FIELD, { optional: true })`** —
 *    confirmed directly in the compiled constructor. No `<mat-form-field>`
 *    ancestor is required; `_isInFormField` just becomes `false`, which only
 *    gates a handful of `mat-mdc-form-field-*`/`mdc-text-field__input` CSS
 *    classes this adapter doesn't use anyway (Recursica's own `.input`
 *    class carries all real styling). No error is thrown, nothing else
 *    degrades.
 * 3. **`NgControl`/`ReactiveFormsModule` are also optional** (`inject(NgControl,
 *    { optional: true, self: true })`) — `matInput` works standalone with
 *    plain property binding, no `[formControl]`/`ngModel` required. This
 *    component now implements `ControlValueAccessor` itself (see
 *    `docs/COMPONENT_DEV_GUIDE.md`'s "Forms integration" section — this
 *    component's own template renders `matInput` on an `<input>` it owns,
 *    which puts it in the same "wrapping component" category as every
 *    self-implementing Material control, not `matInput`'s own bare-directive
 *    category), so both `[formControl]` and plain `[value]`/`(valueChange)`
 *    work.
 * 4. **Real, working behavior genuinely worth adopting**: `type` has a real
 *    setter that writes `element.type` directly and validates against
 *    `MAT_INPUT_INVALID_TYPES` (throws for `button`/`checkbox`/`radio`/etc.
 *    — a real guard rail, not decoration); `placeholder` is dirty-checked
 *    every `ngDoCheck` and reflected via `setAttribute`/`removeAttribute`
 *    (more robust than a static `[placeholder]` binding alone); `readonly`
 *    reflects via `_getReadonlyAttribute()`; real `AutofillMonitor`
 *    integration (`_autofillMonitor.monitor(...)` in `ngAfterViewInit`) for
 *    genuine browser-autofill detection; an iOS-only caret-jiggle-on-delete
 *    workaround (`_cleanupIosKeyup`), installed automatically, that a plain
 *    `<input>` would not get.
 * 5. **`errorState`/`aria-invalid` deliberately left alone**: `matInput`
 *    computes `aria-invalid` from `_errorStateTracker`, which is driven by
 *    `NgControl`/`parentForm`/`parentFormGroup` — none of which this
 *    component uses, so that internal state stays permanently "no error"
 *    and `matInput` never writes `aria-invalid` here. This component's own
 *    `error` input (boolean, visual-only, mirrors `Dropdown`'s identical
 *    `error` input) does not attempt to also drive `aria-invalid` on the
 *    same element — see this class's "Known gap" doc below for why, and
 *    IMPLEMENTATION_NOTES.md for the live-verified a11y path that actually
 *    carries the error (label `for` + `aria-describedby` → the error
 *    message, via `RECURSICA_FORM_CONTROL`/`FormControlWrapper`).
 *
 * **Decision**: use `matInput` on the real `<input>`, for genuine value
 * (autofill/iOS/type-validation/placeholder robustness), while every visual
 * concern (border/background/padding/typography/state colors) stays this
 * component's own scoped `.input` CSS — `matInput` contributes zero DOM/CSS
 * of its own since it renders no template and (per point 2 above) no
 * `<mat-form-field>` wraps it to contribute any either.
 *
 * ## `RECURSICA_FORM_CONTROL`: composed like `Dropdown`, not internally
 *
 * Same reasoning as `Dropdown` (see its own IMPLEMENTATION_NOTES.md):
 * `TextFieldComponent` does not render `FormControlWrapperComponent`
 * internally — it provides itself under `RECURSICA_FORM_CONTROL` and is
 * meant to be composed by the caller:
 * `<rec-form-control-wrapper><rec-text-field ... /></rec-form-control-wrapper>`.
 * This is the *first real* (non-demo-directive) consumer of that contract —
 * see IMPLEMENTATION_NOTES.md for the live verification this component was
 * built specifically to exercise.
 *
 * ## Known gap: `readOnly` approximates, does not implement, `ReadOnlyField`
 *
 * See IMPLEMENTATION_NOTES.md's "ReadOnlyField gap" section — both golden
 * `static-read-only` *and* `editable-read-only` screenshots route through
 * the genesis adapter's `ReadOnlyField`/`WithReadOnlyWrapper` in the real
 * reference (confirmed by reading `TextField.tsx`/`WithReadOnlyWrapper.tsx`:
 * neither story passes a `readOnlyComponent`, so both hit the same
 * plain-text `ReadOnlyField` rendering path — not just `static-read-only` as
 * initially assumed). `ReadOnlyField` doesn't exist in this adapter yet and
 * building it was out of scope here. This component's `readOnly` input
 * instead applies the real native HTML `readonly` attribute (via `matInput`)
 * to the actual `<input>` — genuinely functional, but a deliberate
 * approximation of both golden variants, not a `ReadOnlyField` port.
 */
@Component({
  selector: "rec-text-field",
  imports: [MatInput, NgTemplateOutlet],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./text-field.component.css",
  providers: [
    {
      provide: RECURSICA_FORM_CONTROL,
      useExisting: forwardRef(() => TextFieldComponent),
    },
    recursicaValueAccessorProvider(TextFieldComponent),
  ],
  template: `
    <div
      class="root"
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
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
        matInput
        class="input"
        [id]="id"
        [type]="type"
        [placeholder]="placeholder ?? ''"
        [disabled]="disabled"
        [required]="required"
        [readonly]="readOnly"
        [attr.name]="name ?? null"
        [attr.autocomplete]="autocomplete ?? null"
        [attr.aria-describedby]="describedByAttr"
        [value]="currentValue"
        (input)="onInput($event)"
        (blur)="onBlur()"
      />
      @if (rightSection) {
        <span class="section" data-position="right">
          <ng-container [ngTemplateOutlet]="rightSection" />
        </span>
      }
    </div>
  `,
})
export class TextFieldComponent
  implements
    RecursicaFormControl,
    RecursicaOverStyled,
    ControlValueAccessor,
    OnInit
{
  @Input() value?: string;
  @Input() defaultValue?: string;
  @Output() valueChange = new EventEmitter<string>();

  @Input() placeholder?: string;
  @Input() type = "text";
  @Input() name?: string;
  @Input() autocomplete?: string;

  @Input() disabled = false;
  @Input() required = false;

  /**
   * Real native HTML `readonly` (applied via `matInput`) — see this class's
   * doc comment's "Known gap" section for why this is a deliberate
   * approximation of the golden `static-read-only`/`editable-read-only`
   * screenshots, not real `ReadOnlyField` parity.
   */
  @Input() readOnly = false;

  /**
   * Visual-only error state (mirrors `Dropdown`'s identical boolean `error`
   * input) — drives `.root[data-error]`'s token-driven border/background/
   * text-color, carries no message. The error *message* is
   * `FormControlWrapper`'s `error` input, a sibling prop on the wrapping
   * component, not flattened onto `TextField`.
   */
  @Input() error = false;

  @Input() leftSection?: TemplateRef<unknown>;
  @Input() rightSection?: TemplateRef<unknown>;

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  private readonly baseId = `rec-text-field-${nextId++}`;
  @Input() id = this.baseId;

  private describedByIds: string[] = [];

  /**
   * Uncontrolled-value fallback, seeded from `defaultValue` in `ngOnInit`
   * (never the constructor/field initializer) — `@Input()`-bound values
   * land on the instance *after* construction but *before* `ngOnInit`, the
   * same bug class already found in `checkbox.component.ts` and avoided in
   * `radio.component.ts`'s own `_uncontrolledChecked`/`ngOnInit` pair. See
   * `radio.component.ts`'s class doc comment for the live-verified
   * reasoning this mirrors.
   */
  private readonly _uncontrolledValue = signal("");

  private readonly cva = new RecursicaValueAccessor<string | undefined>();

  ngOnInit(): void {
    this._uncontrolledValue.set(this.defaultValue ?? "");
  }

  get currentValue(): string {
    return this.value !== undefined ? this.value : this._uncontrolledValue();
  }

  get describedByAttr(): string | null {
    return this.describedByIds.length ? this.describedByIds.join(" ") : null;
  }

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }

  setDescribedByIds(ids: string[]): void {
    this.describedByIds = ids;
  }

  onInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value;
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
