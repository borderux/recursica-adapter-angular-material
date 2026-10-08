/* eslint-disable @angular-eslint/no-input-rename -- the HTML-spelled inputs (`aria-label`) are the point: see the class doc comment. */
import { Directive, Input } from "@angular/core";

/**
 * Accessible-name inputs a component forwards to its inner element, as a
 * host directive. Angular has no `...rest`: an attribute written on
 * `<rec-x aria-label="Save">` lands on the `rec-x` host, not on the native
 * element inside it, so each component declares what it forwards. This
 * directive is the one shared way to do it, so every component accepts the
 * same inputs, with the same names:
 *
 * - `ariaLabel` / `aria-label`
 * - `ariaLabelledby` / `aria-labelledby`
 * - `ariaDescribedby` / `aria-describedby`
 *
 * Both spellings are inputs. The HTML spelling is the natural one to write
 * (`<rec-button aria-label="Save">`) and the camelCase one is what the
 * adapter's earlier components already shipped, so supporting both breaks
 * nothing. The host's own attribute is cleared, so the name is not announced
 * twice and is not left on an element that has no role.
 *
 * Use it from the component as a host directive, then read the values in the
 * template:
 *
 * ```ts
 * @Component({
 *   hostDirectives: [{ directive: RecursicaAriaLabelling, inputs: RECURSICA_ARIA_LABELLING_INPUTS }],
 *   template: `<button [attr.aria-label]="aria.ariaLabel ?? null">…</button>`,
 * })
 * class ButtonComponent {
 *   protected readonly aria = inject(RecursicaAriaLabelling);
 * }
 * ```
 *
 * Expose a subset of the inputs by listing only those names in `inputs` when
 * a component should not accept one of them.
 */
@Directive({
  host: {
    "[attr.aria-label]": "null",
    "[attr.aria-labelledby]": "null",
    "[attr.aria-describedby]": "null",
  },
})
export class RecursicaAriaLabelling {
  @Input() ariaLabel?: string;
  @Input() ariaLabelledby?: string;
  @Input() ariaDescribedby?: string;

  @Input("aria-label") set ariaLabelAttribute(value: string | undefined) {
    this.ariaLabel = value;
  }
  @Input("aria-labelledby") set ariaLabelledbyAttribute(
    value: string | undefined,
  ) {
    this.ariaLabelledby = value;
  }
  @Input("aria-describedby") set ariaDescribedbyAttribute(
    value: string | undefined,
  ) {
    this.ariaDescribedby = value;
  }

  /**
   * `aria-describedby` for an element that a form-control wrapper also
   * describes: the caller's ids first, then the wrapper's, space-separated.
   * The wrapper rewrites its own ids on every pass, so a caller's value must
   * be merged in and never replaced.
   */
  describedBy(wrapperIds?: string | null): string | null {
    const ids = [this.ariaDescribedby, wrapperIds].filter(Boolean).join(" ");
    return ids || null;
  }
}

/** `inputs` for `hostDirectives` exposing every `RecursicaAriaLabelling` input. */
export const RECURSICA_ARIA_LABELLING_INPUTS = [
  "ariaLabel",
  "aria-label",
  "ariaLabelledby",
  "aria-labelledby",
  "ariaDescribedby",
  "aria-describedby",
];

/**
 * An `id` forwarded to the component's inner element. The host's own `id`
 * attribute is cleared so the document never holds the id twice.
 */
@Directive({
  host: { "[attr.id]": "null" },
})
export class RecursicaElementId {
  @Input() id?: string;
}

/** `inputs` for `hostDirectives` exposing `RecursicaElementId`. */
export const RECURSICA_ELEMENT_ID_INPUTS = ["id"];
