import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation,
} from "@angular/core";
import { CdkTextareaAutosize } from "@angular/cdk/text-field";
import { MatInput } from "@angular/material/input";
import {
  RECURSICA_FORM_CONTROL,
  RecursicaFormControl,
} from "../utils/recursica-form-control";
import { forwardRef } from "@angular/core";

let nextId = 0;

/**
 * Internal `<textarea>` primitive backing `rec-text-area`, split into its
 * own component (unlike `TextField`/`Dropdown`, which are both "the field"
 * *and* the `RECURSICA_FORM_CONTROL` provider in one class) because
 * `TextAreaComponent` composes `rec-with-read-only-wrapper` internally
 * (matching the genesis reference's own `TextArea.tsx`, which renders
 * `WithReadOnlyWrapper` directly — see `text-area.component.ts`'s class doc
 * comment). `@ContentChild(RECURSICA_FORM_CONTROL)` on `FormControlWrapper`
 * only matches a directive/component *positioned inside* the projected
 * `activeTemplate` content — `TextAreaComponent` itself is an ancestor of
 * that content, not a node within it, so it cannot be the provider itself.
 * This component's `<textarea>` element is that node.
 *
 * ## `matInput` + `cdkTextareaAutosize`: same adoption reasoning as `TextField`
 *
 * Both are bare directives (confirmed against the compiled source, same
 * rigor as `text-field.component.ts`'s own `matInput` investigation) — no
 * `ViewEncapsulation.None` DOM to fight, no `<mat-form-field>`/`NgControl`
 * requirement. `cdkTextareaAutosize`'s real behavior (dynamic min/max-height
 * inline styles derived from measured line-height) is genuinely worth using
 * for the `autosize`/`minRows`/`maxRows` inputs rather than hand-rolling it.
 *
 * **Deliberately not always-applied**: `cdkTextareaAutosize` carries static
 * host metadata (`rows="1"`, a `cdk-textarea-autosize` class that ships a
 * global `resize: none` rule) that would apply the moment the directive is
 * structurally present on the element, *regardless* of its `enabled` input —
 * forcing every non-autosize textarea to lose its native resize handle,
 * which the genesis reference's own `TextArea.module.css` never does (no
 * `resize` override there; autosize is the only path that visually removes
 * the handle). Templating the directive onto the element only in the
 * `autosize` branch (duplicating a few lines of markup, the same
 * "can't conditionally nest markup two different ways without duplicating
 * it" constraint `CheckboxComponent`'s own `#checkboxTpl` doc already
 * documents for itself) avoids relying on uncertain CSS-cascade-order
 * overrides of that static host class.
 */
@Component({
  selector: "rec-text-area-control",
  imports: [MatInput, CdkTextareaAutosize],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./text-area.component.css",
  providers: [
    {
      provide: RECURSICA_FORM_CONTROL,
      useExisting: forwardRef(() => TextAreaControlComponent),
    },
  ],
  template: `
    <div
      class="root"
      [attr.data-disabled]="disabled ? '' : null"
      [attr.data-error]="error ? '' : null"
    >
      @if (autosize) {
        <textarea
          matInput
          cdkTextareaAutosize
          class="input"
          [id]="id"
          [cdkAutosizeMinRows]="minRows ?? null"
          [cdkAutosizeMaxRows]="maxRows ?? null"
          [placeholder]="placeholder ?? ''"
          [disabled]="disabled"
          [required]="required"
          [attr.name]="name ?? null"
          [attr.aria-describedby]="describedByAttr"
          [value]="value ?? ''"
          (input)="onInput($event)"
        ></textarea>
      } @else {
        <textarea
          matInput
          class="input"
          [id]="id"
          [placeholder]="placeholder ?? ''"
          [disabled]="disabled"
          [required]="required"
          [attr.name]="name ?? null"
          [attr.aria-describedby]="describedByAttr"
          [value]="value ?? ''"
          (input)="onInput($event)"
        ></textarea>
      }
    </div>
  `,
})
export class TextAreaControlComponent implements RecursicaFormControl {
  @Input() value?: string;
  @Output() valueChange = new EventEmitter<string>();

  @Input() placeholder?: string;
  @Input() name?: string;
  @Input() disabled = false;
  @Input() required = false;

  /** Visual-only error flag — mirrors `TextField`'s identical `error` input. */
  @Input() error = false;

  @Input() autosize = false;
  @Input() minRows?: number;
  @Input() maxRows?: number;

  private readonly baseId = `rec-text-area-${nextId++}`;
  private _id?: string;

  /**
   * The control owns/generates its own id if the caller (`TextAreaComponent`)
   * doesn't supply one — see `utils/recursica-form-control.ts`'s doc comment.
   * A plain `@Input() id = this.baseId` field-initializer default (`TextField`'s
   * own approach) doesn't work here: `TextAreaComponent` always binds
   * `[id]="id"` through to this component, and an explicitly-bound `undefined`
   * still overwrites a field-initializer default. The get/set accessor pair
   * falls back to `baseId` instead, at read time.
   */
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
    this.valueChange.emit((event.target as HTMLTextAreaElement).value);
  }
}
