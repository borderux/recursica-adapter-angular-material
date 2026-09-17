import { Component, ViewEncapsulation, inject } from "@angular/core";
import { RecursicaJsonService } from "../recursica-json.service";

interface DimensionValue {
  value: number;
  unit: string;
}

interface LetterSpacingEntry {
  $type?: string;
  $value?: DimensionValue | number | null;
}

interface TokensShape {
  tokens?: {
    font?: {
      "letter-spacings"?: Record<string, LetterSpacingEntry>;
    };
  };
}

interface LetterSpacingRow {
  key: string;
  display: string | null;
  sampleStyle: string;
}

/**
 * Formats a token's `$value` for the human-readable label next to each
 * sample. The source (`tokens/Font.letterSpacings.stories.tsx`) assumed
 * `$value` is always a plain number and rendered `${value}em` directly —
 * but this repo's real `recursica_tokens.json` (confirmed by reading it,
 * same shape in the mantine reference adapter's own copy) stores
 * `letter-spacings`/`line-heights` as `{ value, unit }` dimension objects,
 * not plain numbers, same as `tokens.sizes`. A literal one-to-one port of
 * the source's formatter would render the label as `[object Object]em`
 * while the actual CSS-variable-driven letter-spacing style (unaffected,
 * since that always went through `var(${cssVar})`) rendered correctly —
 * fixed here so the label text is accurate instead of reproducing that
 * upstream display bug.
 */
function formatDimension(
  value: DimensionValue | number | null | undefined,
): string | null {
  if (value == null) return null;
  if (typeof value === "number") return `${value}`;
  return `${value.value}${value.unit}`;
}

function getLetterSpacings(data: TokensShape): LetterSpacingRow[] {
  const letterSpacings = data.tokens?.font?.["letter-spacings"] ?? {};

  return Object.entries(letterSpacings)
    .filter(([name]) => !name.startsWith("$"))
    .filter(([, entry]) => entry && typeof entry === "object")
    .map(([key, entry]) => {
      const cssVar = `--recursica_tokens_font_letter-spacings_${key}`;
      const display = formatDimension(entry?.$value);
      return {
        key,
        display,
        sampleStyle: `letter-spacing: var(${cssVar}); font-size: 18px; line-height: 1.4; margin: 0;`,
      };
    });
}

const SAMPLE_TEXT =
  "The quick onyx goblin jumps over the lazy dwarf, executing a superb and swift maneuver with extraordinary zeal.";

/**
 * Direct Angular port of `@recursica/storybook-template`'s
 * `tokens/Font.letterSpacings.stories.tsx` (`FontLetterSpacingsPalette`) —
 * see `../sizes/sizes-demo.stories.ts` for the full rationale shared by
 * every demo under `src/storybook-demos/`, and this file's own
 * `formatDimension` doc comment for the one intentional deviation from a
 * literal port.
 */
@Component({
  selector: "storybook-demo-font-letter-spacings",
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      style="padding: 24px; font-family: system-ui, sans-serif; display: flex; flex-direction: column; gap: 24px;"
    >
      @for (item of letterSpacings; track item.key) {
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
export class FontLetterSpacingsDemoComponent {
  private readonly recursicaJson = inject(RecursicaJsonService);
  readonly sampleText = SAMPLE_TEXT;
  readonly letterSpacings: LetterSpacingRow[] = getLetterSpacings(
    this.recursicaJson.tokensJson as TokensShape,
  );
}
