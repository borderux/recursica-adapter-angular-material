import { NgTemplateOutlet } from "@angular/common";
import {
  Component,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  ViewEncapsulation,
  forwardRef,
} from "@angular/core";
import { MatInput } from "@angular/material/input";
import {
  RECURSICA_FORM_CONTROL,
  RecursicaFormControl,
} from "../utils/recursica-form-control";

let nextId = 0;

/**
 * Internal numeric `<input>` primitive backing `rec-number-input` — same
 * two-tier split as `TextArea`/`TextAreaControlComponent` (see that
 * component's own doc comment for why the `RECURSICA_FORM_CONTROL` provider
 * has to live on a node *inside* `rec-with-read-only-wrapper`'s projected
 * `activeTemplate`, not on the outer public component).
 *
 * ## No Angular Material / CDK candidate — confirmed, not assumed
 *
 * The stub's own `IMPLEMENTATION_NOTES.md` already flagged this as
 * "DOES NOT EXIST" in the integration report; re-checked directly against
 * `@angular/material`'s real exports before building (no `MatNumberInput`,
 * no CDK stepper-input primitive) — genuinely nothing to reject the way
 * `MatSelect`/`MatTabGroup` were rejected elsewhere. `matInput` on a native
 * `<input type="number">` is adopted for the same reason `TextField`/
 * `TextArea` adopted it (bare directive, no `ViewEncapsulation.None` DOM,
 * `MAT_FORM_FIELD`/`NgControl` both optional — confirmed `"number"` is not
 * in `matInput`'s own `MAT_INPUT_INVALID_TYPES` rejection list in the
 * compiled source).
 *
 * ## Increment/decrement: native `stepUp()`/`stepDown()`, not hand-rolled math
 *
 * `type="number"` already gives the browser's own `min`/`max`/`step`-aware
 * arrow-key spinning for free (the same "leverage native semantics instead
 * of re-implementing them" reasoning `Radio`'s shared `name` attribute
 * already used for exclusive selection). The custom up/down buttons call
 * `HTMLInputElement.stepUp()`/`stepDown()` directly rather than
 * recalculating clamped values by hand — the browser's own spec-defined
 * clamping against `min`/`max`/`step` is more correct than reimplementing
 * it, and it's the exact mechanism arrow-key spinning already uses, so both
 * paths can never disagree with each other. Native spin-button UI itself is
 * hidden via `number-input.component.css` (`appearance: textfield`, WebKit
 * inner/outer spin-button suppression) — the custom `.controls` buttons
 * replace it.
 *
 * ## Value clamping: on blur, not every keystroke
 *
 * A typed out-of-range value is clamped to `min`/`max` in `onBlur`, not on
 * every `input` event — clamping mid-keystroke would fight normal typing
 * (e.g. typing `50` one digit at a time briefly passes through `5`, which
 * could sit below `min` even though `50` itself would be valid). Matches
 * ordinary numeric-input UX (and the reference's own Mantine `NumberInput`,
 * which clamps on blur, not on change).
 *
 * **Known, documented gap**: because `value` round-trips through a real
 * `number` (not a string) between this component and its caller, a
 * trailing decimal point or trailing zeros typed mid-edit (e.g. `"10."` or
 * `"10.50"`) get silently normalized away on the next re-render (`10.50`
 * has the same numeric value as `10.5`, so the redundant zero can't survive
 * a number round-trip). No golden story exercises decimal input, so this
 * wasn't verified against a real failure — flagged here as a known
 * consequence of the `number`-typed value contract, not fixed speculatively.
 */
