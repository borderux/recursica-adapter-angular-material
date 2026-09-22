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
import {
  FormControlLayoutComponent,
  RecursicaFormControlLabelSize,
  RecursicaFormLayout,
} from "../form-control-layout/form-control-layout.component";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";
import { RADIO_GROUP_CONTEXT } from "./radio-group-context";

let nextId = 0;

/**
 * Recursica `Radio` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). The step-9
 * stub guessed `MatRadioButton` (`radio.d.ts`) as the Material candidate —
 * re-investigated against the real compiled source
 * (`node_modules/@angular/material/fesm2022/radio.mjs`,
 * `@angular/material@20.2.14`) before writing any code, rather than assuming
 * the same verdict `Checkbox` already reached for `MatCheckbox` just because
 * the two widgets look similar at a glance:
 *
 * 1. **No `ViewEncapsulation.None`.** Confirmed by its absence from the
 *    compiled `ɵcmp` metadata (`type: MatRadioButton, isStandalone: true,
 *    ...` declaration block has no `encapsulation` key at all) — default
 *    `Emulated`, same as `MatCheckbox` and every component in this adapter.
 * 2. **But its visible circle is hardcoded pixels, not a theming token —
 *    the exact same rejection category `Checkbox` already hit.** The
 *    compiled CSS (`grep`-extracted directly from the `styles: [...]`
 *    array, not inferred): `.mdc-radio{width:20px;height:20px;...}` and
 *    `.mdc-radio__background{width:20px;height:20px}`, with
 *    `.mdc-radio__outer-circle{border-width:2px;border-style:solid;
 *    border-radius:50%}` — all literal pixels. Recursica's own token for
 *    this exact circle — `--recursica_ui-kit_components_radio-button_
 *    properties_size` — resolves to **24px** (confirmed in
 *    `recursica_variables_scoped.css`), not 20px, with its own
 *    `border-size` token, not a hardcoded `2px`. The *only* size-shaped
 *    custom property `MatRadioButton` exposes is
 *    `--mat-radio-state-layer-size` (default `40px`) — the invisible
 *    ripple/touch-target padding around the 20px circle, not the circle
 *    itself; there is no `--mat-radio-size`-equivalent knob. Exactly like
 *    `MatCheckbox`, `MatRadioButton`'s *color* story (`--mat-radio-
 *    selected-icon-color`, `--mat-radio-disabled-selected-icon-color`,
 *    etc.) *is* fully custom-property-driven — only its geometry isn't.
 * 3. **The selected dot is fixed, un-slotted markup, not a projectable
 *    icon.** `.mdc-radio__inner-circle` is a plain CSS circle
 *    (`border-radius:50%`) shown/hidden via `transform:scale(0)`/
 *    `scale(1)` — not an SVG, no `<ng-content>`/input slot for a caller-
 *    supplied icon, and no independent size token relationship the way
 *    Recursica's own `--recursica_ui-kit_components_radio-button_
 *    properties_icon-size` (a token distinct from the box itself) assumes.
 *
 * Getting from 20px to 24px would mean overriding `.mdc-radio`/
 * `.mdc-radio__background`/`.mdc-radio__native-control` (whose own
 * `width`/`height` also hardcode `var(--mat-radio-state-layer-size, 40px)`,
 * itself built from the 20px circle, not the token) directly — reachable in
 * principle (no `ViewEncapsulation.None`), but not through
 * `MatRadioButton`'s own documented `--mat-radio-*` theming API, and only by
 * reaching past this component's Emulated boundary into a different
 * component's Emulated boundary, same "global stylesheet needed to reach
 * past a nested component's own view" category `checkbox/
 * IMPLEMENTATION_NOTES.md` and `dropdown/IMPLEMENTATION_NOTES.md` already
 * document.
 *
 * **Decision**: hand-build on a real `<input type="radio">` (`appearance:
 * none`, matching the genesis adapter's own `Radio.module.css` reset) plus a
 * custom SVG dot glyph — same shape `checkbox.component.ts`'s SVG check
 * glyph already uses, just a filled circle instead of a checkmark path (the
 * genesis adapter's own `RadioIcon`: `<circle cx="8" cy="8" r="5" />` on a
 * `viewBox="0 0 16 16"`). Full token control over circle size, border,
 * radius (`--recursica_ui-kit_components_radio-button_properties_border-
 * radius`, which itself resolves to a fully-round pill value — see
 * `radio.component.css`), and icon size, zero fighting against MDC's own
 * hardcoded geometry. Genuinely re-verified, not defaulted to `Checkbox`'s
 * verdict on precedent alone — it happens to land the same way, for the
 * same *category* of reason (hardcoded pixel geometry on an otherwise
 * Emulated-encapsulated, close-but-not-quite-compatible component), and
 * that overlap is real, not assumed.
 *
 * ## Does `Radio` compose `FormControlWrapper`? No — same pattern `Checkbox` already established
 *
 * Checked directly against the genesis adapter's `Radio.tsx`: it never
 * touches `FormControlWrapper` either. `label` renders directly beside the
 * circle (`.body` → `.inner` (circle) + `.labelWrapper` → `.label`, all
 * from `Radio.module.css`), with the same optional `FormControlLayout` wrap
 * (`formLayout`/`labelSize`/`controlMaxWidth`/`controlMinWidth`) purely to
 * align a lone radio's horizontal position against sibling fields in a
 * `side-by-side` form. `RadioComponent` mirrors this exactly — it does
 * **not** provide `RECURSICA_FORM_CONTROL`; `RadioGroupComponent` is the one
 * that composes `FormControlWrapperComponent` (see its own doc comment),
 * matching `RadioGroup.tsx`, which is the component that actually wraps
 * `WithReadOnlyWrapper`/`FormControlWrapper`, never `Radio.tsx` itself.
 *
 * ## Group membership: `RADIO_GROUP_CONTEXT`, `@Optional()` — exclusive selection, native semantics
 *
 * When nested inside a `<rec-radio-group>` bound to `value`/
 * `(valueChange)`, and this radio has its own `[value]` set, its checked
 * state and selection defer entirely to the injected group context —
 * `checkedValue` becomes `groupCtx.value === this.value` (at most one
 * sibling ever true, by construction) and `onChange` calls
 * `groupCtx.select(this.value)` rather than toggling anything (a radio can
 * only be turned *on* by user interaction — the browser's own native
 * exclusive-selection deselects the previously-checked sibling
 * automatically, since every group member renders the *same* `name`
 * attribute sourced from `groupCtx.name`). This is also what gives the
 * group real **native keyboard arrow-key navigation between siblings for
 * free** — no hand-rolled roving-tabindex/keydown handler needed, since
 * that behavior is built into the browser's own handling of same-`name`
 * radio inputs, not something this adapter has to reimplement.
 *
 * Outside a group (or inside one with no bound `value` on this radio),
 * `checked`/`defaultChecked`/`(checkedChange)` behave as an ordinary
 * controlled/uncontrolled boolean, the same convention `Checkbox`/`Chip`
 * already established — with its own standalone `name`, defaulting to a
 * per-instance generated id so an ungrouped `<rec-radio>` doesn't
 * accidentally exclusively-pair itself with an unrelated one elsewhere on
 * the page purely by both leaving `name` unset.
 *
 * ## Known gap: `readOnly` approximates `ReadOnlyField`, which doesn't exist yet
 *
 * See IMPLEMENTATION_NOTES.md's "ReadOnlyField gap" section — same
 * treatment `Checkbox`/`Dropdown` already gave this identical gap.
 */
