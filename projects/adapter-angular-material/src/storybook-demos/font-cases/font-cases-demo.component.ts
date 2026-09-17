import { Component, ViewEncapsulation, inject } from "@angular/core";
import { RecursicaJsonService } from "../recursica-json.service";

interface CaseEntry {
  $type?: string;
  $value?: string | null;
}

interface TokensShape {
  tokens?: {
    font?: {
      cases?: Record<string, CaseEntry>;
    };
  };
}

interface CaseRow {
  key: string;
  value: string | null;
  sampleStyle: string;
}

function getCases(data: TokensShape): CaseRow[] {
  const cases = data.tokens?.font?.cases ?? {};

  return Object.entries(cases)
    .filter(([name]) => !name.startsWith("$"))
    .filter(([, entry]) => entry && typeof entry === "object")
    .map(([key, entry]) => {
      const cssVar = `--recursica_tokens_font_cases_${key}`;
      const value = entry?.$value ?? null;
      return {
        key,
        value,
        sampleStyle: `text-transform: var(${cssVar}); font-size: 18px; line-height: 1.4; margin: 0;`,
      };
    });
}

const SAMPLE_TEXT =
  "The quick onyx goblin jumps over the lazy dwarf, executing a superb and swift maneuver with extraordinary zeal.";

/**
 * Direct Angular port of `@recursica/storybook-template`'s
 * `tokens/Font.cases.stories.tsx` (`FontCasesPalette`) — see
 * `../sizes/sizes-demo.stories.ts` for the full rationale shared by every
 * demo under `src/storybook-demos/`.
 */
@Component({
  selector: "storybook-demo-font-cases",
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      style="padding: 24px; font-family: system-ui, sans-serif; display: flex; flex-direction: column; gap: 24px;"
    >
      @for (item of cases; track item.key) {
        <section>
          <h2 style="margin-bottom: 8px; font-size: 14px; font-weight: 600;">
            {{ item.key
            }}{{ item.value !== null ? " — " + item.value : " (none)" }}
          </h2>
          <p [style]="item.sampleStyle">{{ sampleText }}</p>
        </section>
      }
    </div>
  `,
})
export class FontCasesDemoComponent {
  private readonly recursicaJson = inject(RecursicaJsonService);
  readonly sampleText = SAMPLE_TEXT;
  readonly cases: CaseRow[] = getCases(
    this.recursicaJson.tokensJson as TokensShape,
  );
}
