import { NgTemplateOutlet } from "@angular/common";
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ViewEncapsulation,
  inject,
  signal,
} from "@angular/core";
import { ControlValueAccessor } from "@angular/forms";
import {
  FormControlLayoutComponent,
  RecursicaFormControlLabelSize,
  RecursicaFormLayout,
} from "../form-control-layout/form-control-layout.component";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";
import {
  RecursicaValueAccessor,
  recursicaValueAccessorProvider,
} from "../utils/recursica-value-accessor";
import { CHECKBOX_GROUP_CONTEXT } from "./checkbox-group-context";

let nextId = 0;

/**
 * Recursica `Checkbox` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). The step-9
 * stub guessed `MatCheckbox` (`checkbox.d.ts`) as the Material candidate —
 * re-investigated against the real compiled source
 * (`node_modules/@angular/material/fesm2022/checkbox.mjs`,
 * `@angular/material@20.2.14`) before writing any code, the same rigor
 * `Tabs`/`Stepper`/`Chip`/`Dropdown` already applied to their own Material
 * candidates. Unlike those four (all rejected for content-projection /
 * `ViewEncapsulation.None` structural reasons), `MatCheckbox` is a much
 * smaller, less templated component — worth taking seriously, and it comes
 * close, but it still doesn't survive contact:
 *
 * 1. **No `ViewEncapsulation.None`.** Confirmed by its absence from the
 *    compiled `ɵcmp` metadata (`grep -c encapsulation` on `checkbox.mjs`
 *    only matches unrelated hits elsewhere in the bundle, none inside
 *    `MatCheckbox`'s own declaration) — it uses Angular's default
 *    `Emulated` encapsulation, the same as this adapter's own components.
 *    Genuinely better-behaved than `MatTabGroup`/`MatSelect`/`MatChip`.
 * 2. **But its visible box is hardcoded, not token-driven.** The compiled
 *    `.mdc-checkbox` rule is `flex: 0 0 18px; width: 18px; height: 18px`,
 *    and `.mdc-checkbox__background` is `width: 18px; height: 18px; border:
 *    2px solid currentColor; border-radius: 2px` — all four literal pixel
 *    values, not `--mat-checkbox-*` custom properties (unlike its color
 *    story, which *is* fully theme-token-driven: `--mat-checkbox-selected-
 *    icon-color`, etc.). Recursica's own token for this exact box is
 *    `--recursica_ui-kit_components_checkbox_properties_size: 24px` (not
 *    18px), with its own `border-radius` (`--recursica_brand_dimensions_border-
 *    radii_sm`, not a hardcoded `2px`). Getting from 18px to 24px would mean
 *    overriding `.mdc-checkbox`/`.mdc-checkbox__background` directly — real
 *    classes, reachable in principle since there's no `ViewEncapsulation.None`
 *    involved, but *not* through `MatCheckbox`'s own documented `--mat-
 *    checkbox-*` theming API, and only from a global (unscoped, or
 *    `::ng-deep`) stylesheet reaching past this component's own Emulated
 *    boundary into a *different* component's Emulated boundary — the same
 *    "global stylesheet needed to reach past a nested component's own view"
 *    category `dropdown/IMPLEMENTATION_NOTES.md`'s `dropdown-overlay.css`
 *    finding already documents, just triggered by hardcoded sizing instead
 *    of a CDK-overlay reparent.
 * 3. **The checkmark/indeterminate-dash are fixed, un-slotted SVG/CSS.**
 *    `.mdc-checkbox__checkmark` is a literal `<svg><path d="M1.73,12.91
 *    8.1,19.28 22.79,4.59"/></svg>` baked into `MatCheckbox`'s own template
 *    (no `<ng-content>`/input slot for it), and `.mdc-checkbox__mixedmark`
 *    is a plain CSS bar, not a projectable icon. Only their *color* is
 *    themeable; their *shape/size* is fixed at whatever the hardcoded 18px
 *    box dictates. Recursica's own `--recursica_ui-kit_components_checkbox_
 *    properties_icon-size` (`--recursica_brand_dimensions_icons_sm`) is a
 *    separate, independently-sized token from the box itself — no
 *    `MatCheckbox` knob for that relationship either.
 *
 * **Decision**: hand-build on a real `<input type="checkbox">` (`appearance:
 * none`, matching the genesis adapter's own `Checkbox.module.css` reset)
 * plus a custom SVG check/indeterminate glyph, exactly the same shape as
 * `dropdown.component.css`'s trigger — full token control over box size,
 * border, radius, and icon, with zero fighting against MDC's own hardcoded
 * geometry. This is *not* "assumed rejected because priors were" — findings
 * 2 and 3 are the first two rejections in this adapter driven by hardcoded
 * **pixel geometry** rather than DOM-shape/content-projection mismatches,
 * and are called out as a materially different (and closer) category in
 * IMPLEMENTATION_NOTES.md.
 *
 * ## Does `Checkbox` compose `FormControlWrapper`? No — confirmed against the reference, not assumed
 *
 * Unlike `Dropdown` (which provides `RECURSICA_FORM_CONTROL` and is meant
 * to be composed inside a caller-written `<rec-form-control-wrapper>`), the
 * genesis adapter's own `Checkbox.tsx` **never** touches `FormControlWrapper`
 * at all. Its `label` renders directly beside the box (`.body` → `.inner`
 * (box) + `.labelWrapper` → `.label`, all from `Checkbox.module.css`), not
 * above/beside the control the way a `TextField`'s label sits — there is no
 * `id`/`aria-describedby` wiring to a separate label component to speak of.
 * The only layout composition `Checkbox.tsx` does is an *optional*
 * `FormControlLayout` wrap (`formLayout`/`labelSize`/`controlMaxWidth`/
 * `controlMinWidth`, flattened onto `Checkbox`'s own prop surface) purely to
 * align a lone checkbox's horizontal position against sibling fields in a
 * `side-by-side` form — `FormControlLayout`'s own `leftSection` stays empty
 * in that case (no label passed to it), it just reserves the column width.
 * `CheckboxComponent` mirrors this exactly: it does **not** implement
 * `RECURSICA_FORM_CONTROL`/provide itself to an ancestor
 * `FormControlWrapperComponent`'s `ContentChild` query — there is nothing
 * for that query to usefully attach to here (no top/side label, no
 * `aria-describedby` target beyond the box itself). `CheckboxGroupComponent`
 * is the one that composes `FormControlWrapperComponent` (see its own doc
 * comment) — matching the genesis adapter's `CheckboxGroup.tsx`, which is
 * the component that actually wraps `WithReadOnlyWrapper`/`FormControlWrapper`,
 * never `Checkbox.tsx` itself.
 *
 * ## Group membership: `CHECKBOX_GROUP_CONTEXT`, `@Optional()`
 *
 * When nested inside a `<rec-checkbox-group>` bound to `value`/
 * `(valueChange)`, and this checkbox has its own `[value]` set, its checked
 * state and toggling defer entirely to the injected group context (mirrors
 * `CheckboxGroup.tsx`'s documented finding that Mantine's real
 * `Checkbox.Group` forces each child's `checked` from context, "even one
 * given neither `value` nor `defaultValue`" — same override priority here).
 * Outside a group (or inside one with no bound `value` on this checkbox),
 * `checked`/`defaultChecked`/`(checkedChange)` behave as an ordinary
 * controlled/uncontrolled boolean, the same convention `Chip`'s own
 * `checked`/`defaultChecked`/`(checkedChange)` already established.
 *
 * ## Known gap: `readOnly` approximates `ReadOnlyField`, which doesn't exist yet
 *
 * See IMPLEMENTATION_NOTES.md's "ReadOnlyField gap" section — same
 * treatment `Dropdown` already gave this identical gap.
 */
