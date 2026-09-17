import { Component, ViewEncapsulation, inject } from "@angular/core";
import { RecursicaJsonService } from "../recursica-json.service";

/*
  Layout grids from recursica_brand.json are breakpoints:
  - Desktop: largest; applies at viewport ≥ 1280px → 6 columns, max-width 1280px, gutter
  - Tablet: at viewport < 1280 and ≥ 810px → 6 columns, max-width 810px, gutter
  - Mobile: at viewport < 810px → 4 columns, max-width 480px, gutter

  Grid CSS variables exist in recursica_variables_scoped.css as
  --recursica_brand_layout-grids_* (desktop/tablet/mobile: columns, gutter,
  max-width). That file has no @media queries; it only defines the
  variables. This story implements the intended breakpoints (1280 / 810 /
  480) with @media rules so the grid responds to viewport. Resize the
  Storybook preview frame to see the change. Direct port of
  `@recursica/storybook-template`'s `theme/LayoutGrids.stories.tsx` — see
  `../sizes/sizes-demo.stories.ts` for the full rationale shared by every
  demo under `src/storybook-demos/`.
*/

const REF_PATTERN = /^\{([^}]+)\}$/;

function getByPath(obj: unknown, path: string): unknown {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function resolveRef(
  ref: string,
  data: Record<string, unknown>,
  depth = 0,
): unknown {
  if (depth > 5) return ref;
  const match = REF_PATTERN.exec(ref.trim());
  if (!match) return ref;
  const path = match[1];
  let resolved = getByPath(data, path);
  if (resolved == null) {
    const altPath = path.replace(/\.size\./, ".sizes.");
    resolved = getByPath(data, altPath);
  }
  if (
    resolved != null &&
    typeof resolved === "object" &&
    "$value" in resolved
  ) {
    const val = (resolved as { $value: unknown }).$value;
    if (typeof val === "string" && REF_PATTERN.test(val)) {
      return resolveRef(val, data, depth + 1);
    }
  }
  return resolved;
}

function dimensionToPx(entry: unknown): number | null {
  if (entry == null || typeof entry !== "object") return null;
  const node = entry as Record<string, unknown>;
  const value = node["$value"];
  if (
    value != null &&
    typeof value === "object" &&
    "value" in value &&
    "unit" in value
  ) {
    const v = value as { value: number; unit: string };
    if (v.unit === "px") return v.value;
  }
  if (typeof value === "number") return value;
  return null;
}

interface LayoutGridEntry {
  "max-width"?: { $type?: string; $value?: number };
  columns?: { $type?: string; $value?: number };
  gutter?: { $type?: string; $value?: string };
}

interface BrandShape {
  brand?: {
    "layout-grids"?: Record<string, LayoutGridEntry>;
  };
}

interface LayoutGrid {
  name: string;
  maxWidthPx: number;
  columns: number;
  gutterPx: number;
}

function getLayoutGrids(
  brandData: BrandShape,
  mergedData: Record<string, unknown>,
): LayoutGrid[] {
  const grids = brandData.brand?.["layout-grids"] ?? {};

  return Object.entries(grids)
    .filter(([name]) => !name.startsWith("$"))
    .filter(([, entry]) => entry && typeof entry === "object")
    .map(([name, entry]) => {
      const maxWidthEntry = entry["max-width"];
      const maxWidthPx =
        maxWidthEntry?.$value != null &&
        typeof maxWidthEntry.$value === "number"
          ? maxWidthEntry.$value
          : 800;

      const columnsEntry = entry.columns;
      const columns =
        columnsEntry?.$value != null && typeof columnsEntry.$value === "number"
          ? columnsEntry.$value
          : 6;

      let gutterPx = 16;
      const gutterEntry = entry.gutter;
      const gutterRef = gutterEntry?.$value;
      if (typeof gutterRef === "string" && REF_PATTERN.test(gutterRef)) {
        const resolved = resolveRef(gutterRef, mergedData);
        const dim = dimensionToPx(resolved);
        if (dim != null) gutterPx = dim;
      }

      return { name, maxWidthPx, columns, gutterPx };
    });
}

function getResponsiveGridCss(layoutGrids: LayoutGrid[]): string {
  const desktop = layoutGrids.find((g) => g.name === "desktop");
  const tablet = layoutGrids.find((g) => g.name === "tablet");
  const mobile = layoutGrids.find((g) => g.name === "mobile");

  const breakpointDesktopPx = desktop?.maxWidthPx ?? 1280;
  const breakpointTabletPx = tablet?.maxWidthPx ?? 810;
  const breakpointMobilePx = mobile?.maxWidthPx ?? 480;

  const desktopCols = desktop?.columns ?? 6;
  const desktopGutter = desktop?.gutterPx ?? 16;
  const tabletCols = tablet?.columns ?? 6;
  const tabletGutter = tablet?.gutterPx ?? 16;
  const mobileCols = mobile?.columns ?? 4;
  const mobileGutter = mobile?.gutterPx ?? 16;

  return `
    .layout-grids-responsive-demo {
      display: grid;
      grid-template-columns: repeat(var(--layout-cols), 1fr);
      gap: var(--layout-gutter);
      max-width: var(--layout-max-width);
      margin: 0 auto;
    }
    /* Mobile: default (< 810px) */
    .layout-grids-responsive-demo {
      --layout-cols: ${mobileCols};
      --layout-gutter: ${mobileGutter}px;
      --layout-max-width: ${breakpointMobilePx}px;
    }
    /* Tablet: 810px to < 1280px */
    @media (min-width: ${breakpointTabletPx}px) and (max-width: ${breakpointDesktopPx - 1}px) {
      .layout-grids-responsive-demo {
        --layout-cols: ${tabletCols};
        --layout-gutter: ${tabletGutter}px;
        --layout-max-width: ${breakpointTabletPx}px;
      }
    }
    /* Desktop: 1280px and above */
    @media (min-width: ${breakpointDesktopPx}px) {
      .layout-grids-responsive-demo {
        --layout-cols: ${desktopCols};
        --layout-gutter: ${desktopGutter}px;
        --layout-max-width: ${breakpointDesktopPx}px;
      }
    }
  `;
}

@Component({
  selector: "storybook-demo-layout-grids",
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      style="padding: 24px; font-family: system-ui, sans-serif; display: flex; flex-direction: column; gap: 24px;"
    >
      <style>
        {{ responsiveCss }}
      </style>
      <p style="margin: 0; font-size: 14px; color: #666;">
        One responsive grid: desktop ≥{{ breakpointDesktopPx }}px ({{
          desktopCols
        }}
        cols), tablet {{ breakpointTabletPx }}–{{ breakpointDesktopPx - 1 }}px
        ({{ tabletCols }} cols), mobile &lt;{{ breakpointTabletPx }}px ({{
          mobileCols
        }}
        cols). Resize the viewport to see the grid change.
      </p>
      <div class="layout-grids-responsive-demo">
        @for (cell of cells; track cell) {
          <div
            style="min-height: 48px; background-color: rgba(0,0,0,0.08); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666;"
          >
            {{ cell }}
          </div>
        }
      </div>
    </div>
  `,
})
export class LayoutGridsDemoComponent {
  private readonly recursicaJson = inject(RecursicaJsonService);

  private readonly brandJson = this.recursicaJson.brandJson as BrandShape;
  private readonly mergedData: Record<string, unknown> = {
    ...(this.recursicaJson.tokensJson as Record<string, unknown>),
    brand: this.brandJson.brand,
  };
  private readonly layoutGrids: LayoutGrid[] = getLayoutGrids(
    this.brandJson,
    this.mergedData,
  );

  private readonly desktop = this.layoutGrids.find((g) => g.name === "desktop");
  private readonly tablet = this.layoutGrids.find((g) => g.name === "tablet");
  private readonly mobile = this.layoutGrids.find((g) => g.name === "mobile");

  readonly breakpointDesktopPx = this.desktop?.maxWidthPx ?? 1280;
  readonly breakpointTabletPx = this.tablet?.maxWidthPx ?? 810;

  readonly desktopCols = this.desktop?.columns ?? 6;
  readonly tabletCols = this.tablet?.columns ?? 6;
  readonly mobileCols = this.mobile?.columns ?? 4;

  readonly cells: number[] = [
    ...Array(
      Math.max(this.desktopCols * 2, this.tabletCols * 2, this.mobileCols * 2),
    ).keys(),
  ].map((i) => i + 1);

  readonly responsiveCss = getResponsiveGridCss(this.layoutGrids);
}
