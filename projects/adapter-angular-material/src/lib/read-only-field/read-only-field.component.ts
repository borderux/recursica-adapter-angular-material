import { NgTemplateOutlet } from "@angular/common";
import {
  Component,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  ViewEncapsulation,
} from "@angular/core";
import type {
  RecursicaFormControlLabelSize,
  RecursicaFormLayout,
} from "../form-control-layout/form-control-layout.component";
import { FormControlWrapperComponent } from "../form-control-wrapper/form-control-wrapper.component";
import type { RecursicaLabelAlignment } from "../label/label.component";
import type { RecursicaOverStyled } from "../utils/recursica-over-styled";

/**
 * Mirrors the genesis adapter's `ReadOnlyFieldType`
 * (`@recursica/adapter-common`'s `ReadOnlyField.d.ts`). `"number"`/`"date"`
 * carry no extra formatting of their own in the reference either — only
 * `"boolean"`/`"switch"` map to a fixed word pair, confirmed by reading
 * `ReadOnlyField.tsx`'s own `switch (type)` directly rather than assumed
 * from the name.
 */
export type RecursicaReadOnlyFieldType =
  | "text"
  | "number"
  | "date"
  | "boolean"
  | "switch";

/**
 * Angular translation of `@recursica/adapter-common`'s `EmptyValueRenderer.check` —
 * confirmed against the real bundled implementation
 * (`adapter-common.js`: `E.check = (e) => e == null || e === "" || Array.isArray(e) && e.length === 0`),
 * not guessed from the type-only `.d.ts`.
 */
export function defaultReadOnlyEmptyCheck(value: unknown): boolean {
  return (
    value == null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

/**
 * Recursica `ReadOnlyField` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). Ported from
 * the genesis adapter's `ReadOnlyField.tsx` + `ReadOnlyTextField.tsx` +
 * `ReadOnlyField.module.css`.
 *
 * ## Composes `FormControlWrapper` internally — unlike `TextField`/`Dropdown`
 *
 * Every other real field component in this adapter (`TextField`, `Dropdown`,
 * `Checkbox`, ...) deliberately does **not** render `FormControlWrapperComponent`
 * internally — see their own `IMPLEMENTATION_NOTES.md` — because the React
 * reference's `FormControlWrapper` composition relies on `React.cloneElement()`
 * to graft `id`/`aria-*` onto an opaque interactive child, which Angular has
 * no equivalent for (`RECURSICA_FORM_CONTROL`/`ContentChild` replaces it, but
 * only works when the *caller* composes `<rec-form-control-wrapper>` around
 * the real control externally).
 *
 * `ReadOnlyField` doesn't have that problem: unlike `TextField`'s `<input>`
 * or `Dropdown`'s trigger button, this component's own "control" is a plain
 * `<p>` text node it generates itself — nothing opaque to clone attributes
 * onto, and nothing that needs `id`/`aria-describedby` wired onto an
 * interactive element (a `<p>` isn't a form control). So, matching the real
 * `ReadOnlyField.tsx` (`return <FormControlWrapper ...>{content}</FormControlWrapper>`)
 * exactly, this component renders `<rec-form-control-wrapper>` directly in
 * its own template, with the formatted text as its projected content. See
 * `with-read-only-wrapper.component.ts` for the composable swap-mechanism
 * other components are meant to use.
 *
 * ## Data-type formatting
 *
 * `type` only changes rendering for `"boolean"` (`True`/`False`) and
 * `"switch"` (`On`/`Off`) — `"text"`/`"number"`/`"date"` all render the raw
 * `value` stringified (arrays joined with `", "`), matching the reference:
 * `ReadOnlyField.stories.tsx`'s own `DataTypes` story passes already-formatted
 * strings for `number`/`date` (e.g. `value={1234567.89}`,
 * `value={new Date(...).toLocaleDateString()}`) — those two type values are
 * presentational categories only, not a signal that this component itself
 * runs `Intl.NumberFormat`/date formatting.
 *
 * ## Empty-value handling
 *
 * Mirrors `EmptyValueRenderer`'s two-part API (a `.check()` predicate + a
 * fallback renderer) with two independent Angular-native escape hatches,
 * since Angular has no equivalent to passing an arbitrary polymorphic
 * `React.ElementType` as a prop value:
 *
 * - `emptyText`: overrides just the fallback string (default `"N/A"`) —
 *   covers the reference's `CustomEmptyText` story.
 * - `emptyValueTemplate` (+ optional `emptyValueCheck`): a `TemplateRef`
 *   rendered instead of the fallback string, with the empty value in its
 *   context (`$implicit`); `emptyValueCheck` overrides which values count as
 *   "empty" in the first place — covers the reference's `CustomEmptyRenderer`
 *   story (custom check: `val === "EMPTY_MOCK"`, custom markup: `<i>...</i>`).
 *
 * The emptiness check always runs against the raw `value` input, before
 * type-mapping — `false` (a valid `boolean`/`switch` value) is never treated
 * as empty, matching the reference's own `isValueEmpty` check running before
 * the `type` `switch`.
 */
@Component({
  selector: "rec-read-only-field",
  imports: [NgTemplateOutlet, FormControlWrapperComponent],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./read-only-field.component.css",
  template: `
    <rec-form-control-wrapper
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
      [controlMaxWidth]="controlMaxWidth"
      [controlMinWidth]="controlMinWidth"
      [required]="required"
      [withAsterisk]="withAsterisk"
      [overStyled]="overStyled"
      [overClass]="overClass"
      [overStyle]="overStyle"
      (labelEditClick)="labelEditClick.emit($event)"
    >
      <p class="textField">
        @if (isEmpty) {
          @if (emptyValueTemplate) {
            <ng-container
              [ngTemplateOutlet]="emptyValueTemplate"
              [ngTemplateOutletContext]="{ $implicit: value }"
            />
          } @else {
            {{ emptyText ?? "N/A" }}
          }
        } @else {
          {{ displayText }}
        }
      </p>
    </rec-form-control-wrapper>
  `,
})
export class ReadOnlyFieldComponent implements RecursicaOverStyled {
  @Input() value?: unknown;
  @Input() type: RecursicaReadOnlyFieldType = "text";
  @Input() emptyText?: string;
  @Input() emptyValueTemplate?: TemplateRef<{ $implicit: unknown }>;
  @Input() emptyValueCheck?: (value: unknown) => boolean;

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
  @Input() error?: string | TemplateRef<unknown>;
  @Input() assistiveWithIcon = true;

  @Input() controlMaxWidth?: string;
  @Input() controlMinWidth?: string;
  @Input() required = false;
  @Input() withAsterisk?: boolean;

  @Output() labelEditClick = new EventEmitter<MouseEvent>();

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  get isEmpty(): boolean {
    const check = this.emptyValueCheck ?? defaultReadOnlyEmptyCheck;
    return check(this.value);
  }

  get displayText(): string {
    const mapped = this.mapValue();
    if (mapped == null) {
      return "";
    }
    if (Array.isArray(mapped)) {
      return mapped.join(", ");
    }
    return String(mapped);
  }

  private mapValue(): unknown {
    if (this.type === "boolean") {
      return this.value === true
        ? "True"
        : this.value === false
          ? "False"
          : this.value;
    }
    if (this.type === "switch") {
      return this.value === true
        ? "On"
        : this.value === false
          ? "Off"
          : this.value;
    }
    return this.value;
  }
}
