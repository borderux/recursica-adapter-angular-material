import type { RecursicaManifest } from "./recursica-manifest";

interface ManifestNumber {
  $value?: unknown;
}

interface ManifestLayoutGrid {
  "min-width"?: ManifestNumber;
  "max-width"?: ManifestNumber;
}

function width(grid: ManifestLayoutGrid, key: "min-width" | "max-width") {
  const value = grid[key]?.$value;
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(
      `layout-grid ${key} must be a non-negative number, got ${String(value)}`,
    );
  }
  return value;
}

/**
 * Builds a `{ name: "<start>px" }` breakpoints object from the manifest's layout grids. Opt-in:
 * nothing in the adapter calls this for you, and the result is a plain object you can edit.
 *
 * Breakpoints are mobile-first start widths, so each non-default grid maps to its `min-width`; a
 * grid with only a `max-width` (e.g. `mobile`, up to 480px) starts at `0px`. The `default` grid
 * has no width of its own: when other grids exist it is included, named `default`, starting one
 * pixel past the widest `max-width`. A manifest with only the `default` grid (the stock Forge
 * export) returns `{}`.
 *
 * Throws for a non-default grid with neither width, for non-numeric widths, and when no other grid
 * has a `max-width` for `default` to start after.
 */
export function breakpointsFromRecManifest(
  manifest: RecursicaManifest,
): Record<string, string> {
  const grids = (manifest.brand?.["layout-grids"] ?? {}) as Record<
    string,
    ManifestLayoutGrid
  >;
  const entries: [string, number][] = [];
  let widestMax: number | undefined;
  for (const [name, grid] of Object.entries(grids)) {
    if (name === "default") continue;
    const min = width(grid, "min-width");
    const max = width(grid, "max-width");
    if (min === undefined && max === undefined) {
      throw new Error(
        `layout-grid "${name}" has neither min-width nor max-width`,
      );
    }
    if (max !== undefined && (widestMax === undefined || max > widestMax)) {
      widestMax = max;
    }
    entries.push([name, min ?? 0]);
  }
  if (entries.length > 0) {
    if (widestMax === undefined) {
      throw new Error(
        'Cannot place the "default" layout-grid: no other grid has a max-width to start after',
      );
    }
    entries.push(["default", widestMax + 1]);
  }
  return Object.fromEntries(
    entries
      .sort((a, b) => a[1] - b[1])
      .map(([name, start]) => [name, `${start}px`]),
  );
}
