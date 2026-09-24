import { NgTemplateOutlet } from "@angular/common";
import {
  Component,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  ViewEncapsulation,
} from "@angular/core";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";

export type RecursicaToastVariant = "default" | "error" | "success";

/**
 * Recursica `Toast` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). Ported from
 * the genesis adapter's own real `Toast.tsx`/`Toast.module.css`/
 * `TOAST_IMPLEMENTATION_NOTES.md`, which wraps `@mantine/core`'s
 * **standalone static `Notification` component** — deliberately *not*
 * `@mantine/notifications`' dynamic popup/toast-stack provider (see the
 * genesis notes' "Standalone Visual Wrapper" §1: "This allows developers to
 * use `<Toast>` manually if they want a static or inline message.").
 *
 * `Angular Material` does ship its own dynamic popup-queue system
 * (`MatSnackBar`), but that is the wrong shape entirely here — same reason
 * the genesis adapter didn't wrap `@mantine/notifications`. This component
 * is a plain, directly-rendered visual element (place it anywhere in a
 * template, like `Card`/`AssistiveElement`), never an injectable service.
 * See `IMPLEMENTATION_NOTES.md` for the full underlying-kit candidate audit.
 *
 * Built from scratch as a plain `<div>` tree, not a wrapped Material
 * component — confirmed against the full `@angular/material` package there
 * is no standalone, non-queue-driven "static notification card" component to
 * wrap (same "no counterpart" shape of finding as `AssistiveElement`).
 * Structural facts (flex row, icon left / body middle / close-button right,
 * `role="alert"` default) are ported directly from Mantine's own real
 * compiled `Notification.mjs`/`Notification.css` (read directly, not
 * guessed) — see IMPLEMENTATION_NOTES.md for the specifics ported from there
 * versus the specifics driven by Recursica's own
 * `--recursica_ui-kit_components_toast_*` tokens.
 *
 * `loading`/`color`/`radius` (Mantine's `Notification` props the React
 * `Toast.tsx` wrapper strips via its own `UNSUPPORTED_PROPS`) have no
 * Angular equivalent to strip in the first place — this component simply
 * never declares them, per `docs/COMPONENT_DEV_GUIDE.md`'s "declare only
 * what the contract exposes" rule (same precedent as Button's `color`/
 * `fullWidth`).
 */
@Component({
  selector: "rec-toast",
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./toast.component.css",
  template: `
    <div
      class="root"
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
      [attr.data-variant]="variant"
      [attr.role]="resolvedRole"
    >
      @if (icon) {
        <span class="iconWrapper" aria-hidden="true">
          <ng-container [ngTemplateOutlet]="icon" />
        </span>
      }
      <div class="body">
        @if (title) {
          <div class="title">{{ title }}</div>
        }
        <div class="description"><ng-content /></div>
      </div>
      @if (withCloseButton) {
        <button
          type="button"
          class="closeButton"
          aria-label="Close"
          (click)="onCloseClick()"
        >
          <svg
            viewBox="0 0 24 24"
            width="100%"
            height="100%"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      }
    </div>
  `,
})
export class ToastComponent implements RecursicaOverStyled {
  @Input() variant: RecursicaToastVariant = "default";

  /** Title displayed above the message body — matches the reference's `title` prop. */
  @Input() title?: string;

  /**
   * Rendered via `*ngTemplateOutlet` — same `TemplateRef` slot convention as
   * `Button`/`Chip`/`Link`'s own `icon` inputs. The reference's `icon?:
   * React.ReactNode` "replaces the color line" per Mantine's own doc comment
   * on `NotificationProps.icon`; here, its presence alone toggles
   * `.iconWrapper`'s rendering (see class doc comment).
   */
  @Input() icon?: TemplateRef<unknown>;

  /** Whether the close button is visible. @default true — matches the reference. */
  @Input() withCloseButton = true;

  /**
   * A caller-supplied `role` always wins over the `"alert"` default — same
   * override pattern as `AssistiveElement`'s `role`. Mantine's own compiled
   * `Notification.mjs` unconditionally defaults to `role: role || "alert"`
   * regardless of variant (verified directly against the real source), so
   * unlike `AssistiveElement` (only `error` defaults to `"alert"`) this
   * defaults to `"alert"` for every variant.
   */
  @Input() role?: string;

  /**
   * Fires when the close button is clicked — the Angular translation of the
   * reference's `onClose?: () => void` callback prop (Angular idiom is an
   * `@Output()` `EventEmitter`, not a callback `@Input()`). Named `closed`,
   * not `close` — `close` collides with `@angular-eslint/no-output-native`
   * (a native DOM event name), and `closed` matches `Modal`'s own identical
   * `onClose`-shaped `@Output()` precedent.
   */
  @Output() closed = new EventEmitter<void>();

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  get resolvedRole(): string {
    return this.role ?? "alert";
  }

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }

  onCloseClick(): void {
    this.closed.emit();
  }
}
