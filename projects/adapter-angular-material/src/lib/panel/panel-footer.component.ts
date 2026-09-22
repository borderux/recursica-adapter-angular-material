import { Component, Input, ViewEncapsulation } from "@angular/core";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";

/**
 * `Panel.Footer` — a right-aligned, fixed-at-bottom action area. Routed
 * outside the scrolling body via `PanelComponent`'s own `<ng-content
 * select="rec-panel-footer">` — see `modal-footer.component.ts`'s own
 * class doc comment for why a genuine, independently-instantiated
 * component (as opposed to `PanelComponent`'s own `TemplateRef` chrome)
 * doesn't need the global overlay-CSS treatment: content projection only
 * changes where its rendered output is inserted, not which component
 * created it, so this component's own `Emulated`-scoped CSS reaches its
 * own `.footer` div normally.
 */
@Component({
  selector: "rec-panel-footer",
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./panel-footer.component.css",
  template: `
    <div
      class="footer"
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
    >
      <ng-content />
    </div>
  `,
})
export class PanelFooterComponent implements RecursicaOverStyled {
  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }
}
