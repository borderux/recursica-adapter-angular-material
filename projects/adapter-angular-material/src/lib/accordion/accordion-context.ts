import { InjectionToken, TemplateRef } from "@angular/core";

/**
 * DI-based replacement for the genesis adapter's implicit React context
 * (Mantine's `<Accordion>` tracks open/closed state internally and
 * communicates it to `Accordion.Item`/`Accordion.Control`/`Accordion.Panel`
 * purely through the DOM — `data-active` attributes and shared `id`s — with
 * no explicit context object of its own). Angular has no context API and no
 * DOM-implicit-state equivalent, so `AccordionComponent` provides itself
 * under this token (`useExisting`), the same pattern `TABS_CONTEXT`
 * established for `Tabs` (`tabs/tabs-context.ts`).
 *
 * `AccordionItemComponent`/`AccordionControlComponent`/
 * `AccordionPanelComponent` all inject this `@Optional()` — never required,
 * matching `Tabs`' precedent of degrading gracefully (e.g. a
 * `<rec-accordion-item>` used outside `<rec-accordion>` just never opens)
 * rather than throwing.
 */
export interface AccordionContext {
  /** Whether the item identified by `value` is currently open. */
  isOpen(value: string): boolean;
  /** Toggles the item identified by `value`, respecting `multiple`. */
  toggle(value: string): void;
  /** Root-level default chevron override (`AccordionComponent.chevron`), applies to every
   * item unless a specific `<rec-accordion-control>` overrides it with its own `chevron`. */
  readonly chevron?: TemplateRef<unknown>;
}

export const ACCORDION_CONTEXT = new InjectionToken<AccordionContext>(
  "RecursicaAccordionContext",
);

/**
 * Per-item DI token, provided by `AccordionItemComponent` (`useExisting`) and
 * injected `@Optional()` by its own `<rec-accordion-control>`/
 * `<rec-accordion-panel>` children. Exists so `Control`/`Panel` — each its
 * own component, not a DOM descendant `AccordionItemComponent`'s own
 * TypeScript code can reach directly — can read *this specific item's*
 * `value`/open-state/`disabled` without either component needing an
 * `@Input()` duplicating what the enclosing `<rec-accordion-item>` already
 * declared (which would require every caller to repeat `value` on all three
 * elements). Same shape as `TABS_CONTEXT`, one level deeper (root context +
 * item context, vs. `Tabs`' single root context) because Accordion's
 * open/closed state is genuinely per-item, not a single shared active value.
 */
export interface AccordionItemContext {
  readonly value: string;
  readonly isOpen: boolean;
  /** Item-level `disabled` — dims the whole item (control + panel) via CSS opacity
   * inheritance; does not by itself block interaction. See `accordion-control.component.ts`. */
  readonly disabled: boolean;
  readonly chevron?: TemplateRef<unknown>;
  toggle(): void;
}

export const ACCORDION_ITEM_CONTEXT = new InjectionToken<AccordionItemContext>(
  "RecursicaAccordionItemContext",
);
