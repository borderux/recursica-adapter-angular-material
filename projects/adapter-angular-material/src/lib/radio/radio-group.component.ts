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
import { FormControlWrapperComponent } from "../form-control-wrapper/form-control-wrapper.component";
import {
  RecursicaFormControlLabelSize,
  RecursicaFormLayout,
} from "../form-control-layout/form-control-layout.component";
import { RecursicaLabelAlignment } from "../label/label.component";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";
import {
  RecursicaValueAccessor,
  recursicaValueAccessorProvider,
} from "../utils/recursica-value-accessor";
import { RADIO_GROUP_CONTEXT, RadioGroupContext } from "./radio-group-context";

let nextGroupId = 0;

/**
 * Recursica `RadioGroup` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). No Angular
 * Material equivalent investigated separately — it's a pure composition
 * layer (label/description/assistive-text/error chrome + a single-value-
 * tracked list of `Radio`s), not a Material-wrappable widget on its own;
 * `radio.component.ts`'s own class doc comment covers the `MatRadioButton`
 * investigation this group's children are built on. (Angular Material does
 * have a `MatRadioGroup`, but it exists purely to coordinate `MatRadioButton`
 * children we already rejected — there is nothing left for it to usefully
 * wrap once the children themselves are hand-built.)
 *
 * ## Composes `FormControlWrapperComponent` directly — mirrors `WithReadOnlyWrapper`, same pattern `CheckboxGroup` already established
 *
 * Unlike `Radio` itself (which doesn't provide `RECURSICA_FORM_CONTROL` and
 * is meant to be composed *inside* a caller-written
 * `<rec-form-control-wrapper>`), the genesis adapter's own `RadioGroup.tsx`
 * renders `WithReadOnlyWrapper` — which itself always renders a real
 * `FormControlWrapper` — **internally**, flattening `label`/`description`/
 * `assistiveText`/`error`/`required`/`withAsterisk`/the `labelAlignment`/
 * `labelOptionalText`/`labelWithEditIcon`/`onLabelEditClick` trio onto
 * `RadioGroup`'s own prop surface. `RadioGroupComponent` mirrors this
 * exactly — the same composition `CheckboxGroupComponent` already
 * established for its own identical `CheckboxGroup.tsx` shape.
 *
 * `labelElement="div"` from the reference (`WithReadOnlyWrapper`'s
 * `Radio.Group`-specific override — "ARIA grouping prohibits interactive
 * radios nested natively inside `<label>`") needs no separate translation
 * here either, for the same reason `CheckboxGroupComponent`'s own doc
 * comment already gives: `FormControlWrapperComponent`'s `Label` is never
 * nested around the radio list to begin with.
 *
 * ## `RADIO_GROUP_CONTEXT`: DI context, single-value exclusive selection
 *
 * Provides a small object (via `useFactory`, not `useExisting` — this
 * component's own `@Input() value` is the *controlled* value, `string |
 * undefined`, which can't also be the context's *resolved* value under the
 * same property name) under `RADIO_GROUP_CONTEXT` — the same DI-context
 * translation `CHECKBOX_GROUP_CONTEXT` established for `CheckboxGroup`, but
 * single-`value` rather than array-`value`, and `select()` rather than
 * `toggle()` (a radio group can only ever gain a new selected member, never
 * lose one down to nothing, by user interaction on the radios themselves —
 * mirrors native `<input type="radio">` semantics, not `Checkbox.Group`'s
 * array-toggle semantics). Every projected `<rec-radio>` with its own
 * `[value]` bound injects it `@Optional()` and defers both its checked state
 * (`groupCtx.value === thisRadio.value`) and its native `name` attribute
 * (`groupCtx.name`, shared across every member) to this context — the shared
 * `name` is what gives the *browser itself* real exclusive-selection and
 * arrow-key navigation between siblings, with no hand-rolled roving-
 * tabindex/keydown logic needed anywhere in this adapter.
 *
 * A fresh `name` is generated per `RadioGroupComponent` instance
 * (`rec-radio-group-name-N`) rather than derived from `id`/`label`, so two
 * independent `<rec-radio-group>`s on the same page never accidentally
 * collide into a single native exclusive-selection group just because their
 * labels happened to match.
 *
 * Always established (unlike `CheckboxGroup`'s `isArrayControlled` gate) —
 * a `RadioGroup` with no bound `value`/`defaultValue` still needs the shared
 * `name` wiring for its children's native exclusive-selection/arrow-key
 * behavior to work at all, so there is no "plain layout wrapper, no native
 * grouping" mode the way an ungrouped `CheckboxGroup` has.
 *
 * ## Known gap: `readOnly` approximates `ReadOnlyField`, which doesn't exist yet
 *
 * The genesis adapter's `RadioGroup.tsx` composes `WithReadOnlyWrapper` for
 * a real `readOnly` display mode — when `readOnly` is `true` (and no
 * `readOnlyComponent` override is supplied), `WithReadOnlyWrapper` swaps
 * `FormControlWrapper`'s children entirely for a `ReadOnlyField` rendering
 * of `value`/`defaultValue` as formatted text. `ReadOnlyField` is not yet
 * built in this Angular adapter (still `🚧` in `llms.txt` at the time of
 * writing) — building it was explicitly out of scope for this task, matching
 * `CheckboxGroup`'s/`Dropdown`'s own identical gap.
 *
 * **Approximation shipped instead**: this component does **not** swap its
 * children for a text rendering. Instead, `readOnly` (and `disabled`) flow
 * down through `RADIO_GROUP_CONTEXT`, and each projected `<rec-radio>`
 * switches to *its own* `readOnly` approximation (a static, non-interactive
 * circle — see `radio.component.ts`). The real radio glyphs (selected/
 * unselected, each still using their real token colors) keep rendering,
 * just non-interactively — visually closer to the golden
 * `ui-kit-radiogroup--read-only.png` screenshot (which shows a greyed-out
 * radio circle, not a plain text sentence) than a generic `ReadOnlyField`
 * text formatter would have been anyway, but it is **not** real
 * `ReadOnlyField`/`WithReadOnlyWrapper` parity — same caveat
 * `CheckboxGroupComponent`'s own doc comment already documents.
 *
 * **Follow-up**: once `ReadOnlyField`/`WithReadOnlyWrapper` exist in this
 * adapter, both `Radio` and `RadioGroup` should be revisited to compose
 * them for `readOnly`, replacing this approximation — cross-reference
 * `checkbox/IMPLEMENTATION_NOTES.md`'s identical follow-up note.
 */
