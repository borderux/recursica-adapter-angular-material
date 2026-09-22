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
import { SWITCH_GROUP_CONTEXT } from "./switch-group-context";

let nextId = 0;

/**
 * Recursica `Switch` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). Angular
 * Material has a native `MatSlideToggle` — re-investigated against the real
 * compiled source (`node_modules/@angular/material/fesm2022/slide-toggle.mjs`,
 * `@angular/material@20.2.14`) before assuming the same rejection verdict
 * `Checkbox`/`Radio` already reached for `MatCheckbox`/`MatRadioButton`,
 * since the underlying reason for rejection turns out to be **different**,
 * not just "another close-but-hardcoded widget":
 *
 * 1. **Its track/handle geometry is genuinely custom-property-driven, not
 *    hardcoded pixels** — the opposite finding `Checkbox`/`Radio` made.
 *    Direct `grep` extraction of the compiled `styles: [...]` array:
 *    `.mdc-switch{...width:var(--mat-slide-toggle-track-width, 52px)}`,
 *    `.mdc-switch__track{...height:var(--mat-slide-toggle-track-height,
 *    32px)...}`, `.mdc-switch__handle{...width:var(--mat-slide-toggle-
 *    handle-width);height:var(--mat-slide-toggle-handle-height)...}` — every
 *    dimension that mattered for `Checkbox`'s/`Radio`'s rejection (finding
 *    2 in both of their own class doc comments) is a real `--mat-slide-
 *    toggle-*` custom property with only a *fallback* literal, not a
 *    hardcoded value. This alone would have made `MatSlideToggle` a
 *    genuinely stronger candidate than `MatCheckbox`/`MatRadioButton`.
 * 2. **But `encapsulation: ViewEncapsulation.None`** — confirmed directly in
 *    the compiled `ɵcmp` declaration (`args: [{ selector:
 *    'mat-slide-toggle', ..., encapsulation: ViewEncapsulation.None, ... }]`,
 *    also visible on the `static ɵcmp = ...ɵɵngDeclareComponent(...)`
 *    summary block). This is the **same rejection category**
 *    `MatTabGroup`/`MatSelect`/`MatChip`/`MatStepper` already hit (see
 *    `tabs/IMPLEMENTATION_NOTES.md`), not the pixel-geometry category
 *    `Checkbox`/`Radio` hit: `MatSlideToggle`'s entire visible DOM (`.mdc-
 *    switch` button, `.mdc-switch__track`, `.mdc-switch__handle`, the
 *    built-in on/off icon `<svg>`s, the `<label>`) is built inside its
 *    *own* component view. Per `docs/STYLING_SYSTEM.md` §3/§4, this
 *    adapter's own token overrides are `ViewEncapsulation.Emulated`-scoped
 *    (`_ngcontent-<hash>`-stamped) selectors — those can never reach
 *    `MatSlideToggle`'s internally-rendered elements regardless of finding
 *    1's real custom-property surface, only a global/unscoped stylesheet
 *    could (the same `menu-overlay.css`/`dropdown-overlay.css` workaround
 *    pattern, reaching past a *different* component's own Emulated-or-None
 *    view boundary — the encapsulation mode of the target doesn't change
 *    that a parent's scoped selector never stamps onto a child component's
 *    own template elements).
 * 3. **The on/off thumb icon pair is fixed, un-slotted SVG, and the wrong
 *    shape besides.** `@if (!hideIcon) { <svg class="mdc-switch__icon
 *    mdc-switch__icon--on">…checkmark path…</svg><svg class="mdc-switch__icon
 *    mdc-switch__icon--off">…horizontal-bar path…</svg> }` is baked directly
 *    into `MatSlideToggle`'s own template — no `<ng-content>`/input slot for
 *    a caller-supplied icon. `hideIcon` only toggles both on/off together;
 *    there's no way to swap in Recursica's own `CheckIcon`/`CloseIcon` pair
 *    (`Switch.tsx`'s `thumbIcon` default), which renders an X-shaped close
 *    glyph, not `MatSlideToggle`'s horizontal-bar "off" glyph. Same "fixed,
 *    un-slotted markup" category `Checkbox`'s finding 3 and `Radio`'s
 *    finding 3 already documented, just for a differently-shaped icon pair.
 *
 * **Decision**: hand-build, same as `Checkbox`/`Radio` — but for a
 * genuinely different, weaker reason (finding 2's encapsulation boundary +
 * finding 3's icon-shape mismatch, not finding 1's geometry, which is
 * actually a non-issue here). Built on a real `<input type="checkbox"
 * role="switch">` (`appearance: none`, visually hidden via the standard
 * clip-rect technique — see `switch.component.css`'s `.input` rule and its
 * own comment on why, unlike `Checkbox`'s/`Radio`'s visible styled input,
 * `Switch`'s input must be hidden while the decorative `.track`/`.thumb`
 * `<span>`s carry the visible look), wrapped in a `<label>` so a native
 * click/tap anywhere on the track or thumb forwards to the nested input with
 * zero custom hit-testing — the same delegation `Checkbox`'s/`Radio`'s own
 * `<label class="body">` wrapper already relies on. Full token control over
 * track/thumb size, radius, colors, and the real `CheckIcon`/`CloseIcon` SVG
 * pair (`Switch.module.css`'s own `.thumbIconWrapper`/`.checkIcon`/
 * `.closeIcon` structure, ported verbatim), zero fighting against MDC's own
 * `ViewEncapsulation.None` boundary or its fixed icon markup.
 *
 * ## Does `Switch` compose `FormControlWrapper`? No — same pattern `Checkbox`/`Radio` already established
 *
 * Checked directly against the genesis adapter's `Switch.tsx`: it never
 * touches `FormControlWrapper` either — `label` renders directly beside the
 * track (`.body` → track/thumb + `.labelWrapper` → `.label`, all from
 * `Switch.module.css`), with the same optional `FormControlLayout` wrap
 * (`formLayout`/`labelSize`/`controlMaxWidth`/`controlMinWidth`) purely to
 * align a lone switch's horizontal position against sibling fields in a
 * `side-by-side` form. `SwitchComponent` mirrors this exactly — it does
 * **not** provide `RECURSICA_FORM_CONTROL`; `SwitchGroupComponent` is the
 * one that composes `FormControlWrapperComponent` (see its own doc
 * comment), matching `SwitchGroup.tsx`, which is the component that
 * actually wraps `WithReadOnlyWrapper`/`FormControlWrapper`, never
 * `Switch.tsx` itself.
 *
 * ## Group membership: `SWITCH_GROUP_CONTEXT`, `@Optional()` — array membership, same shape `CheckboxGroup` already established
 *
 * Confirmed directly against `SwitchGroup.tsx` rather than assumed from
 * `Radio`'s precedent (the task brief explicitly flagged this as unverified
 * — "could be multi-select like `CheckboxGroup`, or something else"):
 * `RecursicaSwitchGroupProps`'s `value`/`onChange` are `string[]`/
 * `(value: string[]) => void` (`SWITCH_IMPLEMENTATION_NOTES.md` §5 confirms
 * this was tightened from `unknown[]` specifically to match Mantine's real
 * `Switch.Group` value type), exactly `Checkbox.Group`'s array-membership
 * shape, not `Radio.Group`'s single-value exclusive selection. When nested
 * inside a `<rec-switch-group>` bound to `value`/`(valueChange)`, and this
 * switch has its own `[value]` set, its checked state and toggling defer
 * entirely to the injected group context via `toggle()` — mirrors
 * `checkbox.component.ts`'s "Group membership" section verbatim, just
 * renamed. Outside a group (or inside one with no bound `value` on this
 * switch), `checked`/`defaultChecked`/`(checkedChange)` behave as an
 * ordinary controlled/uncontrolled boolean, the same convention `Checkbox`/
 * `Radio`/`Chip` already established.
 *
 * ## Known gap: `readOnly` approximates `ReadOnlyField`, which doesn't exist yet
 *
 * See IMPLEMENTATION_NOTES.md's "ReadOnlyField gap" section — same
 * treatment `Checkbox`/`Radio` already gave this identical gap.
 *
 * ## Not implemented: `readOnlyComponent` render-prop override (`CustomReadOnly` golden story)
 *
 * The genesis adapter's `Switch.tsx` accepts an optional `readOnlyComponent`
 * render-prop (`({ checked, label }) => ReactNode`) that, when supplied
 * alongside `readOnly`, entirely replaces the read-only presentation with
 * caller-supplied markup (`test/golden/ui-kit-switch--custom-read-only.png`
 * exercises this with a bold colored "ENABLED"/"DISABLED" text swap — see
 * `Switch.stories.tsx`'s `CustomReadOnly` story). This is a render-prop
 * override mechanism layered *on top of* the same `ReadOnlyField`/
 * `WithReadOnlyWrapper` machinery `Checkbox`/`Radio` already don't have in
 * this adapter (see "Known gap" above) — not a prerequisite blocker itself,
 * but there is no Angular equivalent of a React render-prop here to receive
 * `{ checked, label }` and no `readOnlyComponent`/`ReadOnlyField` plumbing
 * to hang it off of. Left unimplemented and documented as an open gap
 * (`IMPLEMENTATION_NOTES.md`'s "Known gap" section) rather than approximated
 * with an unverified ad-hoc mechanism.
 */
