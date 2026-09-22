import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  OnDestroy,
  inject,
} from "@angular/core";

/**
 * Tracks `.scrollArea`'s own scroll position, toggling `data-scrolled-top`/
 * `data-scrolled-bottom` — `modal-overlay.css` reads these to show/hide the
 * scroll dividers between the header/footer and the scrollable body,
 * matching the reference's own `checkScroll` behavior in `Modal.tsx`'s
 * `ModalBody`.
 *
 * A directive, not a `@ViewChild('scrollArea')` query on `ModalComponent`
 * itself: `ModalComponent` opens its content via `MatDialog.open(templateRef,
 * config)`, which instantiates the embedded view through its *own*
 * `ViewContainerRef` (`@angular/cdk/dialog`'s internals), not one
 * `ModalComponent`'s own template directives create — so the instantiated
 * DOM does not reliably show up in `ModalComponent`'s own `@ViewChild`
 * results the way an `*ngIf`/`ngTemplateOutlet` used directly inside its
 * template would. A directive's own lifecycle hooks/host listeners fire
 * correctly regardless of which `ViewContainerRef` created its host view,
 * sidestepping that uncertainty entirely instead of depending on it.
 *
 * Uses a real `ResizeObserver` on top of the reference's own mount+`scroll`+
 * `window:resize` triggers, not just a direct port — the reference
 * re-checks on its `children` dependency changing, which only catches a
 * different *set* of child elements, not the same children's own content
 * growing/shrinking (an image finishing loading, etc.). `ResizeObserver`
 * catches both, a real improvement available here with no React-hook
 * dependency-array translation needed.
 */
@Directive({
  selector: "[recModalScrollDivider]",
})
export class ModalScrollDividerDirective implements AfterViewInit, OnDestroy {
  @HostBinding("attr.data-scrolled-top") scrolledTop: string | null = null;
  @HostBinding("attr.data-scrolled-bottom") scrolledBottom: string | null =
    null;

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    this.check();
    this.resizeObserver = new ResizeObserver(() => this.check());
    this.resizeObserver.observe(this.elementRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  @HostListener("scroll")
  @HostListener("window:resize")
  check(): void {
    const el = this.elementRef.nativeElement;
    this.scrolledTop = el.scrollTop > 0 ? "" : null;
    this.scrolledBottom =
      Math.ceil(el.scrollTop + el.clientHeight) < el.scrollHeight ? "" : null;
  }
}
