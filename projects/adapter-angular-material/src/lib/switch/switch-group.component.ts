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
import {
  SWITCH_GROUP_CONTEXT,
  SwitchGroupContext,
} from "./switch-group-context";

/**
 * Recursica `SwitchGroup` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). No Angular
 * Material equivalent investigated separately — it's a pure composition
 * layer (label/description/assistive-text/error chrome + an array-tracked
 * list of `Switch`es), not a Material-wrappable widget on its own;
 * `switch.component.ts`'s own class doc comment covers the `MatSlideToggle`
 * investigation this group's children are built on.
 *
 * ## Composes `FormControlWrapperComponent` directly — mirrors `WithReadOnlyWrapper`, same pattern `CheckboxGroup`/`RadioGroup` already established
 *
 * Unlike `Switch` itself (which doesn't provide `RECURSICA_FORM_CONTROL` and
 * is meant to be composed *inside* a caller-written
 * `<rec-form-control-wrapper>`), the genesis adapter's own `SwitchGroup.tsx`
 * renders `WithReadOnlyWrapper` — which itself always renders a real
 * `FormControlWrapper` — **internally**, flattening `label`/`description`/
 * `assistiveText`/`error`/`required`/`withAsterisk`/the `labelAlignment`/
 * `labelOptionalText`/`labelWithEditIcon`/`onLabelEditClick` trio onto
 * `SwitchGroup`'s own prop surface. `SwitchGroupComponent` mirrors this
 * exactly — the same composition `CheckboxGroupComponent`/
 * `RadioGroupComponent` already established for their own identical
 * `CheckboxGroup.tsx`/`RadioGroup.tsx` shape.
 *
 * `labelElement="div"` from the reference (`WithReadOnlyWrapper`'s
 * `Switch.Group`-specific override — "ARIA grouping prohibits interactive
 * switches nested natively inside `<label>`") needs no separate translation
 * here either, for the same reason `CheckboxGroupComponent`'s/
 * `RadioGroupComponent`'s own doc comments already give:
 * `FormControlWrapperComponent`'s `Label` is never nested around the switch
 * list to begin with.
 *
 * ## `SWITCH_GROUP_CONTEXT`: DI context, array membership — confirmed from source, not assumed from `RadioGroup`'s precedent
 *
 * The task brief explicitly flagged this as unverified ("could be
 * multi-select like `CheckboxGroup`, or something else — verify from
 * source, don't assume"). Checked directly against `SwitchGroup.tsx`:
 * `RecursicaSwitchGroupProps`'s `value`/`onChange` are `string[]`/
 * `(value: string[]) => void` — the exact same array-membership shape
 * `CheckboxGroup.tsx` established, **not** `RadioGroup.tsx`'s single-value
 * exclusive selection. `SWITCH_GROUP_CONTEXT` (`switch-group-context.ts`)
 * is therefore modeled on `CHECKBOX_GROUP_CONTEXT` (`toggle()`, array
 * `value`), not `RADIO_GROUP_CONTEXT` (`select()`, single `value` + shared
 * native `name`) — every projected `<rec-switch>` with its own `[value]`
 * bound injects it `@Optional()` and defers its checked state/toggling to
 * `toggle()` (see `switch.component.ts`'s "Group membership" section),
 * matching `CheckboxGroupComponent`'s own documented finding. Provided via
 * `useFactory` (not `useExisting`) for the same reason
 * `CHECKBOX_GROUP_CONTEXT`'s own doc comment gives: this component's own
 * `@Input() value` is the *controlled* value, `string[] | undefined`, which
 * can't also be the context's *resolved*, always-concrete `readonly
 * string[]` under the same property name.
 *
 * Only actually drives children when array-controlled (`value` or
 * `defaultValue` bound on `<rec-switch-group>`) **and** the child itself has
 * `[value]` set — mirrors `CheckboxGroup.tsx`'s own `isArrayControlled`
 * gate. An uncontrolled group with unvalued children behaves as a plain
 * layout wrapper, each child managing its own `checked`/`defaultChecked`
 * independently.
 *
 * ## Known gap: `readOnly` approximates `ReadOnlyField`, which doesn't exist yet
 *
 * The genesis adapter's `SwitchGroup.tsx` composes `WithReadOnlyWrapper` for
 * a real `readOnly` display mode — when `readOnly` is `true` (and no
 * `readOnlyComponent` override is supplied), `WithReadOnlyWrapper` swaps
 * `FormControlWrapper`'s children entirely for a `ReadOnlyField` rendering
 * of `value`/`defaultValue` as formatted text. `ReadOnlyField` is not yet
 * built in this Angular adapter (still `🚧` in `llms.txt` at the time of
 * writing) — building it was explicitly out of scope for this task, matching
 * `CheckboxGroup`'s/`RadioGroup`'s own identical gap.
 *
 * **Approximation shipped instead**: this component does **not** swap its
 * children for a text rendering. Instead, `readOnly` (and `disabled`) flow
 * down through `SWITCH_GROUP_CONTEXT`, and each projected `<rec-switch>`
 * switches to *its own* `readOnly` approximation (a static, non-interactive
 * track/thumb — see `switch.component.ts`). The real switch glyphs
 * (checked/unchecked, each still using their real token colors) keep
 * rendering, just non-interactively — visually closer to the golden
 * `ui-kit-switchgroup--read-only.png` screenshot (which shows greyed-out
 * switch tracks, not a plain comma-joined text list) than a generic
 * `ReadOnlyField` text formatter would have been anyway, but it is **not**
 * real `ReadOnlyField`/`WithReadOnlyWrapper` parity — same caveat
 * `CheckboxGroupComponent`'s/`RadioGroupComponent`'s own doc comments
 * already document.
 *
 * **Follow-up**: once `ReadOnlyField`/`WithReadOnlyWrapper` exist in this
 * adapter, both `Switch` and `SwitchGroup` should be revisited to compose
 * them for `readOnly`, replacing this approximation — cross-reference
 * `checkbox/IMPLEMENTATION_NOTES.md`'s identical follow-up note.
 *
 * ## `controlMaxWidth`/`controlMinWidth` intentionally not exposed
 *
 * Matches `SwitchGroup.tsx`'s own documented finding (`SWITCH_IMPLEMENTATION_
 * NOTES.md`'s final section): passing the switch-item's own inline
 * label-max-width token (200px) as the group's `controlMaxWidth` made the
 * mandatory side-by-side label column (fixed 224px) overflow, since it's
 * wider than that cap. Fixed upstream by not capping the group's control
 * width at all — each switch's own label already wraps at its own
 * `--recursica_ui-kit_components_switch-item_properties_label-max-width`
 * token via `.labelWrapper` (see `switch.component.css`), so no group-level
 * cap is needed. `RecursicaFormControlWrapperProps`'s `controlMaxWidth`/
 * `controlMinWidth` are therefore omitted from this component's own prop
 * surface entirely (mirrors the reference's own `Omit<RecursicaFormControlWrapperProps,
 * "controlMaxWidth" | "controlMinWidth">`), rather than exposed-but-unused.
 */
