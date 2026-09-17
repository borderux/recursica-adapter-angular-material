import { Component, ViewEncapsulation, inject } from "@angular/core";
import { RecursicaJsonService } from "../recursica-json.service";

interface TypographyEntry {
  $type?: string;
  $value?: unknown;
}

type BrandTypography = Record<string, TypographyEntry>;

interface BrandShape {
  brand?: { typography?: BrandTypography };
}

interface TypographyRow {
  name: string;
  helperClass: string;
}

function getTypographyTypeNames(brandData: BrandShape): string[] {
  const typography = brandData.brand?.typography ?? {};
  return Object.entries(typography)
    .filter(([key]) => !key.startsWith("$"))
    .filter(
      ([, entry]) => entry && typeof entry === "object" && entry.$value != null,
    )
    .map(([name]) => name);
}

/** Maps brand.typography type name to the scoped CSS helper class (e.g.
 * `body` → `recursica_brand_typography_body`) — see
 * `recursica_variables_scoped.css`'s own header comment, item 6. */
function typographyClassName(typeName: string): string {
  return `recursica_brand_typography_${typeName}`;
}

const SAMPLE_TEXT =
  "The quick onyx goblin jumps over the lazy dwarf, executing a superb and swift maneuver with extraordinary zeal.";

/**
 * Direct Angular port of `@recursica/storybook-template`'s
 * `theme/Type.stories.tsx` (`ThemeTypographyPalette`) — see
 * `../sizes/sizes-demo.stories.ts` for the full rationale shared by every
 * demo under `src/storybook-demos/`.
 */
@Component({
  selector: "storybook-demo-type",
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      style="padding: 24px; font-family: system-ui, sans-serif; display: flex; flex-direction: column; gap: 32px;"
    >
      @for (row of rows; track row.name) {
        <section>
          <h2
            style="margin-bottom: 8px; font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.05em;"
          >
            {{ row.name }}
            <span
              style="font-weight: 400; text-transform: none; letter-spacing: 0;"
            >
              {{ " — "
              }}<code style="font-size: 11px;">.{{ row.helperClass }}</code>
            </span>
          </h2>
          <p [class]="row.helperClass" style="margin: 0;">{{ sampleText }}</p>
        </section>
      }
    </div>
  `,
})
export class TypeDemoComponent {
  private readonly recursicaJson = inject(RecursicaJsonService);
  readonly sampleText = SAMPLE_TEXT;
  readonly rows: TypographyRow[] = getTypographyTypeNames(
    this.recursicaJson.brandJson as BrandShape,
  ).map((name) => ({ name, helperClass: typographyClassName(name) }));
}
