import { InjectionToken } from "@angular/core";

/**
 * DI-based replacement for the genesis adapter's implicit React context
 * (Mantine's `<Tabs>` provides `value`/`onChange`/`orientation` via
 * `TabsProvider`, consumed by `Tabs.Tab`/`Tabs.Panel` through `useContext`).
 * Angular has no context API — `TabsComponent` provides itself under this
 * token (`useExisting`), and `TabComponent`/`TabPanelComponent`/
 * `TabsListComponent` inject it `@Optional()` (never required — a
 * `<rec-tabs-tab>` used outside `<rec-tabs>` degrades to "always inactive,
 * clicking does nothing" rather than throwing).
 */
export interface TabsContext {
  /** The currently active tab's `value`, or `null` if none is active. */
  readonly activeValue: string | null;
  readonly orientation: "horizontal" | "vertical";
  /** Activates the tab identified by `value` — called on click and on roving-focus keyboard navigation. */
  select(value: string): void;
}

export const TABS_CONTEXT = new InjectionToken<TabsContext>(
  "RecursicaTabsContext",
);