@Component({
  selector: "rec-switch",
  imports: [NgTemplateOutlet, FormControlLayoutComponent],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./switch.component.css",
  template: `
    @if (formLayout) {
      <rec-form-control-layout
        [formLayout]="formLayout"
        [labelSize]="labelSize"
        [controlMaxWidth]="controlMaxWidth"
        [controlMinWidth]="controlMinWidth"
      >
        <ng-container [ngTemplateOutlet]="switchTpl" />
      </rec-form-control-layout>
    } @else {
      <ng-container [ngTemplateOutlet]="switchTpl" />
    }

    <ng-template #switchTpl>
      <div
        class="root"
        [class]="resolvedOverStyle.class"
        [style]="resolvedOverStyle.style"
      >
        @if (effectiveReadOnly) {
          <!--
            Simplified read-only approximation — no real ReadOnlyField/
            WithReadOnlyWrapper yet (see IMPLEMENTATION_NOTES.md's
            "ReadOnlyField gap" section), and no readOnlyComponent
            render-prop equivalent (see class doc comment's "Not
            implemented" section). Same token-driven track/thumb/label
            look, no input element, no interactivity.
          -->
          <div class="body readOnlyDisplay" aria-readonly="true">
            <span
              class="track"
              [class.trackChecked]="checkedValue"
              [attr.aria-checked]="checkedValue ? 'true' : 'false'"
              role="switch"
            >
              <span class="thumb" [class.thumbChecked]="checkedValue">
                <ng-container [ngTemplateOutlet]="thumbIconTpl" />
              </span>
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
            <input
              type="checkbox"
              role="switch"
              class="input"
              [id]="id"
              [checked]="checkedValue"
              [disabled]="effectiveDisabled"
              [required]="required"
              [attr.name]="name ?? null"
              [attr.value]="value ?? null"
              (change)="onChange($event)"
            />
            <span class="track">
              <span class="thumb">
                <ng-container [ngTemplateOutlet]="thumbIconTpl" />
              </span>
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

    <ng-template #thumbIconTpl>
      @if (thumbIcon) {
        <ng-container [ngTemplateOutlet]="thumbIcon" />
      } @else {
        <span class="thumbIconWrapper">
          <svg
            class="checkIcon"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="M13.7,4.3c0.4,0.4,0.4,1,0,1.4l-6,6c-0.4,0.4-1,0.4-1.4,0l-3-3c-0.4-0.4-0.4-1,0-1.4s1-0.4,1.4,0L7,9.6l5.3-5.3C12.7,3.9,13.3,3.9,13.7,4.3z"
            />
          </svg>
          <svg
            class="closeIcon"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="M4.3,4.3c0.4-0.4,1-0.4,1.4,0L8,6.6l2.3-2.3c0.4-0.4,1-0.4,1.4,0s0.4,1,0,1.4L9.4,8l2.3,2.3c0.4,0.4,0.4,1,0,1.4s-1,0.4-1.4,0L8,9.4l-2.3,2.3c-0.4,0.4-1,0.4-1.4,0s-0.4-1,0-1.4L6.6,8L4.3,5.7C3.9,5.3,3.9,4.7,4.3,4.3z"
            />
          </svg>
        </span>
      }
    </ng-template>
  `,
})
export class SwitchComponent implements RecursicaOverStyled, OnInit {
  @Input() label?: string | TemplateRef<unknown>;

