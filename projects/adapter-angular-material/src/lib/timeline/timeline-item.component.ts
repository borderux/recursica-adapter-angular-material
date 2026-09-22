import { NgTemplateOutlet } from "@angular/common";
import {
  Component,
  Input,
  TemplateRef,
  ViewEncapsulation,
  inject,
} from "@angular/core";
import { TIMELINE_CONTEXT } from "./timeline-context";

export type RecursicaTimelineBulletVariant =
  | "default"
  | "icon"
  | "icon-alternative"
  | "avatar";

/**
 * Recursica `Timeline.Item` — Angular Material adapter.
 *
 * REAL implementation, part of `Timeline`'s compound API (see
 * `timeline.component.ts`'s class doc comment for why this is hand-built).
 *
 * Host is `display: contents` (`timeline-item.component.css`) so this
 * component's own `.item` element becomes a real flex-item child of
 * `<rec-timeline>`'s own `.root` column directly — matching the reference's
 * real DOM shape (`Timeline.Item` renders one flat `.item` per instance,
 * not nested inside an extra wrapper), the same `display: contents`
 * technique `StepComponent`'s own class doc comment documents for the
 * identical "become a real sibling in the parent's flex container, no
 * cross-component-boundary CSS needed" reason.
 *
 * ## `timestamp` renders under a `description` block — matches the reference's own child-wrapping
 *
 * The reference's own `TimelineItem.tsx` wraps `children` in a `.description`
 * div only when `timestamp` is also supplied (`content = timestamp ? (
 * <>{children && <div className={styles.description}>{children}</div>}
 * <div className={styles.timestamp}>{timestamp}</div></> ) : children`) —
 * reproduced here identically: `<ng-content>` (the description) only gets
 * its own `.description` wrapper when `timestamp` is set, otherwise it
 * renders unwrapped, matching the reference's own conditional structure
 * rather than always wrapping.
 *
 * ## `bulletVariant`/`bullet`: `[data-variant]` switches sizing tokens, custom content via `<ng-container>`
 *
 * The reference syncs bullet size with the connector line via Mantine's own
 * internal `--tl-bullet-size`/`--tl-line-width` CSS custom properties (its
 * `Timeline`/`TimelineItem` need that indirection because Mantine's
 * *own* unstyled component owns the connector geometry). This component
 * hand-builds the connector itself (`timeline-item.component.css`'s own
 * `.item::before`), so there's no third-party geometry to stay in sync
 * with — `[data-variant]` switches sizing tokens directly in this
 * component's own stylesheet, all in one place, no cross-component custom
 * property needed. `bullet` (a `TemplateRef`, this adapter's standard
 * translation for a caller-supplied renderable node — same as `Dropdown`'s
 * `leadingIcon`) supplies the actual icon/avatar content rendered inside
 * `.itemBullet`. No `bullet` means an empty, purely decorative dot (the
 * `default` variant's own golden-story usage).
 */
@Component({
  selector: "rec-timeline-item",
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./timeline-item.component.css",
  template: `
    <div
      class="item"
      [attr.data-variant]="bulletVariant"
      [attr.data-active]="isActive ? '' : null"
      [attr.data-last]="isLast ? '' : null"
    >
      <div class="itemBullet">
        @if (bullet) {
          <ng-container [ngTemplateOutlet]="bullet" />
        }
      </div>
      <div class="itemBody">
        @if (title) {
          <div class="itemTitle">{{ title }}</div>
        }
        <div class="itemContent">
          @if (timestamp) {
            <div class="description"><ng-content /></div>
            <div class="timestamp">{{ timestamp }}</div>
          } @else {
            <ng-content />
          }
        </div>
      </div>
    </div>
  `,
})
export class TimelineItemComponent {
  @Input() title?: string;
  @Input() timestamp?: string;
  @Input() bulletVariant: RecursicaTimelineBulletVariant = "default";
  @Input() bullet?: TemplateRef<unknown>;

  /** Assigned by `TimelineComponent` from real `ContentChildren` order — not caller-supplied. */
  index = 0;
  /** Assigned by `TimelineComponent` — hides the trailing connector line on the last item. */
  isLast = false;

  private readonly context = inject(TIMELINE_CONTEXT, { optional: true });

  get isActive(): boolean {
    return this.index <= (this.context?.active ?? -1);
  }
}
