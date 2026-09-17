import { Component, ViewEncapsulation, inject } from "@angular/core";
import { RecursicaJsonService } from "../recursica-json.service";

type FontWeights = Record<string, { $type: string; $value: number }>;

interface TypefaceVariant {
  weight?: string;
  style?: string;
}

interface TypefaceEntry {
  $value?: string | string[];
  $extensions?: {
    "com.google.fonts"?: { url?: string; variants?: TypefaceVariant[] };
    variants?: TypefaceVariant[];
  };
}

interface TokensShape {
  tokens?: {
    font?: {
      typefaces?: Record<string, TypefaceEntry>;
      weights?: FontWeights;
    };
  };
}

interface WeightRef {
  key: string;
  weightVar: string;
}

interface WeightSample extends WeightRef {
  sampleStyle: string;
  label: string;
}

interface TypefaceRow {
  key: string;
  heading: string;
  weights: WeightSample[];
}

function weightKeyToCssVar(key: string): string {
  return `--recursica_tokens_font_weights_${key}`;
}

function parseWeightRef(ref: string): string | null {
  const match = /tokens\.font\.weights\.([^}.]+)/.exec(ref);
  return match ? match[1].trim() : null;
}

function getWeightsSortedByValue(data: TokensShape): WeightRef[] {
  const weights = data.tokens?.font?.weights ?? {};

  const entries = Object.entries(weights)
    .filter(([name]) => !name.startsWith("$"))
    .filter(
      ([, entry]) =>
        entry?.$type === "number" && typeof entry.$value === "number",
    )
    .map(([key, entry]) => ({ key, value: entry.$value }))
    .sort((a, b) => a.value - b.value);

  return entries.map(({ key }) => ({ key, weightVar: weightKeyToCssVar(key) }));
}

function getWeightKeysForTypeface(
  typefaceKey: string,
  data: TokensShape,
): string[] {
  const typefaces = data.tokens?.font?.typefaces;
  const entry = typefaces?.[typefaceKey];
  const weightsData = data.tokens?.font?.weights;
  if (!weightsData) return [];

  const variants =
    entry?.$extensions?.["com.google.fonts"]?.variants ??
    entry?.$extensions?.variants;
  if (Array.isArray(variants) && variants.length > 0) {
    const keys = new Set<string>();
    for (const v of variants) {
      const key = parseWeightRef(v?.weight ?? "");
      if (key && Object.prototype.hasOwnProperty.call(weightsData, key)) {
        keys.add(key);
      }
    }
    const order = getWeightsSortedByValue(data).map((w) => w.key);
    return order.filter((k) => keys.has(k));
  }

  return getWeightsSortedByValue(data).map((w) => w.key);
}

function getTypefaceDisplayName(entry: TypefaceEntry): string {
  const v = entry?.$value;
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length > 0 && typeof v[0] === "string") return v[0];
  return "";
}

function getFontFamilyValue(entry: TypefaceEntry): string {
  const v = entry?.$value;
  if (typeof v === "string") return v.includes(" ") ? `"${v}"` : v;
  if (Array.isArray(v) && v.length > 0) {
    return v
      .map((name) => (name.includes(" ") ? `"${name}"` : name))
      .join(", ");
  }
  return "";
}

function getTypefaces(data: TokensShape): TypefaceRow[] {
  const typefaces = data.tokens?.font?.typefaces ?? {};
  const allWeights = getWeightsSortedByValue(data);

  return Object.entries(typefaces)
    .filter(([name]) => !name.startsWith("$"))
    .filter(([, face]) => face && typeof face === "object")
    .map(([key, entry]) => {
      const displayName = getTypefaceDisplayName(entry);
      const fontFamilyValue = getFontFamilyValue(entry);
      const weightKeys = getWeightKeysForTypeface(key, data);
      const weights = weightKeys
        .map((wk) => allWeights.find((a) => a.key === wk))
        .filter((w): w is WeightRef => w !== undefined)
        .map((w) => ({
          ...w,
          label: w.key.replace(/-/g, " "),
          sampleStyle: `${fontFamilyValue ? `font-family: ${fontFamilyValue}; ` : ""}font-weight: var(${w.weightVar}); font-size: 18px; line-height: 1.4; margin: 0;`,
        }));
      return {
        key,
        heading: displayName ? `${key} — ${displayName}` : key,
        weights,
      };
    });
}

const SAMPLE_TEXT =
  "The quick onyx goblin jumps over the lazy dwarf, executing a superb and swift maneuver with extraordinary zeal.";

/**
 * Direct Angular port of `@recursica/storybook-template`'s
 * `tokens/Font.weight.stories.tsx` (`FontPalette`) — see
 * `../sizes/sizes-demo.stories.ts` for the full rationale shared by every
 * demo under `src/storybook-demos/`. The real Google Fonts stylesheets
 * these samples need are loaded once, globally, by
 * `RecursicaJsonService.loadGoogleFonts()` from `.storybook/preview.ts` —
 * not from this component — so every typeface here renders in its real
 * webfont rather than falling back to a system font.
 */
@Component({
  selector: "storybook-demo-font-weights",
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      style="padding: 24px; font-family: system-ui, sans-serif; display: flex; flex-direction: column; gap: 32px;"
    >
      @for (face of typefaces; track face.key) {
        <section>
          <h2 style="margin-bottom: 12px; font-size: 14px; font-weight: 600;">
            {{ face.heading }}
          </h2>
          @for (w of face.weights; track w.key) {
            <div style="margin-bottom: 12px;">
              <span
                style="display: block; font-size: 11px; color: #666; margin-bottom: 2px; text-transform: capitalize;"
              >
                {{ w.label }}
              </span>
              <p [style]="w.sampleStyle">{{ sampleText }}</p>
            </div>
          }
        </section>
      }
    </div>
  `,
})
export class FontWeightsDemoComponent {
  private readonly recursicaJson = inject(RecursicaJsonService);
  readonly sampleText = SAMPLE_TEXT;
  readonly typefaces: TypefaceRow[] = getTypefaces(
    this.recursicaJson.tokensJson as TokensShape,
  );
}