@Component({
  selector: "rec-number-input-control",
  imports: [MatInput, NgTemplateOutlet],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./number-input.component.css",
  providers: [
    {
      provide: RECURSICA_FORM_CONTROL,
      useExisting: forwardRef(() => NumberInputControlComponent),
    },
  ],
  template: `
    <div
      class="root"
      [attr.data-with-left-section]="leftSection ? '' : null"
      [attr.data-with-right-section]="rightSection || !hideControls ? '' : null"
      [attr.data-disabled]="disabled ? '' : null"
      [attr.data-error]="error ? '' : null"
    >
      @if (leftSection) {
        <span class="section" data-position="left">
          <ng-container [ngTemplateOutlet]="leftSection" />
        </span>
      }
      <input
        #inputEl
        matInput
        type="number"
        class="input"
        [id]="id"
        [placeholder]="placeholder ?? ''"
        [disabled]="disabled"
        [required]="required"
        [readonly]="readOnly"
        [min]="min ?? null"
        [max]="max ?? null"
        [step]="step ?? 1"
        [attr.name]="name ?? null"
        [attr.aria-describedby]="describedByAttr"
        [value]="value ?? ''"
        (input)="onInput($event)"
        (blur)="onBlur($event)"
      />
      @if (rightSection) {
        <span class="section" data-position="right">
          <ng-container [ngTemplateOutlet]="rightSection" />
        </span>
      } @else if (!hideControls) {
        <span class="controls">
          <button
            type="button"
            class="control"
            data-direction="up"
            [disabled]="disabled || readOnly"
            aria-label="Increment"
            (click)="increment(inputEl)"
          >
            <svg
              viewBox="0 0 24 24"
              width="100%"
              height="100%"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 15 12 9 18 15"></polyline>
            </svg>
          </button>
          <button
            type="button"
            class="control"
            data-direction="down"
            [disabled]="disabled || readOnly"
            aria-label="Decrement"
            (click)="decrement(inputEl)"
          >
            <svg
              viewBox="0 0 24 24"
              width="100%"
              height="100%"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </span>
      }
    </div>
  `,
})
export class NumberInputControlComponent implements RecursicaFormControl {
  @Input() value?: number;
  @Output() valueChange = new EventEmitter<number | undefined>();
  @Output() blurred = new EventEmitter<void>();

  @Input() placeholder?: string;
  @Input() name?: string;
  @Input() disabled = false;
  @Input() required = false;
  @Input() readOnly = false;

  /** Visual-only error flag — mirrors `TextField`/`TextArea`'s identical `error` input. */
  @Input() error = false;

  @Input() min?: number;
  @Input() max?: number;
  @Input() step?: number;
  @Input() hideControls = false;

  @Input() leftSection?: TemplateRef<unknown>;
  @Input() rightSection?: TemplateRef<unknown>;

  private readonly baseId = `rec-number-input-${nextId++}`;
  private _id?: string;

  @Input()
  set id(value: string | undefined) {
    this._id = value;
  }
  get id(): string {
    return this._id ?? this.baseId;
  }

  private describedByIds: string[] = [];

  get describedByAttr(): string | null {
    return this.describedByIds.length ? this.describedByIds.join(" ") : null;
  }

  setDescribedByIds(ids: string[]): void {
    this.describedByIds = ids;
  }

  onInput(event: Event): void {
    const next = (event.target as HTMLInputElement).valueAsNumber;
    this.valueChange.emit(Number.isNaN(next) ? undefined : next);
  }

  onBlur(event: Event): void {
    this.blurred.emit();
    const el = event.target as HTMLInputElement;
    if (el.value === "") {
      return;
    }
    let next = el.valueAsNumber;
    if (Number.isNaN(next)) {
      return;
    }
    if (this.min !== undefined) {
      next = Math.max(this.min, next);
    }
    if (this.max !== undefined) {
      next = Math.min(this.max, next);
    }
    if (next !== el.valueAsNumber) {
      el.valueAsNumber = next;
    }
    this.valueChange.emit(next);
  }

  increment(input: HTMLInputElement): void {
    try {
      input.stepUp();
    } catch {
      return;
    }
    this.valueChange.emit(
      Number.isNaN(input.valueAsNumber) ? undefined : input.valueAsNumber,
    );
  }

  decrement(input: HTMLInputElement): void {
    try {
      input.stepDown();
    } catch {
      return;
    }
    this.valueChange.emit(
      Number.isNaN(input.valueAsNumber) ? undefined : input.valueAsNumber,
    );
  }
}
