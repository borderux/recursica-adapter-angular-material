import { ElementRef, InjectionToken, TemplateRef } from "@angular/core";

export type RecursicaHoverCardBaseSide = "top" | "bottom" | "left" | "right";
export type RecursicaHoverCardAlign = "start" | "end";
export type RecursicaHoverCardPosition =
  | RecursicaHoverCardBaseSide
  | `${RecursicaHoverCardBaseSide}-${RecursicaHoverCardAlign}`;

/**
 * DI-based replacement for the genesis adapter's implicit React context
 * (Mantine's `<HoverCard>` provides open/close state and hover-intent
 * coordination to `HoverCard.Target`/`HoverCard.Dropdown` internally, via
 * its own headless combobox-adjacent engine). Angular has no context API —
 * `HoverCardComponent` provides itself under this token (`useExisting`),
 * matching the established `TABS_CONTEXT`/`STEPPER_CONTEXT` pattern in this
 * adapter — see `tabs/tabs-context.ts`'s own doc comment for the full
 * "why DI, not `@Input()`" reasoning, not repeated here.
 */
export interface HoverCardContext {
  readonly position: RecursicaHoverCardPosition;
  readonly withBeak: boolean;
  readonly disabled: boolean;
  registerOrigin(el: ElementRef<HTMLElement>): void;
  registerDropdownTemplate(template: TemplateRef<unknown> | null): void;
  requestOpen(): void;
  requestClose(): void;
}

export const HOVER_CARD_CONTEXT = new InjectionToken<HoverCardContext>(
  "RecursicaHoverCardContext",
);