@Component({
  selector: "rec-switch-group",
  imports: [FormControlWrapperComponent],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./switch-group.component.css",
  providers: [
    {
      provide: SWITCH_GROUP_CONTEXT,
      useFactory: (group: SwitchGroupComponent): SwitchGroupContext => ({
        get value() {
          return group.resolvedValue;
        },
        get disabled() {
          return group.effectiveDisabled;
        },
        get readOnly() {
          return group.readOnly;
        },
        toggle: (itemValue: string) => group.toggle(itemValue),
      }),
      deps: [forwardRef(() => SwitchGroupComponent)],
    },
    recursicaValueAccessorProvider(SwitchGroupComponent),
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
        role="group"
        [attr.data-layout]="formLayout"
        [attr.aria-disabled]="effectiveDisabled ? 'true' : null"
      >
        <ng-content />
      </div>
    </rec-form-control-wrapper>
  `,
})
export class SwitchGroupComponent
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

  /** Controlled selected-values array. Leave unbound (with `defaultValue`) for uncontrolled. */
  @Input() value?: string[];
  /** Initial value for the uncontrolled case. */
  @Input() defaultValue: string[] = [];
  @Output() valueChange = new EventEmitter<string[]>();

  @Input() disabled = false;

  /** Simplified read-only display — see class doc comment's "Known gap" section and IMPLEMENTATION_NOTES.md. Not real `ReadOnlyField` parity. */
  @Input() readOnly = false;

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  private readonly _uncontrolledValue = signal<string[]>([]);

  private readonly cva = new RecursicaValueAccessor<string[] | undefined>();

  ngOnInit(): void {
    this._uncontrolledValue.set(this.defaultValue);
  }

  get resolvedValue(): readonly string[] {
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

  toggle(itemValue: string): void {
    if (this.effectiveDisabled) return;
    const current = this.resolvedValue;
    const next = current.includes(itemValue)
      ? current.filter((v) => v !== itemValue)
      : [...current, itemValue];
    if (this.value === undefined) {
      this._uncontrolledValue.set(next);
    }
    this.valueChange.emit(next);
    this.cva.notifyChange(next);
    this.cva.notifyTouched();
  }

  writeValue(value: string[] | undefined): void {
    this.value = value;
  }

  registerOnChange(fn: (value: string[] | undefined) => void): void {
    this.cva.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.cva.registerOnTouched(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
