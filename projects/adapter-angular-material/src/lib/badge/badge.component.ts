import { Component, Input, ViewEncapsulation } from "@angular/core";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";

export type RecursicaBadgeVariant =
  | "alert"
  | "primary-color"
  | "success"
  | "warning";

/**
 * Recursica `Badge` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). The stub's
 * own `IMPLEMENTATION_NOTES.md` already confirmed `Category: DOES NOT
 * EXIST` — re-checked, not assumed: `MatBadge` is an overlay *directive*
 * (`[matBadge]="'4'"` decorates a host element with a small corner dot/
 * number, e.g. a notification count on an icon), not a freestanding
 * colored label/pill element. No Material component for "a standalone
 * badge/tag" exists to adopt or reject. Full custom build, ported directly
 * from the genesis adapter's `Badge.module.css`.
 *
 * ## `content`/`color` from the stub's own guess: superseded by content projection + `variant`
 *
 * The pre-implementation stub guessed `content: string`/`color: string`
 * inputs. The real reference takes plain `children` for the label
 * (`Badge.stories.tsx`: `children: "Badge Label"`) and a fixed `variant`
 * union (`"alert" | "primary-color" | "success" | "warning"`, driving
 * `data-variant`-gated token colors), not a freeform `color` string —
 * confirmed by reading `Badge.tsx`/`Badge.module.css` directly, per
 * `docs/CREATING_AN_ADAPTER.md` step 10's own instruction that the real
 * audit supersedes the stub's first-pass guess. This component uses plain
 * `<ng-content>` for the label and a `variant` `@Input()` instead.
 *
 * ## No `leftSection`/`rightSection`
 *
 * Mantine's `Badge` technically accepts them (inherited passthrough from
 * `@mantine/core`'s `Input`-adjacent primitives), but confirmed
 * `Badge.module.css` has **no styling for either** — no icon-size/gap/color
 * token wiring at all, and no story exercises one. Adding them here would
 * be unstyled, unexercised scope creep beyond what the reference itself
 * actually supports in practice.
 *
 * ## No polymorphism
 *
 * Same reasoning as `Avatar`'s identical omission — the reference wraps
 * itself in Mantine's `createPolymorphicComponent`; Angular has no direct
 * equivalent, and no other component in this adapter offers one either.
 */
@Component({
  selector: "rec-badge",
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./badge.component.css",
  template: `
    <div
      class="root"
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
      [attr.data-variant]="variant"
    >
      <ng-content />
    </div>
  `,
})
export class BadgeComponent implements RecursicaOverStyled {
  @Input() variant: RecursicaBadgeVariant = "primary-color";

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
