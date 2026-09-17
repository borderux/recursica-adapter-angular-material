import { Component, ViewEncapsulation, inject } from "@angular/core";
import { RecursicaJsonService } from "../recursica-json.service";

interface DimensionValue {
  value: number;
  unit: string;
}

interface LineHeightEntry {
  $type?: string;
  $value?: DimensionValue | number | null;
}

interface TokensShape {
  tokens?: {
    font?: {
      "line-heights"?: Record<string, LineHeightEntry>;
    };
  };
}

interface LineHeightRow {
  key: string;
  display: string | null;
  sampleStyle: string;
}

/** See `font-letter-spacings-demo.component.ts`'s `formatDimension` doc
 * comment — same real `{ value, unit }` dimension-object shape, same fix
 * over the source's plain-number assumption. */
function formatDimension(
  value: DimensionValue | number | null | undefined,
): string | null {
  if (value == null) return null;
  if (typeof value === "number") return `${value}`;
  return `${value.value}${value.unit}`;
}

function getLineHeights(data: TokensShape): LineHeightRow[] {
  const lineHeights = data.tokens?.font?.["line-heights"] ?? {};

  return Object.entries(lineHeights)
    .filter(([name]) => !name.startsWith("$"))
    .filter(([, entry]) => entry && typeof entry === "object")
    .map(([key, entry]) => {
      const cssVar = `--recursica_tokens_font_line-heights_${key}`;
      const display = formatDimension(entry?.$value);
      return {
        key,
        display,
        sampleStyle: `line-height: var(${cssVar}); font-size: 18px; margin: 0;`,
      };
    });
}

const SAMPLE_TEXT =
  "The quick onyx goblin jumps over the lazy dwarf, executing a superb and swift maneuver with extraordinary zeal.";

/**
 * Direct Angular port of `@recursica/storybook-template`'s
 * `tokens/Font.lineHeights.stories.tsx` (`FontLineHeightsPalette`) — see
 * `../sizes/sizes-demo.stories.ts` for the full rationale shared by every
 * demo under `src/storybook-demos/`.
 */
@Component({
  selector: "storybook-demo-font-line-heights",
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      style="padding: 24px; font-family: system-ui, sans-serif; display: flex; flex-direction: column; gap: 24px;"
    >
      @for (item of lineHeights; track item.key) {
        <section>
          <h2 style="margin-bottom: 8px; font-size: 14px; font-weight: 600;">
            {{ item.key
            }}{{ item.display !== null ? " — " + item.display : "" }}
          </h2>
          <p [style]="item.sampleStyle">{{ sampleText }}</p>
        </section>
      }
    </div>
  `,
})
export class FontLineHeightsDemoComponent {
  private readonly recursicaJson = inject(RecursicaJsonService);
  readonly sampleText = SAMPLE_TEXT;
  readonly lineHeights: LineHeightRow[] = getLineHeights(
    this.recursicaJson.tokensJson as TokensShape,
  );
}
