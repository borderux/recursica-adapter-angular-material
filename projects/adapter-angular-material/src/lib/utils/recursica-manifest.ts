import { Injectable, inject } from "@angular/core";

/** The parsed Forge `recursica_manifest.json`. Only the parts an adapter reads are typed. */
export type RecursicaManifest = Record<string, unknown>;

/**
 * Holds the manifest handed to `<rec-theme-provider [manifest]="…">` and makes it available to
 * every component rendered inside it — the Angular equivalent of `RecursicaThemeProvider
 * manifest={…}` / `useRecursicaManifest()` in the Mantine adapter. A root singleton, set by
 * `ThemeProviderComponent` — not a component-level provider, because a story/page declared outside
 * the provider's template (Storybook's wrapper decorators, a routed page) is not an element-tree
 * descendant of it and would not see a component-level provider.
 */
@Injectable({ providedIn: "root" })
export class RecursicaManifestStore {
  manifest?: RecursicaManifest;
}

/** Reads the manifest, throwing a clear error when no `<rec-theme-provider [manifest]>` supplies one. */
export function injectRecursicaManifest(componentName: string) {
  const store = inject(RecursicaManifestStore, { optional: true });
  return (): RecursicaManifest => {
    if (!store?.manifest) {
      throw new Error(
        `${componentName}: no Recursica manifest. Pass the parsed recursica_manifest.json as <rec-theme-provider [manifest]="manifest">.`,
      );
    }
    return store.manifest;
  };
}
