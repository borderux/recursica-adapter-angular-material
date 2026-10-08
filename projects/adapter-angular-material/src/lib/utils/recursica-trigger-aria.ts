import type { ButtonComponent } from "../button/button.component";

/**
 * Trigger accessibility for overlay components (Popover, HoverCard, Menu).
 *
 * The trigger content is whatever the caller projects: usually a `rec-button`,
 * sometimes a native element. ARIA state such as `aria-expanded` belongs on
 * the one real focusable element, not on a `rec-*` wrapper, so these helpers
 * find that element and apply the attributes to it, or — when it is the
 * inner `<button>` of a `rec-button` — set the Button's own inputs, which
 * render onto that inner button.
 */

/** Elements that are in the tab order unless `tabindex` says otherwise. */
const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled]):not([type=hidden])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "summary",
  "[tabindex]",
].join(",");

/** First focusable descendant of `root` (tabindex -1 excluded), or `null`. */
export function firstFocusable(root: HTMLElement): HTMLElement | null {
  for (const el of Array.from(
    root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  )) {
    const tabindex = el.getAttribute("tabindex");
    if (tabindex !== null && Number(tabindex) < 0) continue;
    return el;
  }
  return null;
}

export interface RecursicaTriggerAria {
  /** `aria-haspopup` value. */
  hasPopup?: "menu" | "dialog";
  /** `aria-expanded`. */
  expanded?: boolean;
  /** `aria-controls`: id of the popup element. */
  controls?: string;
  /** Id to add to `aria-describedby` (merged with any existing ids). */
  describedBy?: string;
}

/** A `rec-button` found in a trigger's content, with its host element. */
export interface RecursicaTriggerButton {
  element: HTMLElement;
  button: ButtonComponent;
}

/**
 * Applies `aria` to the first focusable descendant of `root`. If that element
 * is inside one of `buttons`, the Button's `ariaExpanded`/`ariaControls`/
 * `ariaHasPopup` inputs are set (they render onto its inner `<button>` on the
 * next change detection); otherwise the attributes are set on the element.
 * `aria-describedby` is always merged onto the native element, since a Button
 * has no input that is not already the caller's own.
 *
 * Safe to call on every change detection pass: it only writes values.
 */
export function applyTriggerAria(
  root: HTMLElement,
  buttons: readonly RecursicaTriggerButton[],
  aria: RecursicaTriggerAria,
): void {
  const target = firstFocusable(root);
  if (!target) return;

  const owner = buttons.find((b) => b.element.contains(target));
  if (owner) {
    if (aria.hasPopup !== undefined) owner.button.ariaHasPopup = aria.hasPopup;
    if (aria.expanded !== undefined) owner.button.ariaExpanded = aria.expanded;
    if (aria.controls !== undefined) owner.button.ariaControls = aria.controls;
  } else {
    if (aria.hasPopup !== undefined)
      target.setAttribute("aria-haspopup", aria.hasPopup);
    if (aria.expanded !== undefined)
      target.setAttribute("aria-expanded", String(aria.expanded));
    if (aria.controls !== undefined)
      target.setAttribute("aria-controls", aria.controls);
  }

  if (aria.describedBy) {
    const ids = new Set(
      (target.getAttribute("aria-describedby") ?? "")
        .split(/\s+/)
        .filter(Boolean),
    );
    if (!ids.has(aria.describedBy)) {
      ids.add(aria.describedBy);
      target.setAttribute("aria-describedby", [...ids].join(" "));
    }
  }
}
