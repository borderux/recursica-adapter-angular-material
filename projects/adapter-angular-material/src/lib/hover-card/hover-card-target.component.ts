import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  ViewEncapsulation,
  inject,
} from "@angular/core";
import { HOVER_CARD_CONTEXT } from "./hover-card-context";

/**
 * `HoverCard.Target` — a transparent pass-through wrapper for the trigger
 * element, matching the reference's own documented "no styling applied,
 * `filterStylingProps`/CSS module classes never touch it" decision
 * (`HOVERCARD_IMPLEMENTATION_NOTES.md` §2 — "identical to the `Menu.Target`
 * pattern").
 *
 * `.root` is `display: inline-flex`, not `display: contents` — same
 * live-verified reasoning `tooltip.component.ts`'s own class doc comment
 * documents: the CDK overlay origin needs a real `getBoundingClientRect()`
 * to anchor against, and `display: contents` produces a zero-size rect
 * pinned at the viewport's `(0, 0)`.
 *
 * Registers its own `ElementRef` as the overlay origin, and calls
 * `requestOpen()`/`requestClose()` on hover/focus — the target is one of
 * the two hover-intent surfaces (the other being the dropdown panel
 * itself, see `hover-card.component.ts`), matching the reference's own
 * "stays open while hovering the dropdown too" behavior.
 */
@Component({
  selector: "rec-hover-card-target",
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./hover-card-target.component.css",
  template: `
    <span
      #origin
      class="root"
      (mouseenter)="context?.requestOpen()"
      (mouseleave)="context?.requestClose()"
      (focusin)="context?.requestOpen()"
      (focusout)="context?.requestClose()"
    >
      <ng-content />
    </span>
  `,
})
export class HoverCardTargetComponent implements AfterViewInit {
  @ViewChild("origin") private readonly originRef!: ElementRef<HTMLElement>;

  readonly context = inject(HOVER_CARD_CONTEXT, { optional: true });

  ngAfterViewInit(): void {
    this.context?.registerOrigin(this.originRef);
  }
}
