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
import {
  ReadOnlyFieldComponent,
  type RecursicaReadOnlyFieldType,
} from "./read-only-field.component";

/**
 * Recursica `WithReadOnlyWrapper` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). Angular
 * translation of the genesis adapter's `WithReadOnlyWrapper.tsx` — the
 * piece other real field components (`TextField`, `Dropdown`, `Checkbox`,
 * `Radio`, `Switch`) are meant to compose to swap into a real read-only
 * display mode. **Not used by any of those five components yet** — they
 * were all built before this component existed and currently approximate
 * `readOnly` with static disabled-token rendering (see each one's own
 * `IMPLEMENTATION_NOTES.md`, "Known gap" section). Retrofitting them is an
 * explicit follow-up, out of scope here — see this folder's own
 * `IMPLEMENTATION_NOTES.md` for the intended consumption shape and a worked
 * example.
 *
 * ## Why a `TemplateRef` `@Input()`, not `<ng-content>`
 *
 * The React reference takes two fully-rendered React elements as props
 * (`activeComponent`, and implicitly whatever `readOnlyComponent` renders)
 * and picks one to mount — the unmounted branch never runs its own
 * component logic at all. Angular's closest equivalent to "hand over a
 * renderable thing without instantiating it yet" is a `TemplateRef`, the
 * same "no Angular equivalent for a plain `@Input()`-passed renderable
 * node" translation this adapter already uses for `Button`'s `icon`,
 * `Dropdown`'s `leftSection`, and `FormControlWrapper`'s own
 * `labelActionArea` — **not** `<ng-content>`: projected content is already
 * instantiated as a view child of whatever component contains the
 * `<rec-with-read-only-wrapper>` call site before this component ever runs
 * change detection, so hiding it behind `@if` would still construct the
 * interactive control (and run its lifecycle hooks / fire its own change
 * detection) even while inactive. A `TemplateRef`, rendered via
 * `*ngTemplateOutlet` only in the branch that's actually selected, gives
 * real, full swap semantics matching the React reference: the inactive
 * branch's view is never created at all.
 *
 * `activeTemplate` is the interactive control (mirrors `activeComponent`);
 * `readOnlyTemplate` is the optional full override (mirrors
 * `readOnlyComponent`/`readOnlyNativeProps` — a caller-supplied template
 * fully replaces `ReadOnlyFieldComponent`'s own text rendering, still
 * wrapped in the same `FormControlWrapper` chrome). When `readOnly` is
 * `true` and no `readOnlyTemplate` is supplied, renders `rec-read-only-field`
 * directly (mirrors the reference's own default branch,
 * `<ReadOnlyField ... type={readOnlyType} value={readOnlyValue} />`).
 *
 * The full `FormControlWrapper` passthrough surface (`label`/`error`/
 * `assistiveText`/etc.) is duplicated once between `rec-read-only-field`
 * (which owns its own copy of the same input surface) and the shared
 * `#fcw` template used by both the `readOnlyTemplate`-override branch and
 * the active branch — not triplicated across all three branches, the same
 * "can't conditionally nest markup two different ways without duplicating
 * it" constraint `CheckboxComponent`'s own `#checkboxTpl` pattern already
 * documents for itself.
 */
@Component({
  selector: "rec-with-read-only-wrapper",
  imports: [
    NgTemplateOutlet,
    FormControlWrapperComponent,
    ReadOnlyFieldComponent,
  ],
  encapsulation: ViewEncapsulation.Emulated,
  template: `
    <ng-template #fcw let-content>
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
        <ng-container [ngTemplateOutlet]="content ?? null" />
      </rec-form-control-wrapper>
    </ng-template>

    @if (readOnly) {
      @if (readOnlyTemplate) {
        <ng-container
          [ngTemplateOutlet]="fcw"
          [ngTemplateOutletContext]="{ $implicit: readOnlyTemplate }"
        />
      } @else {
        <rec-read-only-field
          [value]="readOnlyValue"
          [type]="readOnlyType"
          [emptyText]="emptyText"
          [emptyValueTemplate]="emptyValueTemplate"
          [emptyValueCheck]="emptyValueCheck"
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
        />
      }
    } @else {
      <ng-container
        [ngTemplateOutlet]="fcw"
        [ngTemplateOutletContext]="{ $implicit: activeTemplate }"
      />
    }
  `,
})
export class WithReadOnlyWrapperComponent implements RecursicaOverStyled {
  @Input() readOnly = false;

  /** The interactive control, rendered when `readOnly` is falsy. Mirrors `activeComponent`. */
  @Input() activeTemplate?: TemplateRef<unknown>;

  /**
   * Full override for the read-only display, rendered instead of
   * `rec-read-only-field` when `readOnly` is truthy and this is set.
   * Mirrors `readOnlyComponent`/`readOnlyNativeProps`.
   */
  @Input() readOnlyTemplate?: TemplateRef<unknown>;

  @Input() readOnlyValue?: unknown;
  @Input() readOnlyType: RecursicaReadOnlyFieldType = "text";
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
}
