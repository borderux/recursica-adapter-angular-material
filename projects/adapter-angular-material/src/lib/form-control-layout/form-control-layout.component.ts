import { NgTemplateOutlet } from "@angular/common";
import {
  Component,
  Input,
  TemplateRef,
  ViewEncapsulation,
} from "@angular/core";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";

export type RecursicaFormLayout = "stacked" | "side-by-side";
export type RecursicaFormControlLabelSize = "default" | "small";

/**
 * Recursica `FormControlLayout` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). No Angular
 * Material equivalent — same conclusion as `AssistiveElement`/`Label`, and
 * confirmed for the composed case too: `MatFormField`'s real compiled
 * template only ever renders its label inside the same flex container as
 * the input (Material's floating-label model), with no supported way to
 * place it as an independent side-by-side column (see `label.component.ts`'s
 * IMPLEMENTATION_NOTES.md for the full investigation). Built from scratch,
 * directly matching the genesis adapter's real
 * `FormControlLayout.tsx`/`.module.css` structure and tokens.
 *
 * `leftSection` is a `TemplateRef`, not a projected-content slot — same
 * translation as `Button`'s `icon` (no Angular equivalent for "pass a
 * renderable node as a plain `@Input()` value"). Typically a `<rec-label>`,
 * but deliberately not typed as one — the React reference accepts any
 * `ReactNode` here too (e.g. for a standalone `Switch`/`Checkbox` aligned
 * to match label spacing with no actual label present).
 */
@Component({
  selector: "rec-form-control-layout",
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./form-control-layout.component.css",
  template: `
    <div
      class="root"
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
      [attr.data-form-layout]="formLayout"
      [style.--form-control-max-width]="controlMaxWidth ?? null"
      [style.--form-control-min-width]="controlMinWidth ?? null"
    >
      @if (shouldRenderLeft) {
        <div class="leftSection" [attr.data-size]="labelSize">
          <ng-container [ngTemplateOutlet]="leftSection ?? null" />
        </div>
      }
      <div class="rightSection"><ng-content /></div>
    </div>
  `,
})
export class FormControlLayoutComponent implements RecursicaOverStyled {
  @Input() formLayout: RecursicaFormLayout = "stacked";
  @Input() labelSize: RecursicaFormControlLabelSize = "default";
  @Input() leftSection?: TemplateRef<unknown>;
  @Input() controlMaxWidth?: string;
  @Input() controlMinWidth?: string;

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  /**
   * `leftSection` always renders in `side-by-side` (even absent, to
   * preserve the empty grid column's width) but is omitted entirely in
   * `stacked` when there's no label — avoids unnecessary padding, matching
   * the React reference's `shouldRenderLeft` exactly.
   */
  get shouldRenderLeft(): boolean {
    return this.leftSection != null || this.formLayout === "side-by-side";
  }

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }
}
