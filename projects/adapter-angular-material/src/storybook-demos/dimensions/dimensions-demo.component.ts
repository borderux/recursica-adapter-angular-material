import { Component, ViewEncapsulation, inject } from "@angular/core";
import { RecursicaJsonService } from "../recursica-json.service";

interface DimensionEntry {
  $type?: string;
  $value?: unknown;
}

type BrandDimensions = Record<string, Record<string, DimensionEntry>>;

interface BrandShape {
  brand?: {
    dimensions?: BrandDimensions;
  };
}

interface DimensionItem {
  key: string;
  cssVar: string;
  kind: "icon" | "text-size" | "border-radii" | "box";
  style: string;
}

interface DimensionSection {
  section: string;
  varPrefix: string;
  items: DimensionItem[];
}

function getDimensionSections(brandData: BrandShape): DimensionSection[] {
  const dimensions = brandData.brand?.dimensions ?? {};

  return Object.entries(dimensions)
    .filter(([name]) => !name.startsWith("$"))
    .filter(([, section]) => section && typeof section === "object")
    .map(([sectionKey, sectionEntries]) => {
      const items = Object.entries(sectionEntries)
        .filter(([name]) => !name.startsWith("$"))
        .filter(([, entry]) => entry && typeof entry === "object")
        .map(([key]) => {
          const cssVar = `--recursica_brand_dimensions_${sectionKey}_${key}`;
          let kind: DimensionItem["kind"] = "box";
          let style: string;
          if (sectionKey === "icons") {
            kind = "icon";
            style = `width: var(${cssVar}); height: var(${cssVar}); flex-shrink: 0;`;
          } else if (sectionKey === "text-size") {
            kind = "text-size";
            style = `margin: 0; font-size: var(${cssVar}); line-height: 1.4; flex: 1;`;
          } else if (sectionKey === "border-radii") {
            kind = "border-radii";
            style = `width: 64px; height: 64px; background-color: transparent; border: 2px solid #333; border-radius: var(${cssVar});`;
          } else {
            style = `width: var(${cssVar}); height: 24px; background-color: #333; border-radius: 4px;`;
          }
          return { key, cssVar, kind, style };
        });
      return {
        section: sectionKey,
        varPrefix: `--recursica_brand_dimensions_${sectionKey}_*`,
        items,
      };
    })
    .filter((s) => s.items.length > 0);
}

const SAMPLE_TEXT = "The quick onyx goblin jumps over the lazy dwarf.";

/**
 * Direct Angular port of `@recursica/storybook-template`'s
 * `theme/Dimensions.stories.tsx` (`ThemeDimensionsPalette`) — see
 * `../sizes/sizes-demo.stories.ts` for the full rationale shared by every
 * demo under `src/storybook-demos/`. The source's `SampleIcon` inline SVG
 * is ported as a template fragment (`@if (item.kind === 'icon')`) rather
 * than a separate component, since it has no reuse beyond this one spot.
 */
@Component({
  selector: "storybook-demo-dimensions",
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      style="padding: 24px; font-family: system-ui, sans-serif; display: flex; flex-direction: column; gap: 32px;"
    >
      @for (section of sections; track section.section) {
        <section>
          <h2
            style="margin-bottom: 16px; font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.05em;"
          >
            {{ section.section }}
            <span
              style="font-weight: 400; text-transform: none; letter-spacing: 0;"
            >
              {{ " — "
              }}<code style="font-size: 11px;">{{ section.varPrefix }}</code>
            </span>
          </h2>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            @for (item of section.items; track item.key) {
              <div style="display: flex; align-items: center; gap: 16px;">
                <span
                  style="margin: 0; font-size: 14px; font-weight: 500; min-width: 80px;"
                  >{{ item.key }}</span
                >
                @if (item.kind === "icon") {
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    [style]="item.style"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    />
                  </svg>
                } @else if (item.kind === "text-size") {
                  <p [style]="item.style">{{ sampleText }}</p>
                } @else {
                  <div [style]="item.style"></div>
                }
              </div>
            }
          </div>
        </section>
      }
    </div>
  `,
})
export class DimensionsDemoComponent {
  private readonly recursicaJson = inject(RecursicaJsonService);
  readonly sampleText = SAMPLE_TEXT;
  readonly sections: DimensionSection[] = getDimensionSections(
    this.recursicaJson.brandJson as BrandShape,
  );
}
