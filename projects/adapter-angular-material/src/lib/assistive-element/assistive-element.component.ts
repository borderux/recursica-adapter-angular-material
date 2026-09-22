import { Component, Input, ViewEncapsulation } from "@angular/core";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";

export type RecursicaAssistiveVariant = "help" | "error";

/**
 * Recursica `AssistiveElement` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). Unlike every
 * other component built so far, this one has **no Angular Material
 * counterpart to wrap at all** — confirmed against `@angular/material`'s
 * full package listing, there is no generic "helper/error text row"
 * component or directive anywhere in it (Material's own form-field hint/
 * error text is rendered internally by `MatFormField` itself, not a
 * standalone reusable element). Built from scratch as a plain `<div>`,
 * directly matching the mantine-adapter's own real
 * `AssistiveElement.tsx`/`.module.css` structure and tokens (a fixed
 * variant-specific icon + text, no custom-icon slot).
 *
 * `assistiveVariant: "error"` defaults this element's `role` to `"alert"`
 * so assistive tech announces it as it appears/changes — matching the React
 * reference exactly (`role="alert"` is a native ARIA live-region shortcut,
 * not Material-specific, so no translation was needed here).
 */
@Component({
  selector: "rec-assistive-element",
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./assistive-element.component.css",
  template: `
    <div
      class="root"
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
      [attr.data-variant]="assistiveVariant"
      [attr.role]="resolvedRole"
    >
      @if (assistiveWithIcon) {
        <span class="iconWrapper" aria-hidden="true">
          @if (assistiveVariant === "error") {
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"
              />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          } @else {
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          }
        </span>
      }
      <span class="textWrapper"><ng-content /></span>
    </div>
  `,
})
export class AssistiveElementComponent implements RecursicaOverStyled {
  @Input() assistiveVariant: RecursicaAssistiveVariant = "help";
  @Input() assistiveWithIcon = true;

  /** A caller-supplied `role` always wins over the `error` → `"alert"` default. */
  @Input() role?: string;

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  get resolvedRole(): string | undefined {
    return (
      this.role ?? (this.assistiveVariant === "error" ? "alert" : undefined)
    );
  }

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }
}