@Component({
  selector: "rec-radio",
  imports: [NgTemplateOutlet, FormControlLayoutComponent],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./radio.component.css",
  template: `
    @if (formLayout) {
      <rec-form-control-layout
        [formLayout]="formLayout"
        [labelSize]="labelSize"
        [controlMaxWidth]="controlMaxWidth"
        [controlMinWidth]="controlMinWidth"
      >
        <ng-container [ngTemplateOutlet]="radioTpl" />
      </rec-form-control-layout>
    } @else {
      <ng-container [ngTemplateOutlet]="radioTpl" />
    }

    <ng-template #radioTpl>
      <div
        class="root"
        [class]="resolvedOverStyle.class"
        [style]="resolvedOverStyle.style"
      >
        @if (effectiveReadOnly) {
          <!--
            Simplified read-only approximation — no real ReadOnlyField/
            WithReadOnlyWrapper yet (see IMPLEMENTATION_NOTES.md's
            "ReadOnlyField gap" section). Same token-driven circle/icon/label
            look, no input element, no interactivity.
          -->
          <div class="body readOnlyDisplay" aria-readonly="true">
            <span class="inner">
              <span
                class="radio"
                [class.radioChecked]="checkedValue"
                [attr.aria-checked]="checkedValue ? 'true' : 'false'"
                role="radio"
              ></span>
              @if (checkedValue) {
                <svg
                  class="icon"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <circle cx="8" cy="8" r="5" />
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
                type="radio"
                class="radio"
                [id]="id"
                [checked]="checkedValue"
                [disabled]="effectiveDisabled"
                [required]="required"
                [attr.name]="effectiveName"
                [attr.value]="value ?? null"
                (change)="onChange($event)"
              />
              @if (checkedValue) {
                <svg
                  class="icon"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <circle cx="8" cy="8" r="5" />
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
export class RadioComponent implements RecursicaOverStyled, OnInit {
  @Input() label?: string | TemplateRef<unknown>;

  /** Controlled `checked`. Leave unbound for uncontrolled (see class doc comment). Ignored when this radio is a value-bound member of a `<rec-radio-group>`. */
  @Input() checked?: boolean;
  /** Initial `checked` for the uncontrolled, non-grouped case. */
  @Input() defaultChecked = false;
  @Output() checkedChange = new EventEmitter<boolean>();

  @Input() disabled = false;
  @Input() required = false;

  /** This radio's identifying value when nested in a value-bound `<rec-radio-group>` — also rendered as the native input's `value` attribute. */
  @Input() value?: string;

  /**
   * Native `name` attribute for the standalone (non-grouped) case — two
   * standalone radios sharing a `name` would natively exclusively-select
   * each other, so this defaults to a unique per-instance id rather than
   * being left empty. Ignored when this radio is a value-bound member of a
   * `<rec-radio-group>` (the group's own shared `name`, from
   * `RADIO_GROUP_CONTEXT`, wins — see `effectiveName`).
   */
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

  private readonly baseId = `rec-radio-${nextId++}`;
  @Input() id = this.baseId;
  private readonly defaultName = `rec-radio-name-${nextId++}`;

  private readonly _uncontrolledChecked = signal(false);

  private readonly groupCtx = inject(RADIO_GROUP_CONTEXT, { optional: true });

  /**
   * Seeds the uncontrolled-`checked` signal from `defaultChecked` here,
   * not in the constructor: Angular applies `@Input()`-bound values to the
   * instance *after* the constructor runs (constructor-time
   * `this.defaultChecked` is always still the class-field default, `false`,
   * never a template-bound `true`) but *before* `ngOnInit` — confirmed live
   * via Playwright against the `CheckedState`/`DisabledChecked` golden
   * stories, which render unchecked without this fix despite
   * `[defaultChecked]="true"`. See IMPLEMENTATION_NOTES.md's own note on
   * this (and its cross-reference to the identical latent bug already
   * shipped in `checkbox.component.ts`, out of scope to fix here).
   */
  ngOnInit(): void {
    this._uncontrolledChecked.set(this.defaultChecked);
  }

  /** True while this radio both has a group context *and* an identifying `value` bound — the only case the group actually drives its state (mirrors `CheckboxComponent.isGroupMember`, exclusive-selection version). */
  get isGroupMember(): boolean {
    return this.groupCtx != null && this.value !== undefined;
  }

  get checkedValue(): boolean {
    if (this.isGroupMember) {
      return this.groupCtx!.value === this.value;
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

  /** The group's shared `name` when a group member (required for native exclusive-selection + arrow-key nav across siblings), else this radio's own `name`/generated fallback. */
  get effectiveName(): string {
    return this.isGroupMember
      ? this.groupCtx!.name
      : (this.name ?? this.defaultName);
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
      // A native radio's own `change` only ever fires when it *becomes*
      // checked (never when the browser deselects it as a side effect of a
      // sibling being selected) — always a real selection, never a toggle.
      this.groupCtx!.select(this.value!);
      return;
    }
    if (this.checked === undefined) {
      this._uncontrolledChecked.set(nextChecked);
    }
    this.checkedChange.emit(nextChecked);
  }
}
