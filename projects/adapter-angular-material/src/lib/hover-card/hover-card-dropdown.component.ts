import {
  AfterViewInit,
  Component,
  OnDestroy,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
  inject,
} from "@angular/core";
import { HOVER_CARD_CONTEXT } from "./hover-card-context";

/**
 * `HoverCard.Dropdown` — captures its own projected content as a
 * `TemplateRef` and hands it to `HoverCardComponent` via DI, which renders
 * it (via `ngTemplateOutlet`) inside the real CDK overlay only while open.
 *
 * **Real, honest trade-off, not full lazy instantiation**: the compound
 * `<rec-hover-card-dropdown>...</rec-hover-card-dropdown>` API shape means
 * callers pass literal projected content (`<ng-content>`), not a `#ref`
 * `TemplateRef` `@Input()` the way `WithReadOnlyWrapperComponent`'s own
 * `activeTemplate`/`readOnlyTemplate` do. Angular instantiates
 * `<ng-content>`-projected content as part of the *caller's* view the
 * moment this component itself is created — wrapping the `<ng-content>`
 * tag in a local `<ng-template>` here defers where it's *rendered into the
 * DOM* (nothing shows up until `ngTemplateOutlet` in `hover-card.component.ts`
 * actually uses this template), but does not defer *instantiation* the
 * way a true `TemplateRef` `@Input()` would. In practice this means the
 * dropdown's content (its own child components' constructors/`ngOnInit`)
 * runs once up front regardless of hover state, not on every open — a
 * real, inherent limitation of this compound-component shape, not an
 * oversight. Acceptable for the kind of small, static informational
 * content every golden story actually uses.
 */
@Component({
  selector: "rec-hover-card-dropdown",
  encapsulation: ViewEncapsulation.Emulated,
  template: `
    <ng-template #contentTpl>
      <ng-content />
    </ng-template>
  `,
})
export class HoverCardDropdownComponent implements AfterViewInit, OnDestroy {
  @ViewChild("contentTpl")
  private readonly contentTemplate!: TemplateRef<unknown>;

  private readonly context = inject(HOVER_CARD_CONTEXT, { optional: true });

  ngAfterViewInit(): void {
    this.context?.registerDropdownTemplate(this.contentTemplate);
  }

  ngOnDestroy(): void {
    this.context?.registerDropdownTemplate(null);
  }
}
