import { Injectable, signal } from "@angular/core";

/** Shape of `recursica_manifest.json` — only the parts this adapter reads are typed. */
export interface RecursicaManifest {
  "ui-kit"?: { components?: Record<string, unknown> };
  brand?: { "layout-grids"?: Record<string, unknown> };
  [key: string]: unknown;
}

/**
 * Holds the Forge manifest handed to `<rec-theme-provider [manifest]>`. A root singleton, like the
 * `data-recursica-theme` attribute the same provider sets on `document.documentElement`.
 * Components that need manifest data (e.g. `Pagination`'s button variants) read it from here and
 * throw if it was never provided.
 */
@Injectable({ providedIn: "root" })
export class RecursicaManifestService {
  readonly manifest = signal<RecursicaManifest | undefined>(undefined);

  /** The manifest, or throws naming the component that needs it. */
  require(componentName: string): RecursicaManifest {
    const manifest = this.manifest();
    if (!manifest) {
      throw new Error(
        `${componentName} needs the Forge manifest: pass it as [manifest] on <rec-theme-provider>.`,
      );
    }
    return manifest;
  }
}
