import { NgTemplateOutlet } from "@angular/common";
import {
  AfterContentChecked,
  Component,
  ContentChild,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  ViewEncapsulation,
} from "@angular/core";
import { AssistiveElementComponent } from "../assistive-element/assistive-element.component";
import {
  FormControlLayoutComponent,
  RecursicaFormControlLabelSize,
  RecursicaFormLayout,
} from "../form-control-layout/form-control-layout.component";
import {
  LabelComponent,
  RecursicaLabelAlignment,
} from "../label/label.component";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";
import {
  RECURSICA_FORM_CONTROL,
  RecursicaFormControl,
} from "../utils/recursica-form-control";

let nextId = 0;

/**
 * Recursica `FormControlWrapper` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). Composes
 * `Label` + `FormControlLayout` + `AssistiveElement`, matching the genesis
 * adapter's real `FormControlWrapper.tsx` — but the id/ARIA-wiring
 * mechanism is fundamentally different, since React's `React.cloneElement()`
 * (which the reference uses to inject `id`/`aria-labelledby`/
 * `aria-describedby`/`aria-errormessage` onto the projected child) has no
 * Angular equivalent — a parent cannot mutate attributes onto opaque
 * `<ng-content>`-projected content.
 *
 * ## The Angular-native replacement: `RECURSICA_FORM_CONTROL` + `ContentChild`
 *
 * See `utils/recursica-form-control.ts`'s doc comment for the full design
 * rationale (modeled on `MatFormField`'s own real `ContentChild(MatFormFieldControl)`
 * pattern, deliberately lighter-weight). This component queries for a
 * projected control providing that token and calls `setDescribedByIds()`
 * on it directly.
 *
 * **Real, documented difference from the React reference**: React's version
 * *generates* an id and pushes it onto the child if the child doesn't
 * already have one. Angular cannot push attributes onto opaque projected
 * content at all — so here, the control's `id` is the control's own
 * concern (mirroring `MatFormFieldControl.id`, a read-only property the
 * control itself owns/generates, exactly like `MatInput`'s own `_uniqueId`
 * fallback). This component reads whatever `id` the projected control
 * reports for the label's `for` — if a control doesn't implement
 * `RECURSICA_FORM_CONTROL` at all, the label simply renders without a
 * `for`/`aria-describedby` connection, which is a real, inherent Angular
 * constraint to design future form controls around, not a bug to fix here.
 *
 * `label`/`assistiveText`/`description`/`helperText`/`error` accept
 * `string | TemplateRef<unknown>` — a plain string for the common case,
 * a `TemplateRef` for rich content (matching `Label`'s own
 * `labelActionArea` translation for anything richer than text).
 */
@Component({
  selector: "rec-form-control-wrapper",
  imports: [
    NgTemplateOutlet,
    FormControlLayoutComponent,
    LabelComponent,
    AssistiveElementComponent,
  ],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./form-control-wrapper.component.css",
  template: `
    <rec-form-control-layout
      class="root"
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
      [formLayout]="formLayout"
      [labelSize]="labelSize"
      [controlMaxWidth]="controlMaxWidth"
      [controlMinWidth]="controlMinWidth"
      [leftSection]="label ? labelTemplate : undefined"
    >
      <ng-template #labelTemplate>
        <rec-label
          [id]="labelId"
          [htmlFor]="controlId"
          [labelAlignment]="labelAlignment"
          [labelOptionalText]="labelOptionalText"
          [labelWithEditIcon]="labelWithEditIcon"
          [labelActionArea]="labelActionArea"
          [required]="withAsterisk ?? required"
          (labelEditClick)="labelEditClick.emit($event)"
        >
          @if (isTemplate(label)) {
            <ng-container [ngTemplateOutlet]="asTemplate(label)" />
          } @else {
            {{ label }}
          }
        </rec-label>
      </ng-template>

      <div class="inputSection">
        <ng-content />

        @if (error) {
          <rec-assistive-element
            [id]="errorId"
            assistiveVariant="error"
            [assistiveWithIcon]="assistiveWithIcon"
          >
            @if (isTemplate(error)) {
              <ng-container [ngTemplateOutlet]="asTemplate(error)" />
            } @else {
              {{ error }}
            }
          </rec-assistive-element>
        } @else if (resolvedAssistive) {
          <rec-assistive-element
            [id]="assistiveId"
            assistiveVariant="help"
            [assistiveWithIcon]="assistiveWithIcon"
          >
            @if (isTemplate(resolvedAssistive)) {
              <ng-container
                [ngTemplateOutlet]="asTemplate(resolvedAssistive)"
              />
            } @else {
              {{ resolvedAssistive }}
            }
          </rec-assistive-element>
        }
      </div>
    </rec-form-control-layout>
  `,
})
export class FormControlWrapperComponent
  implements RecursicaOverStyled, AfterContentChecked
{
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

  @ContentChild(RECURSICA_FORM_CONTROL)
  private readonly control?: RecursicaFormControl;

  private readonly baseId = `recursica-fc-${nextId++}`;
  readonly labelId = `${this.baseId}-label`;
  readonly assistiveId = `${this.baseId}-assistive`;
  readonly errorId = `${this.baseId}-error`;

  controlId: string | undefined = undefined;

  /** `assistiveText` takes priority over the native-API fallback aliases, matching the React reference. */
  get resolvedAssistive(): string | TemplateRef<unknown> | undefined {
    return this.assistiveText ?? this.description ?? this.helperText;
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

  ngAfterContentChecked(): void {
    const newControlId = this.control?.id ?? undefined;
    if (newControlId !== this.controlId) {
      this.controlId = newControlId;
    }
    this.control?.setDescribedByIds(
      this.error
        ? [this.errorId]
        : this.resolvedAssistive
          ? [this.assistiveId]
          : [],
    );
  }
}
