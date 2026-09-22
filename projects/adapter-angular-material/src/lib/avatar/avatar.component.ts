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

export type RecursicaAvatarVariant = "solid" | "outline" | "ghost";
export type RecursicaAvatarSize = "default" | "small" | "large";

/**
 * Recursica `Avatar` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). The stub's
 * own `IMPLEMENTATION_NOTES.md` already confirmed `Category: DOES NOT
 * EXIST` — re-checked, not assumed: `MatListItemAvatar`/
 * `MatGridAvatarCssMatStyler`/`[mat-card-avatar]` are CSS-class-application
 * directives for slotting an avatar image inside another component's own
 * header, not a standalone circular-image/icon/initials component. Full
 * custom build, no adoption/rejection decision to make (nothing exists to
 * adopt or reject).
 *
 * ## Three display modes, computed like the reference — not caller-chosen
 *
 * Matches `Avatar.tsx`'s own precedence exactly: `src` (a valid, not-yet-
 * errored image) wins if present, then `icon`, then plain projected text
 * content — the caller doesn't pick a mode directly. `imageErrored` (this
 * component's own local state, not present in the reference's own
 * `Avatar.tsx` — Mantine's underlying `<Avatar>` handles broken-image
 * fallback internally) reproduces that same fallback behavior explicitly
 * here, since a bare `<img>` has no equivalent built in.
 *
 * ## `initials` from the stub's own guess: superseded by plain content projection
 *
 * The pre-implementation stub guessed a dedicated `initials: string`
 * input. The real reference has no such prop — `Avatar.tsx` renders
 * arbitrary `children` for the text mode (its own `TextSolidDefault` story
 * passes `children: "JD"`, plain text, not a special "initials" concept).
 * This component uses plain `<ng-content>` for that slot instead (the
 * `icon` mode uses a `TemplateRef` `@Input()` instead of projected content,
 * matching `Button`'s/`Dropdown`'s own convention — `<ng-content>` can't be
 * conditionally swapped against the icon/text branches without
 * instantiating both regardless of which one is showing, the same
 * "TemplateRef, not `<ng-content>`" reasoning `WithReadOnlyWrapperComponent`'s
 * own doc comment documents for its active/read-only swap), matching the
 * reference's actual shape per `docs/CREATING_AN_ADAPTER.md` step 10's own
 * instruction that the real audit supersedes the stub's first-pass guess.
 *
 * ## No polymorphism (`createPolymorphicComponent`)
 *
 * The reference wraps `_Avatar` in Mantine's `createPolymorphicComponent`
 * so callers can render it as a different root element/component via a
 * `component` prop. Angular has no direct equivalent, and no other
 * component in this adapter offers one either (confirmed: `Button`/`Chip`/
 * etc. all render a fixed root element) — not implemented, matching
 * established adapter-wide precedent rather than introducing a new pattern
 * for just this one component.
 */
@Component({
  selector: "rec-avatar",
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./avatar.component.css",
  template: `
    <div
      class="root"
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
      [attr.data-variant]="variant"
      [attr.data-size]="size"
      [attr.data-style]="computedStyle"
    >
      @if (computedStyle === "image") {
        <img
          class="image"
          [src]="src"
          [alt]="alt ?? ''"
          (error)="onImageError()"
        />
      } @else if (computedStyle === "icon") {
        <span class="iconWrapper" aria-hidden="true">
          <ng-container [ngTemplateOutlet]="icon ?? null" />
        </span>
      } @else {
        <span class="textWrapper">
          <ng-content />
        </span>
      }
    </div>
  `,
})
export class AvatarComponent implements RecursicaOverStyled {
  @Input() src?: string;
  @Input() alt?: string;

  /** Mirrors the reference's own `icon != null` check — same `TemplateRef` translation `Button`'s `icon`/`Dropdown`'s `leftSection` already use for caller-supplied markup. */
  @Input() icon?: TemplateRef<unknown>;

  @Input() variant: RecursicaAvatarVariant = "solid";
  @Input() size: RecursicaAvatarSize = "default";

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  imageErrored = false;

  get computedStyle(): "image" | "icon" | "text" {
    if (this.src && !this.imageErrored) {
      return "image";
    }
    if (this.icon) {
      return "icon";
    }
    return "text";
  }

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }

  onImageError(): void {
    this.imageErrored = true;
  }
}
