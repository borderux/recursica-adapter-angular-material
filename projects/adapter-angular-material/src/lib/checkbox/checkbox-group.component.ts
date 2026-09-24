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
  CHECKBOX_GROUP_CONTEXT,
  CheckboxGroupContext,
} from "./checkbox-group-context";

/**
 * Recursica `CheckboxGroup` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). No Angular
 * Material equivalent investigated separately — it's a pure composition
 * layer (label/description/assistive-text/error chrome + an array-tracked
 * list of `Checkbox`es), not a Material-wrappable widget; `checkbox.
 * component.ts`'s own class doc comment covers the `MatCheckbox`
 * investigation this group's children are built on.
 *
 * ## Composes `FormControlWrapperComponent` directly — mirrors `WithReadOnlyWrapper`, not `Dropdown`'s external-composition pattern
 *
 * Unlike `Dropdown`/`CheckboxComponent` itself (which provide
 * `RECURSICA_FORM_CONTROL` and are meant to be composed *inside* a
 * caller-written `<rec-form-control-wrapper>`), the genesis adapter's own
 * `CheckboxGroup.tsx` renders `WithReadOnlyWrapper` — which itself always
 * renders a real `FormControlWrapper` — **internally**, flattening `label`/
 * `description`/`assistiveText`/`error`/`required`/`withAsterisk`/the
 * `labelAlignment`/`labelOptionalText`/`labelWithEditIcon`/`onLabelEditClick`
 * trio onto `CheckboxGroup`'s own prop surface. `CheckboxGroupComponent`
 * mirrors this exactly: it composes `FormControlWrapperComponent` directly
 * in its own template (the same way `WithReadOnlyWrapper` always wraps
 * `FormControlWrapper`, active-or-read-only), rather than expecting a
 * caller to wrap it externally. `CheckboxGroupComponent` does **not**
 * provide `RECURSICA_FORM_CONTROL` itself — there's no ancestor
 * `FormControlWrapperComponent` for that to attach to; it *is* the
 * component composing one.
 *
 * `labelElement="div"` from the reference (`WithReadOnlyWrapper`'s
 * `Checkbox.Group`-specific override — "ARIA grouping prohibits interactive
 * checkboxes nested natively inside `<label>`") has no separate translation
 * needed here: `FormControlWrapperComponent`'s own `Label` is never nested
 * around the checkbox list to begin with (`rec-form-control-layout`'s
 * `leftSection`/`rightSection` are siblings, not parent/child), so there's
 * no native-`<label>`-wraps-interactive-content hazard to guard against.
 *
 * ## `CHECKBOX_GROUP_CONTEXT`: DI context, not React context
 *
 * Provides a small object (via `useFactory`, not `useExisting` — this
 * component's own `@Input() value` is the *controlled* value, `string[] |
 * undefined`, which can't also be the context's *resolved*, always-concrete
 * `readonly string[]`, so the two can't share one property name) under
 * `CHECKBOX_GROUP_CONTEXT` — the same DI-context translation `TABS_CONTEXT`
 * established for `Tabs`. Every projected `<rec-checkbox>` with its own
 * `[value]` bound injects it `@Optional()` and defers its checked state/
 * toggling to `toggle()` (see `checkbox.component.ts`'s "Group membership"
 * section) — matching the genesis adapter's own documented finding that
 * Mantine's real `Checkbox.Group` forces every child's `checked` from
 * context once established.
 *
 * Only established (i.e. only actually drives children) when this
 * component is array-controlled — `value` or `defaultValue` bound —
 * mirroring `CheckboxGroup.tsx`'s own `isArrayControlled` gate, which skips
 * Mantine's real `Checkbox.Group` primitive entirely for callers who only
 * want the group's layout/gap styling (e.g. `TransferList`'s ungrouped
 * rows, each with its own independently-controlled `Checkbox`). When
 * neither is bound, this component still provides the context object (so
 * DI resolution never throws), but `CheckboxComponent`'s own
 * `isGroupMember` getter additionally requires *its own* `[value]` to be
 * set before deferring to it — an uncontrolled group with unvalued children
 * behaves as a plain layout wrapper, each child managing its own
 * `checked`/`defaultChecked` independently.
 *
 * ## Known gap: `readOnly` approximates `ReadOnlyField`, which doesn't exist yet
 *
 * The genesis adapter's `CheckboxGroup.tsx` composes `WithReadOnlyWrapper`
 * for a real `readOnly` display mode — when `readOnly` is `true` (and no
 * `readOnlyComponent` override is supplied), `WithReadOnlyWrapper` swaps
 * `FormControlWrapper`'s children entirely for a `ReadOnlyField` rendering
 * of `value`/`defaultValue` as formatted text via its own `readOnlyType`/
 * `emptyValueComponent` machinery. `ReadOnlyField` is not yet built in this
 * Angular adapter (still `🚧` in `llms.txt` at the time of writing) —
 * building it was explicitly out of scope for this task, matching
 * `Dropdown`'s own identical gap.
 *
 * **Approximation shipped instead**: this component does **not** swap its
 * children for a text rendering at all. Instead, `readOnly` (and `disabled`)
 * flow down through `CHECKBOX_GROUP_CONTEXT`, and each projected
 * `<rec-checkbox>` switches to *its own* `readOnly` approximation (a static,
 * non-interactive box — see `checkbox.component.ts`). The real checkbox
 * glyphs (checked/unchecked/indeterminate, each still using their real
 * token colors) keep rendering, just non-interactively — visually closer to
 * the golden `ui-kit-checkboxgroup--read-only.png` screenshot (which shows
 * greyed-out checkbox *boxes*, not a plain comma-joined text list) than a
 * generic `ReadOnlyField` text formatter would have been anyway, but it is
 * **not** real `ReadOnlyField`/`WithReadOnlyWrapper` parity: no
 * `readOnlyComponent`/`emptyValueComponent` override support exists, and
 * there is no dedicated read-only color-token set (the approximation reuses
 * the disabled-state tokens — see `checkbox.component.css`'s
 * `.readOnlyDisplay` rules).
 *
 * **Follow-up**: once `ReadOnlyField`/`WithReadOnlyWrapper` exist in this
 * adapter, both `Checkbox` and `CheckboxGroup` should be revisited to
 * compose them for `readOnly`, replacing this approximation — cross-
 * reference `dropdown/IMPLEMENTATION_NOTES.md`'s identical follow-up note.
 */
@Component({
  selector: "rec-checkbox-group",
  imports: [FormControlWrapperComponent],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./checkbox-group.component.css",
  providers: [
    {
      provide: CHECKBOX_GROUP_CONTEXT,
      useFactory: (group: CheckboxGroupComponent): CheckboxGroupContext => ({
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
      deps: [forwardRef(() => CheckboxGroupComponent)],
    },
    recursicaValueAccessorProvider(CheckboxGroupComponent),
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
export class CheckboxGroupComponent
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
