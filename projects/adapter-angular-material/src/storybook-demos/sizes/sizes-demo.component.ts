import { Component, ViewEncapsulation, inject } from "@angular/core";
import { RecursicaJsonService } from "../recursica-json.service";

interface DimensionValue {
  value: number;
  unit: string;
}

interface SizeEntry {
  $type?: string;
  $value?: DimensionValue | string;
}

interface TokensShape {
  tokens?: {
    sizes?: Record<string, SizeEntry>;
  };
}

interface SizeRow {
  key: string;
  cssVar: string;
  value: string | null;
  boxStyle: string;
  sampleStyle: string;
}

function formatSizeValue(entry: SizeEntry | undefined): string | null {
  const v = entry?.$value;
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "value" in v && "unit" in v) {
    return `${v.value}${v.unit}`;
  }
  return null;
}

function getSizes(data: TokensShape): SizeRow[] {
  const sizes = data.tokens?.sizes ?? {};

  return Object.entries(sizes)
    .filter(([name]) => !name.startsWith("$"))
    .filter(([, entry]) => entry && typeof entry === "object")
    .filter(([key]) => !key.startsWith("elevation-")) // skip elevation sub-keys (blur, offset_x, etc.)
    .map(([key, entry]) => {
      const cssVar = `--recursica_tokens_sizes_${key}`;
      const value = formatSizeValue(entry);
      return {
        key,
        cssVar,
        value,
        boxStyle: `width: var(${cssVar}); height: 32px; background-color: #333; border-radius: 4px; margin-bottom: 8px;`,
        sampleStyle: `font-size: var(${cssVar}); line-height: 1.4; margin: 0;`,
      };
    });
}

const SAMPLE_TEXT =
  "The quick onyx goblin jumps over the lazy dwarf, executing a superb and swift maneuver with extraordinary zeal.";

/**
 * Direct Angular port of `@recursica/storybook-template`'s
 * `tokens/Sizes.stories.tsx` (`SizesPalette`) — see
 * `sizes-demo.stories.ts` for the story wiring and the shared "why here,
 * not `src/lib/`" rationale (repeated on every demo component in
 * `src/storybook-demos/` so each is self-explanatory on its own).
 */
@Component({
  selector: "storybook-demo-sizes",
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      style="padding: 24px; font-family: system-ui, sans-serif; display: flex; flex-direction: column; gap: 24px;"
    >
      @for (item of sizes; track item.key) {
        <section>
          <h2 style="margin-bottom: 8px; font-size: 14px; font-weight: 600;">
            {{ item.key }}{{ item.value !== null ? " — " + item.value : "" }}
          </h2>
          <div [style]="item.boxStyle"></div>
          <p [style]="item.sampleStyle">{{ sampleText }}</p>
        </section>
      }
    </div>
  `,
})
export class SizesDemoComponent {
  private readonly recursicaJson = inject(RecursicaJsonService);
  readonly sampleText = SAMPLE_TEXT;
  readonly sizes: SizeRow[] = getSizes(
    this.recursicaJson.tokensJson as TokensShape,
  );
}
