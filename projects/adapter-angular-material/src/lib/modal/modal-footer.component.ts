import { Component, Input, ViewEncapsulation } from "@angular/core";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";

/**
 * `Modal.Footer` — a perfectly padded container for modal actions, right-
 * aligned by default (matching the reference's own documented button
 * hierarchy: primary action right-most, secondary immediately to its
 * left). Routed to a fixed-at-bottom area outside the scrolling body via
 * `ModalComponent`'s own `<ng-content select="rec-modal-footer">` — a real
 * simplification over the reference's own `React.Children.forEach`-based
 * runtime detection (`Modal.tsx`'s `ModalBody` manually pulls `Modal.Footer`
 * out of its children array at render time); Angular's named content
 * projection slots do this declaratively, no runtime child-scanning needed.
 *
 * ## Normal scoped `styleUrl` — unlike `ModalComponent`'s own chrome
 *
 * `ModalComponent`'s header/body/scroll-area markup needs a global overlay
 * stylesheet (`modal-overlay.css`) because it's a `TemplateRef` instantiated
 * by `MatDialog.open()` through the dialog's own portal mechanism (see
 * `modal.component.ts`'s class doc comment). This component is different:
 * it's a genuine, independently-instantiated Angular component — wherever
 * a caller writes `<rec-modal-footer>`, Angular creates a real component
 * instance there, with its own real `_ngcontent-*` attribute. Content
 * *projection* only changes where its rendered output is inserted into the
 * DOM, not which component created it — so this component's own
 * `Emulated`-scoped CSS reaches its own `.footer` div normally, the same
 * way `ChipComponent`'s own CSS keeps working nested inside `Dropdown`'s or
 * `FileInput`'s portaled/overlay content elsewhere in this adapter.
 */
@Component({
  selector: "rec-modal-footer",
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./modal-footer.component.css",
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
export class ModalFooterComponent implements RecursicaOverStyled {
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