  /** Controlled `checked`. Leave unbound for uncontrolled (see class doc comment). Ignored when this switch is a value-bound member of a `<rec-switch-group>`. */
  @Input() checked?: boolean;
  /** Initial `checked` for the uncontrolled, non-grouped case. */
  @Input() defaultChecked = false;
  @Output() checkedChange = new EventEmitter<boolean>();

  @Input() disabled = false;
  @Input() required = false;

  /** This switch's identifying value when nested in a value-bound `<rec-switch-group>` — also rendered as the native input's `value` attribute. */
  @Input() value?: string;
  @Input() name?: string;

  /**
   * Optional caller override for the thumb's icon content — mirrors the
   * genesis adapter's `thumbIcon?: React.ReactNode` (`Switch.tsx`'s
   * `withCallerOverride`). Defaults to the built-in check/close SVG pair
   * (`Switch.module.css`'s own `.thumbIconWrapper`/`.checkIcon`/
   * `.closeIcon`) when left unset.
   */
  @Input() thumbIcon?: TemplateRef<unknown>;

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

  private readonly baseId = `rec-switch-${nextId++}`;
  @Input() id = this.baseId;

  private readonly _uncontrolledChecked = signal(false);

  private readonly groupCtx = inject(SWITCH_GROUP_CONTEXT, { optional: true });

  /**
   * Seeds the uncontrolled-`checked` signal from `defaultChecked` here, not
   * in the constructor or a field initializer: Angular applies `@Input()`-
   * bound values to the instance *after* construction but *before*
   * `ngOnInit` — see `radio.component.ts`'s own `ngOnInit` doc comment
   * (`checkbox.component.ts` carries the identical fix) for the full
   * explanation and the Playwright-confirmed failure mode this avoids.
   */
  ngOnInit(): void {
    this._uncontrolledChecked.set(this.defaultChecked);
  }

  /** True while this switch both has a group context *and* an identifying `value` bound — the only case the group actually drives its state (mirrors `CheckboxComponent.isGroupMember`, array-membership version). */
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
  }
}
