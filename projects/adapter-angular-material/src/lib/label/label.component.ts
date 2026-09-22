import { NgTemplateOutlet } from "@angular/common";
import {
  Component,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  ViewEncapsulation,
} from "@angular/core";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";

export type RecursicaLabelSize = "default" | "small";
export type RecursicaLabelAlignment = "left" | "right";

/**
 * Recursica `Label` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). `MatLabel`
 * (`selector: "mat-label"`) isn't a usable standalone component the way
 * this needs — confirmed against its real declaration
 * (`form-field2.mjs`): it's a bare marker directive with no template, no
 * `for` handling, no rendering logic of its own at all, meant only to be
 * placed inside `<mat-form-field>` so `MatFormField`'s own `ContentChild`
 * query relocates its projected content into Material's internal label
 * slot. Same conclusion as `AssistiveElement` — no real Material component
 * to wrap. Built from scratch as a plain `<label>`, matching the genesis
 * adapter's real `Label.tsx`/`.module.css` structure and tokens exactly.
 *
 * `data-size` is set on the host but this component's own CSS never reads
 * it — same as the React reference. It exists purely as a DOM hook for
 * `FormControlLayout`'s own CSS (its `.leftSection[data-size=...]` rules
 * drive the label column's width), not for anything this component does
 * to itself.
 *
 * `labelActionArea`: `TemplateRef`, not a projected-content slot — same
 * translation as `Button`'s `icon` (`RecursicaLabelActionArea?: React.ReactNode`
 * has no direct Angular equivalent as a plain `@Input()` value). Rendered
 * via `*ngTemplateOutlet`, and takes precedence over `labelWithEditIcon`
 * exactly like the React reference.
 */
@Component({
  selector: "rec-label",
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./label.component.css",
  template: `
    <label
      class="root"
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
      [attr.for]="htmlFor"
      [attr.data-size]="labelSize"
      [attr.data-alignment]="labelAlignment"
    >
      <span class="labelText"><ng-content /></span>
      @if (resolvedOptionalText) {
        <span class="optionalText">({{ resolvedOptionalText }})</span>
      } @else if (required && !labelWithEditIcon) {
        <span class="required" aria-hidden="true">*</span>
      }
      @if (labelActionArea) {
        <span class="actionAreaWrapper"
          ><ng-container [ngTemplateOutlet]="labelActionArea"
        /></span>
      } @else if (labelWithEditIcon) {
        <button
          type="button"
          class="editIconWrapper"
          [attr.data-replaces-asterisk]="required ? 'true' : null"
          (click)="labelEditClick.emit($event)"
          aria-label="Edit"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.5303 2.46967C11.8232 2.17678 12.2981 2.17678 12.591 2.46967L13.5303 3.40898C13.8232 3.70188 13.8232 4.17675 13.5303 4.46964L5.61288 12.3871C5.45268 12.5473 5.24434 12.6483 5.01809 12.6766L2.39534 13.0044C2.10091 13.0412 1.83856 12.7789 1.87538 12.4845L2.2032 9.86175C2.23147 9.63551 2.3325 9.42716 2.4927 9.26696L11.5303 2.46967Z"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      }
    </label>
  `,
})
export class LabelComponent implements RecursicaOverStyled {
  /** The `id` of the control this label describes — sets the native `for` attribute. */
  @Input() htmlFor?: string;

  @Input() labelSize: RecursicaLabelSize = "default";
  @Input() labelAlignment: RecursicaLabelAlignment = "left";
  @Input() required = false;

  /** `true` renders the default `"(optional)"` text; a string renders custom text. No effect when `required`. */
  @Input() labelOptionalText?: boolean | string;

  @Input() labelWithEditIcon = false;

  /** Rendered via `*ngTemplateOutlet` — see class doc comment. */
  @Input() labelActionArea?: TemplateRef<unknown>;

  @Output() labelEditClick = new EventEmitter<MouseEvent>();

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  get resolvedOptionalText(): string | null {
    if (this.required) return null;
    if (this.labelOptionalText === true) return "optional";
    if (typeof this.labelOptionalText === "string")
      return this.labelOptionalText;
    return null;
  }

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }
}
