import { Injectable } from "@angular/core";

// Static, build-time imports of the real Recursica JSON files at the repo
// root (`resolveJsonModule` is already `true` in this repo's root
// `tsconfig.json`) — the direct Angular equivalent of the React reference
// adapter's `.storybook/preview.tsx`:
//   import recursicaTokens from "../recursica_tokens.json";
// "Dynamic" here means sourced live from these real files at build time, not
// hardcoded/copy-pasted into each demo story — editing these root JSON files
// and rebuilding Storybook updates every story that reads this service, with
// no per-story duplication of token data.
import tokensJsonData from "../../../../recursica_tokens.json";
import brandJsonData from "../../../../recursica_brand.json";
import uiKitJsonData from "../../../../recursica_ui-kit.json";

interface TypefaceEntry {
  $extensions?: {
    "com.google.fonts"?: {
      url?: string;
    };
  };
}

interface TypefacesTokensShape {
  tokens?: {
    font?: {
      typefaces?: Record<string, TypefaceEntry>;
    };
  };
}

/**
 * Storybook-only tooling — deliberately NOT part of the public adapter API:
 * not exported from `public-api.ts`, and lives under `src/storybook-demos/`
 * (see that folder's own doc comment in any of its `*.stories.ts` files for
 * why it's still under `src/` rather than alongside
 * `.storybook/storybook-theme-sync.component.ts`).
 *
 * Direct Angular port of `@recursica/storybook-template`'s React
 * `RecursicaJsonProvider` / `useRecursicaJson()` context
 * (`contexts/RecursicaJsonContext.js` / `RecursicaJsonProvider.js`, compiled
 * into `dist/preview-*.js` in the installed package — that package ships no
 * readable TSX source, only compiled output and `.d.ts` files, so the real
 * behavior was confirmed by reading the compiled bundle directly) and of
 * `withRecursicaFonts` (same bundle, the function assigned to `J` there).
 * Angular has no need for React Context's "avoid prop drilling" mechanism —
 * an injectable `providedIn: 'root'` singleton service achieves the same
 * "parse the real JSON once, make it available anywhere" goal idiomatically.
 * Every ported demo story component injects this service instead of
 * hardcoding token values.
 */
@Injectable({ providedIn: "root" })
export class RecursicaJsonService {
  /** Parsed `recursica_tokens.json` (repo root). */
  readonly tokensJson: unknown = tokensJsonData;
  /** Parsed `recursica_brand.json` (repo root). */
  readonly brandJson: unknown = brandJsonData;
  /** Parsed `recursica_ui-kit.json` (repo root). */
  readonly uiKitJson: unknown = uiKitJsonData;

  private googleFontsLoaded = false;

  /**
   * Faithful port of `withRecursicaFonts`'s real, confirmed behavior (not
   * guessed — read directly out of the compiled bundle): for each
   * non-`$`-prefixed entry in `tokensJson.tokens.font.typefaces`, reads
   * `entry.$extensions["com.google.fonts"].url`, throwing the exact same
   * error shape the source does when a typeface is missing it, then appends
   * one `<link rel="stylesheet">` to `document.head` per unique URL that
   * isn't already present there.
   *
   * Safe to call more than once and from more than one place: an internal
   * flag short-circuits repeat calls, and — like the source — a
   * `document.head` lookup per URL means even a second, unguarded call
   * would never insert a duplicate `<link>`. Invoked once, at Storybook
   * preview module-init time, from `.storybook/preview.ts` (see that file),
   * mirroring the source's own global-decorator (`createPreviewConfig`)
   * application to every story rather than scoping it to only the token/
   * font demo stories.
   */
  loadGoogleFonts(): void {
    if (this.googleFontsLoaded) return;
    this.googleFontsLoaded = true;

    if (typeof document === "undefined") return;

    const typefaces = (this.tokensJson as TypefacesTokensShape).tokens?.font
      ?.typefaces;

    if (
      !typefaces ||
      typeof typefaces !== "object" ||
      Object.keys(typefaces).length === 0
    ) {
      console.warn("RecursicaJsonService: No typefaces listed in tokens.");
      return;
    }

    const urls: string[] = [];
    for (const [key, entry] of Object.entries(typefaces)) {
      if (key.startsWith("$") || !entry || typeof entry !== "object") {
        continue;
      }
      const url = entry.$extensions?.["com.google.fonts"]?.url;
      if (typeof url !== "string" || url === "") {
        throw new Error(
          `Typeface "${key}" is missing a Google Font definition (tokens.font.typefaces.${key}.$extensions["com.google.fonts"].url).`,
        );
      }
      urls.push(url);
    }

    if (urls.length === 0) {
      console.warn(
        "RecursicaJsonService: No Google Font URLs found in typefaces.",
      );
      return;
    }

    for (const url of urls) {
      if (document.head.querySelector(`link[href="${url}"]`)) continue;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      document.head.appendChild(link);
    }
  }
}
