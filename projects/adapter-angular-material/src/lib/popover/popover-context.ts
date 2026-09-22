import { ElementRef, InjectionToken, TemplateRef } from "@angular/core";

export type RecursicaPopoverBaseSide = "top" | "bottom" | "left" | "right";
export type RecursicaPopoverAlign = "start" | "end";
export type RecursicaPopoverPosition =
  | RecursicaPopoverBaseSide
  | `${RecursicaPopoverBaseSide}-${RecursicaPopoverAlign}`;

/**
 * DI-based replacement for the reference's implicit React context (Mantine's
 * `<Popover>` provides open/close state to `Popover.Target`/`Popover.Dropdown`
 * internally). Same `useExisting` pattern `HOVER_CARD_CONTEXT`/`TABS_CONTEXT`
 * already establish in this adapter — see `tabs/tabs-context.ts`'s own doc
 * comment for the full "why DI, not `@Input()`" reasoning, not repeated
 * here.
 */
export interface PopoverContext {
  readonly position: RecursicaPopoverPosition;
  readonly withBeak: boolean;
  readonly disabled: boolean;
  registerOrigin(el: ElementRef<HTMLElement>): void;
  registerDropdownTemplate(template: TemplateRef<unknown> | null): void;
  requestToggle(): void;
  requestClose(): void;
}

export const POPOVER_CONTEXT = new InjectionToken<PopoverContext>(
  "RecursicaPopoverContext",
);
