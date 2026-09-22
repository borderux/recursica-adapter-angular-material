import { Component, Input, ViewEncapsulation } from "@angular/core";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";

export type RecursicaTextVariant =
  | "body"
  | "body-small"
  | "caption"
  | "overline"
  | "subtitle"
  | "subtitle-small";

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
 * ## No polymorphism, no `weight` input from the stub's own guess
 *
 * The reference wraps itself in Mantine's `createPolymorphicComponent` so
 * callers can render as `<span>`/`<label>`/etc. via a `component` prop —
 * skipped here, matching `Avatar`/`Badge`/`Heading`'s identical omission
 * (no other component in this adapter offers polymorphism either). The
 * stub's own first-pass guess included a `weight: string` input; the real
 * reference has no such prop (confirmed by reading `Text.tsx` directly —
 * weight is fully owned by the `variant`'s own typography class, not a
 * separate override), so it isn't built here either, per
 * `docs/CREATING_AN_ADAPTER.md` step 10's own instruction that the real
 * audit supersedes the stub's guess.
 */
@Component({
  selector: "rec-text",
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./text.component.css",
  template: `
    <p
      class="root"
      [class]="resolvedTypographyClass"
      [style]="resolvedOverStyle.style"
    >
      <ng-content />
    </p>
  `,
})
export class TextComponent implements RecursicaOverStyled {
  @Input() variant: RecursicaTextVariant = "body";

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
