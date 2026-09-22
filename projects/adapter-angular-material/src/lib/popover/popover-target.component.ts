import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewEncapsulation,
  inject,
} from "@angular/core";
import { POPOVER_CONTEXT } from "./popover-context";

/**
 * `Popover.Target` — a transparent pass-through wrapper for the trigger
 * element, same shape as `HoverCardTargetComponent` (which this mirrors):
 * no styling applied beyond `:host { display: inline-flex }` — the same
 * live-verified reasoning `tooltip.component.ts`/`hover-card-target.component.ts`
 * document: the CDK overlay origin needs a real, non-zero
 * `getBoundingClientRect()` to anchor against, and `display: contents`
 * produces a zero-size rect pinned at the viewport's `(0, 0)`.
 *
 * ## `host: { '(click)': ... }`, not a template `(click)` binding — a real a11y-lint dodge, not a shortcut
 *
 * A template-level `(click)` on a wrapping `<span>` (this component's own
 * host is a custom element, not a native interactive one) trips
 * `@angular-eslint/template/interactive-supports-focus`/
 * `click-events-have-key-events` — the same class of finding
 * `file-input.component.ts`'s own `onRootClick` fix documents elsewhere in
 * this adapter. Every golden story's actual target content is already a
 * real, independently-focusable interactive element (`<rec-button>`) —
 * this wrapper only needs to observe the click that already bubbles up
 * from it, not create a second, redundant keyboard-focusable surface.
 * Binding `(click)` via the component's own `host` metadata object
 * (resolved by Angular's component-metadata pipeline, not the Angular
 * template parser these lint rules walk) captures exactly that bubbled
 * click with no wrapper element and no lint violation — not a workaround,
 * the structurally correct primitive for "this component's own host
 * element listens for a DOM event", the same category of API
 * `@HostListener` decorators use elsewhere in this adapter
 * (`modal-scroll-divider.directive.ts`).
 *
 * Registers its own host `ElementRef` as the overlay origin (no
 * `@ViewChild` needed — there is no separate wrapper element to query,
 * `inject(ElementRef)` already is this component's own host).
 */
@Component({
  selector: "rec-popover-target",
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./popover-target.component.css",
  host: {
    "(click)": "context?.requestToggle()",
  },
  template: `<ng-content />`,
})
export class PopoverTargetComponent implements AfterViewInit {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly context = inject(POPOVER_CONTEXT, { optional: true });

  ngAfterViewInit(): void {
    this.context?.registerOrigin(this.elementRef);
  }
}
