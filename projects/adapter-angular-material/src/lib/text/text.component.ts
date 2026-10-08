import { NgTemplateOutlet } from "@angular/common";
import { Component, Input, ViewEncapsulation, inject } from "@angular/core";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";
import {
  RECURSICA_ARIA_LABELLING_INPUTS,
  RECURSICA_ELEMENT_ID_INPUTS,
  RecursicaAriaLabelling,
  RecursicaElementId,
} from "../utils/recursica-aria";

export type RecursicaTextVariant =
  | "body"
  | "body-small"
  | "caption"
  | "overline"
  | "subtitle"
  | "subtitle-small";
/** Elements `rec-text` can render. Never `h1` to `h6` — those belong to `rec-heading`. */
export type RecursicaTextElement = "p" | "span" | "label" | "div";
const TEXT_ELEMENTS: readonly string[] = ["p", "span", "label", "div"];
const HEADING_ELEMENTS = /^h[1-6]$/i;

export type RecursicaTextColor = "default" | "warning" | "alert" | "success";
export type RecursicaTextEmphasis = "high" | "low";

/**
 * Recursica `Text` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). Same
 * "genuinely does not exist" finding as `Heading` (see that component's
 * own class doc comment — not repeated here): Material's typography
 * system is Sass mixins only, no importable component. Renders a native
 * `<p>` with a `recursica_brand_typography_{variant}` class, the same
 * pre-existing global utility-class family `Heading` consumes (confirmed:
 * `.recursica_brand_typography_body`/`body-small`/`caption`/`overline`/
 * `subtitle`/`subtitle-small` all already exist in this adapter's own
 * `recursica_variables_scoped.css`).
 *
 * ## `component`: `p` (default), `span`, `label` or `div` — never `h1` to `h6`
 *
 * The reference's `component` prop (Mantine polymorphism) is offered as a
 * `component` input limited to those four elements, so Text can sit inline
 * (`span`), name a control (`label`), or be a block (`div`) without
 * producing invalid markup such as a `<p>` inside a `<p>`. A custom element
 * cannot swap its own tag, so the template renders one root per allowed
 * element from a shared content template. `h1` to `h6` throw, matching the
 * React adapter: semantic headings are `rec-heading`'s alone (see
 * `IMPLEMENTATION_NOTES.md`). Any other value throws too.
 *
 * No `weight` input from the stub's own guess: the real reference has no
 * such prop (weight is owned by the `variant`'s typography class).
 */
@Component({
  selector: "rec-text",
  hostDirectives: [
    {
      directive: RecursicaAriaLabelling,
      inputs: RECURSICA_ARIA_LABELLING_INPUTS,
    },
    { directive: RecursicaElementId, inputs: RECURSICA_ELEMENT_ID_INPUTS },
  ],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./text.component.css",
  imports: [NgTemplateOutlet],
  template: `
    @switch (component) {
      @case ("span") {
        <span
          [attr.id]="elementId.id ?? null"
          [attr.aria-label]="aria.ariaLabel ?? null"
          [attr.aria-labelledby]="aria.ariaLabelledby ?? null"
          [attr.aria-describedby]="aria.ariaDescribedby ?? null"
          class="root"
          [class]="resolvedTypographyClass"
          [style]="resolvedOverStyle.style"
          [attr.data-color]="color"
          [attr.data-emphasis]="emphasis"
        >
          <ng-container [ngTemplateOutlet]="content" />
        </span>
      }
      @case ("label") {
        <label
          [attr.id]="elementId.id ?? null"
          [attr.aria-label]="aria.ariaLabel ?? null"
          [attr.aria-labelledby]="aria.ariaLabelledby ?? null"
          [attr.aria-describedby]="aria.ariaDescribedby ?? null"
          [attr.for]="htmlFor ?? null"
          class="root"
          [class]="resolvedTypographyClass"
          [style]="resolvedOverStyle.style"
          [attr.data-color]="color"
          [attr.data-emphasis]="emphasis"
        >
          <ng-container [ngTemplateOutlet]="content" />
        </label>
      }
      @case ("div") {
        <div
          [attr.id]="elementId.id ?? null"
          [attr.aria-label]="aria.ariaLabel ?? null"
          [attr.aria-labelledby]="aria.ariaLabelledby ?? null"
          [attr.aria-describedby]="aria.ariaDescribedby ?? null"
          class="root"
          [class]="resolvedTypographyClass"
          [style]="resolvedOverStyle.style"
          [attr.data-color]="color"
          [attr.data-emphasis]="emphasis"
        >
          <ng-container [ngTemplateOutlet]="content" />
        </div>
      }
      @default {
        <p
          [attr.id]="elementId.id ?? null"
          [attr.aria-label]="aria.ariaLabel ?? null"
          [attr.aria-labelledby]="aria.ariaLabelledby ?? null"
          [attr.aria-describedby]="aria.ariaDescribedby ?? null"
          class="root"
          [class]="resolvedTypographyClass"
          [style]="resolvedOverStyle.style"
          [attr.data-color]="color"
          [attr.data-emphasis]="emphasis"
        >
          <ng-container [ngTemplateOutlet]="content" />
        </p>
      }
    }
    <ng-template #content><ng-content /></ng-template>
  `,
})
export class TextComponent implements RecursicaOverStyled {
  protected readonly aria = inject(RecursicaAriaLabelling);
  protected readonly elementId = inject(RecursicaElementId);

  @Input() variant: RecursicaTextVariant = "body";

  /** `for` of the inner `<label>`; only used when `component="label"`. */
  @Input() htmlFor?: string;

  /** Element rendered as the root. `h1` to `h6` throw — use `rec-heading`. */
  @Input()
  set component(value: RecursicaTextElement) {
    if (HEADING_ELEMENTS.test(value)) {
      throw new Error(
        `rec-text cannot render <${value}>. Use <rec-heading> for semantic h1-h6.`,
      );
    }
    if (!TEXT_ELEMENTS.includes(value)) {
      throw new Error(
        `rec-text cannot render <${value}>. Use one of: ${TEXT_ELEMENTS.join(", ")}.`,
      );
    }
    this._component = value;
  }
  get component(): RecursicaTextElement {
    return this._component;
  }
  private _component: RecursicaTextElement = "p";

  /** Semantic text color, bound to the active layer's text-element tokens via `data-color` —
   * same brand-layer mapping `heading.component.ts` uses. */
  @Input() color: RecursicaTextColor = "default";

  /** Emphasis level, bound to the theme's text-emphasis opacity tokens via `data-emphasis`. */
  @Input() emphasis: RecursicaTextEmphasis = "high";

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }

  get resolvedTypographyClass(): string {
    const typographyClass = `recursica_brand_typography_${this.variant}`;
    return this.resolvedOverStyle.class
      ? `${typographyClass} ${this.resolvedOverStyle.class}`
      : typographyClass;
  }
}