@Component({
  selector: "rec-radio-group",
  imports: [FormControlWrapperComponent],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./radio-group.component.css",
  providers: [
    {
      provide: RADIO_GROUP_CONTEXT,
      useFactory: (group: RadioGroupComponent): RadioGroupContext => ({
        get value() {
          return group.resolvedValue;
        },
        get disabled() {
          return group.effectiveDisabled;
        },
        get readOnly() {
          return group.readOnly;
        },
        get name() {
          return group.name;
        },
        select: (itemValue: string) => group.select(itemValue),
      }),
      deps: [forwardRef(() => RadioGroupComponent)],
    },
    recursicaValueAccessorProvider(RadioGroupComponent),
  ],
  template: `
    <rec-form-control-wrapper
      class="root"
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
      [formLayout]="formLayout"
      [labelSize]="labelSize"
      [labelAlignment]="labelAlignment"
      [labelOptionalText]="labelOptionalText"
      [labelWithEditIcon]="labelWithEditIcon"
      [labelActionArea]="labelActionArea"
      [label]="label"
      [description]="description"
      [assistiveText]="assistiveText"
      [error]="error"
      [required]="required"
      [withAsterisk]="withAsterisk"
      (labelEditClick)="labelEditClick.emit($event)"
    >
      <div
        class="groupRoot"
        role="radiogroup"
        [attr.data-layout]="formLayout"
        [attr.aria-disabled]="effectiveDisabled ? 'true' : null"
      >
        <ng-content />
      </div>
    </rec-form-control-wrapper>
  `,
})
export class RadioGroupComponent
  implements RecursicaOverStyled, ControlValueAccessor, OnInit
{
  @Input() label?: string | TemplateRef<unknown>;
  @Input() description?: string | TemplateRef<unknown>;
  @Input() assistiveText?: string | TemplateRef<unknown>;
  @Input() error?: string | TemplateRef<unknown>;
  @Input() required = false;
  @Input() withAsterisk?: boolean;

  @Input() labelAlignment: RecursicaLabelAlignment = "left";
  @Input() labelOptionalText?: boolean | string;
  @Input() labelWithEditIcon = false;
  @Input() labelActionArea?: TemplateRef<unknown>;
  @Output() labelEditClick = new EventEmitter<MouseEvent>();

  @Input() formLayout: RecursicaFormLayout = "stacked";
  @Input() labelSize: RecursicaFormControlLabelSize = "default";

  /** Controlled selected value. Leave unbound (with `defaultValue`) for uncontrolled. */
  @Input() value?: string;
  /** Initial value for the uncontrolled case. */
  @Input() defaultValue?: string;
  @Output() valueChange = new EventEmitter<string>();

  @Input() disabled = false;

  /** Simplified read-only display — see class doc comment's "Known gap" section and IMPLEMENTATION_NOTES.md. Not real `ReadOnlyField` parity. */
  @Input() readOnly = false;

  /** Shared native `name` every member `<rec-radio>` renders — see class doc comment's "RADIO_GROUP_CONTEXT" section. Defaults to a unique per-instance id. */
  @Input() name = `rec-radio-group-name-${nextGroupId++}`;

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  private readonly _uncontrolledValue = signal<string | undefined>(undefined);

  private readonly cva = new RecursicaValueAccessor<string | undefined>();

  /**
   * Seeds the uncontrolled-`value` signal from `defaultValue` here, not in
   * a field initializer: Angular applies `@Input()`-bound values to the
   * instance *after* construction (field initializers run during
   * construction, so a field initializer reading `this.defaultValue` always
   * sees the pre-binding class-field default) but *before* `ngOnInit` — see
   * `radio.component.ts`'s own `ngOnInit` doc comment for the same fix,
   * confirmed live via Playwright there.
   */
  ngOnInit(): void {
    this._uncontrolledValue.set(this.defaultValue);
  }

  get resolvedValue(): string | undefined {
    return this.value !== undefined ? this.value : this._uncontrolledValue();
  }

  get effectiveDisabled(): boolean {
    return this.disabled || this.readOnly;
  }

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }

  select(itemValue: string): void {
    if (this.effectiveDisabled) return;
    if (this.value === undefined) {
      this._uncontrolledValue.set(itemValue);
    }
    this.valueChange.emit(itemValue);
    this.cva.notifyChange(itemValue);
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