@Component({
  selector: "rec-checkbox",
  imports: [NgTemplateOutlet, FormControlLayoutComponent],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./checkbox.component.css",
  providers: [recursicaValueAccessorProvider(CheckboxComponent)],
  template: `
    @if (formLayout) {
      <rec-form-control-layout
        [formLayout]="formLayout"
        [labelSize]="labelSize"
        [controlMaxWidth]="controlMaxWidth"
        [controlMinWidth]="controlMinWidth"
      >
        <ng-container [ngTemplateOutlet]="checkboxTpl" />
      </rec-form-control-layout>
    } @else {
      <ng-container [ngTemplateOutlet]="checkboxTpl" />
    }

    <ng-template #checkboxTpl>
      <div
        class="root"
        [class]="resolvedOverStyle.class"
        [style]="resolvedOverStyle.style"
      >
        @if (effectiveReadOnly) {
          <!--
            Simplified read-only approximation — no real ReadOnlyField/
            WithReadOnlyWrapper yet (see IMPLEMENTATION_NOTES.md's
            "ReadOnlyField gap" section). Same token-driven box/icon/label
            look, no input element, no interactivity.
          -->
          <div class="body readOnlyDisplay" aria-readonly="true">
            <span class="inner">
              <span
                class="input"
                [class.inputChecked]="checkedValue && !indeterminate"
                [class.inputIndeterminate]="indeterminate"
                [attr.aria-checked]="
                  indeterminate ? 'mixed' : checkedValue ? 'true' : 'false'
                "
                role="checkbox"
              ></span>
              @if (checkedValue || indeterminate) {
                <svg
                  class="icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  @if (indeterminate) {
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  } @else {
                    <polyline points="20 6 9 17 4 12"></polyline>
                  }
                </svg>
              }
            </span>
            @if (label) {
              <span class="labelWrapper">
                <span class="label">
                  @if (isTemplate(label)) {
                    <ng-container [ngTemplateOutlet]="asTemplate(label)" />
                  } @else {
                    {{ label }}
                  }
                </span>
              </span>
            }
          </div>
        } @else {
          <label class="body">
            <span class="inner">
              <input
                type="checkbox"
                class="input"
                [id]="id"
                [checked]="checkedValue"
                [indeterminate]="indeterminate"
                [attr.data-indeterminate]="indeterminate ? '' : null"
                [disabled]="effectiveDisabled"
                [required]="required"
                [attr.name]="name ?? null"
                [attr.value]="value ?? null"
                (change)="onChange($event)"
              />
              @if (checkedValue || indeterminate) {
                <svg
                  class="icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  @if (indeterminate) {
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  } @else {
                    <polyline points="20 6 9 17 4 12"></polyline>
                  }
                </svg>
              }
            </span>
            @if (label) {
              <span class="labelWrapper">
                <span class="label">
                  @if (isTemplate(label)) {
                    <ng-container [ngTemplateOutlet]="asTemplate(label)" />
                  } @else {
                    {{ label }}
                  }
                </span>
              </span>
            }
          </label>
        }
      </div>
    </ng-template>
  `,
})
export class CheckboxComponent
  implements RecursicaOverStyled, ControlValueAccessor, OnInit
{
  @Input() label?: string | TemplateRef<unknown>;

  /** Controlled `checked`. Leave unbound for uncontrolled (see class doc comment). Ignored when this checkbox is a value-bound member of a `<rec-checkbox-group>`. */
  @Input() checked?: boolean;
  /** Initial `checked` for the uncontrolled, non-grouped case. */
  @Input() defaultChecked = false;
  @Output() checkedChange = new EventEmitter<boolean>();

  /**
   * Visual indeterminate ("mixed") state — independent of `checked`,
   * matching the genesis adapter's own `indeterminate?: boolean` ("If set,
   * `checked` prop is ignored" per the real `CheckboxProps.d.ts`). Drives
   * both the real DOM `indeterminate` IDL property (for the accessibility
   * tree — reflected automatically by browsers as `aria-checked="mixed"`,
   * not set manually here) and `Checkbox.module.css`'s
   * `.input[data-indeterminate]` visual state.
   */
  @Input() indeterminate = false;

  @Input() disabled = false;
  @Input() required = false;

  /** This checkbox's identifying value when nested in a value-bound `<rec-checkbox-group>` — also rendered as the native input's `value` attribute. */
  @Input() value?: string;
  @Input() name?: string;

  /**
   * Simplified read-only display — see class doc comment's "Known gap"
   * section and IMPLEMENTATION_NOTES.md. Not real `ReadOnlyField` parity.
   * Defers to the group's own `readOnly` when nested in a group (see
   * `effectiveReadOnly`).
   */
  @Input() readOnly = false;

  @Input() formLayout?: RecursicaFormLayout;
  @Input() labelSize: RecursicaFormControlLabelSize = "default";
  @Input() controlMaxWidth?: string;
  @Input() controlMinWidth?: string;

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  private readonly baseId = `rec-checkbox-${nextId++}`;
  @Input() id = this.baseId;

  private readonly _uncontrolledChecked = signal(false);

  private readonly groupCtx = inject(CHECKBOX_GROUP_CONTEXT, {
    optional: true,
  });

  private readonly cva = new RecursicaValueAccessor<boolean>();

  ngOnInit(): void {
    this._uncontrolledChecked.set(this.defaultChecked);
  }

  /** True while this checkbox both has a group context *and* an identifying `value` bound — the only case the group actually drives its state (mirrors `CheckboxGroup.tsx`'s `isArrayControlled` gate). */
  get isGroupMember(): boolean {
    return this.groupCtx != null && this.value !== undefined;
  }

  get checkedValue(): boolean {
    if (this.isGroupMember) {
      return this.groupCtx!.value.includes(this.value!);
    }
    return this.checked !== undefined
      ? this.checked
      : this._uncontrolledChecked();
  }

  get effectiveDisabled(): boolean {
    return (
      this.disabled || (this.isGroupMember ? this.groupCtx!.disabled : false)
    );
  }

  get effectiveReadOnly(): boolean {
    return (
      this.readOnly || (this.isGroupMember ? this.groupCtx!.readOnly : false)
    );
  }

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }

  isTemplate(value: unknown): value is TemplateRef<unknown> {
    return value instanceof TemplateRef;
  }

  asTemplate(
    value: string | TemplateRef<unknown> | undefined,
  ): TemplateRef<unknown> | null {
    return this.isTemplate(value) ? value : null;
  }

  onChange(event: Event): void {
    const nextChecked = (event.target as HTMLInputElement).checked;
    if (this.isGroupMember) {
      this.groupCtx!.toggle(this.value!);
      return;
    }
    if (this.checked === undefined) {
      this._uncontrolledChecked.set(nextChecked);
    }
    this.checkedChange.emit(nextChecked);
    this.cva.notifyChange(nextChecked);
    this.cva.notifyTouched();
  }

  writeValue(value: boolean): void {
    this.checked = value;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.cva.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.cva.registerOnTouched(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
