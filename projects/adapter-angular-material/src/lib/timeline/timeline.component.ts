import {
  AfterContentInit,
  Component,
  ContentChildren,
  Input,
  OnDestroy,
  QueryList,
  ViewEncapsulation,
} from "@angular/core";
import { Subscription } from "rxjs";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";
import { TIMELINE_CONTEXT, TimelineContext } from "./timeline-context";
import { TimelineItemComponent } from "./timeline-item.component";

/**
 * Recursica `Timeline` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). The stub's
 * own `IMPLEMENTATION_NOTES.md` already flagged `Category: DOES NOT EXIST`
 * ("no Timeline component or CDK primitive... build from scratch") —
 * re-confirmed at build time: no `@angular/material`/`@angular/cdk`
 * export resembling a connected event list exists. Hand-built, the same
 * approach `Stepper` (also `DOES NOT EXIST`-equivalent once `MatStepper`
 * was rejected) already establishes in this adapter.
 *
 * ## `TIMELINE_CONTEXT` + index assignment — same architecture as `Stepper`
 *
 * `active: number` is provided to every `TimelineItemComponent` via
 * `TIMELINE_CONTEXT` (`useExisting`, the same DI-context translation
 * `STEPPER_CONTEXT` establishes for an implicit React
 * context/`cloneElement` pairing — see `timeline-context.ts`'s own doc
 * comment). Each item's own `index`/`isLast` is assigned here from real
 * `ContentChildren` order in `ngAfterContentInit`, the identical pattern
 * `stepper.component.ts`'s `assignStepIndices()` already establishes.
 *
 * ## `active` semantics: `index <= active` is "active" — items 0..active inclusive
 *
 * Matches Mantine's own `Timeline` behavior (`active={1}` in both golden
 * stories marks items 0 and 1 as active/completed, items 2+ as upcoming) —
 * confirmed by reading `Timeline.module.css`'s own `[data-active]`-gated
 * rules directly (title/description/timestamp/connector/bullet all get a
 * distinct "active" token set, applied per-item based on this threshold,
 * not just the single item *at* `active`).
 */
@Component({
  selector: "rec-timeline",
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./timeline.component.css",
  providers: [{ provide: TIMELINE_CONTEXT, useExisting: TimelineComponent }],
  template: `
    <div
      class="root"
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
    >
      <ng-content />
    </div>
  `,
})
export class TimelineComponent
  implements TimelineContext, RecursicaOverStyled, AfterContentInit, OnDestroy
{
  @Input() active = -1;

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  @ContentChildren(TimelineItemComponent, { descendants: true })
  private readonly itemsQuery!: QueryList<TimelineItemComponent>;

  private itemsSubscription?: Subscription;

  ngAfterContentInit(): void {
    this.assignItemIndices();
    this.itemsSubscription = this.itemsQuery.changes.subscribe(() =>
      this.assignItemIndices(),
    );
  }

  ngOnDestroy(): void {
    this.itemsSubscription?.unsubscribe();
  }

  private assignItemIndices(): void {
    const items = this.itemsQuery.toArray();
    items.forEach((item, index) => {
      item.index = index;
      item.isLast = index === items.length - 1;
    });
  }

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }
}
