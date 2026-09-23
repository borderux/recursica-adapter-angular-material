import { NgTemplateOutlet } from "@angular/common";
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  TemplateRef,
  ViewEncapsulation,
  inject,
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
 * ## Default placeholder icon when no `src`/`icon`/projected content is given
 *
 * The reference's underlying Mantine `<Avatar>` has its own internal
 * fallback (confirmed in its compiled `Avatar.mjs`): when there's no `src`
 * (or it errored) it renders `children || (name && getInitials(name)) ||
 * <AvatarPlaceholderIcon />` — so its own `Default` story, which passes no
 * `src`/`icon`/children at all, ends up rendering Mantine's built-in
 * `AvatarPlaceholderIcon` SVG (a filled person-in-circle glyph, ported
 * verbatim below), not a blank circle. This component has no equivalent
 * built-in fallback to inherit, so it reproduces the same "nothing was
 * projected" case explicitly: `hasProjectedContent` (set from
 * `ngAfterViewInit`, once, then reconciled with an explicit
 * `ChangeDetectorRef.detectChanges()` call — `<ng-content>`'s actual
 * projected nodes aren't reliably readable off the host `ElementRef` any
 * earlier than that, confirmed by trying `ngAfterContentInit` first and
 * observing it read an empty `textContent` even for the `TextSolidDefault`
 * story's real `"JD"` child) reads the host element's own `textContent`
 * the same way `children != null` reads React's children. `<ng-content>`
 * itself stays unconditionally rendered in the template (its visibility
 * toggled via a `.hidden` CSS class, not structural `@if`/`@else`) so a
 * real projected child is never discarded by this same-tick correction —
 * the ported placeholder icon is the one that's conditionally rendered
 * instead.
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
        <!--
          hasProjectedContent is only known once ngAfterViewInit runs this
          component's own real host textContent check (see class doc
          comment). ng-content is kept unconditionally instantiated
          here — structurally hiding/re-creating it behind that same flag
          (an earlier version of this fix did that) discards the projected
          nodes the first time the flag flips, so a real "JD" child ends up
          rendered as nothing. Only the fallback icon's presence is
          conditional; visibility of the two is toggled with the hidden
          class (display: none) instead of structural at-if/at-else.
        -->
        <span class="textWrapper" [class.hidden]="!hasProjectedContent">
          <ng-content />
        </span>
        @if (!hasProjectedContent) {
          <!--
            No src, no icon, no projected text — matches Mantine's own
            built-in <AvatarPlaceholderIcon /> fallback (see class doc
            comment), ported verbatim so the default state isn't a blank
            circle. "currentColor" resolves to the same
            .root[data-style="text"][data-variant] color token the text
            branch would've used, matching Mantine's own "color: inherit"
            on its placeholder span.
          -->
          <span class="iconWrapper" aria-hidden="true">
            <svg
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                fill="currentColor"
                d="M0.877014 7.49988C0.877014 3.84219 3.84216 0.877045 7.49985 0.877045C11.1575 0.877045 14.1227 3.84219 14.1227 7.49988C14.1227 11.1575 11.1575 14.1227 7.49985 14.1227C3.84216 14.1227 0.877014 11.1575 0.877014 7.49988ZM7.49985 1.82704C4.36683 1.82704 1.82701 4.36686 1.82701 7.49988C1.82701 8.97196 2.38774 10.3131 3.30727 11.3213C4.19074 9.94119 5.73818 9.02499 7.50023 9.02499C9.26206 9.02499 10.8093 9.94097 11.6929 11.3208C12.6121 10.3127 13.1727 8.97172 13.1727 7.49988C13.1727 4.36686 10.6328 1.82704 7.49985 1.82704ZM10.9818 11.9787C10.2839 10.7795 8.9857 9.97499 7.50023 9.97499C6.01458 9.97499 4.71624 10.7797 4.01845 11.9791C4.97952 12.7272 6.18765 13.1727 7.49985 13.1727C8.81227 13.1727 10.0206 12.727 10.9818 11.9787ZM5.14999 6.50487C5.14999 5.207 6.20212 4.15487 7.49999 4.15487C8.79786 4.15487 9.84999 5.207 9.84999 6.50487C9.84999 7.80274 8.79786 8.85487 7.49999 8.85487C6.20212 8.85487 5.14999 7.80274 5.14999 6.50487ZM7.49999 5.10487C6.72679 5.10487 6.09999 5.73167 6.09999 6.50487C6.09999 7.27807 6.72679 7.90487 7.49999 7.90487C8.27319 7.90487 8.89999 7.27807 8.89999 6.50487C8.89999 5.73167 8.27319 5.10487 7.49999 5.10487Z"
              />
            </svg>
          </span>
        }
      }
    </div>
  `,
})
export class AvatarComponent implements RecursicaOverStyled, AfterViewInit {
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

  /**
   * Whether real text was projected via `<ng-content>` — see class doc
   * comment. Set once from `ngAfterViewInit`, then reconciled with an
   * explicit `detectChanges()` call in the same tick (see class doc
   * comment for why `ngAfterContentInit` doesn't work here). Defaults to
   * `true` (i.e. "assume content, don't show the fallback icon") so
   * there's no icon-then-text flash on the very first paint for the
   * common case where content *was* projected.
   */
  hasProjectedContent = true;

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  ngAfterViewInit(): void {
    const text = this.elementRef.nativeElement.textContent ?? "";
    const hasContent = text.trim().length > 0;
    if (hasContent !== this.hasProjectedContent) {
      this.hasProjectedContent = hasContent;
      this.changeDetectorRef.detectChanges();
    }
  }

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
