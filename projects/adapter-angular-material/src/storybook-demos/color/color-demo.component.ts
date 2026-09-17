import { Component, ViewEncapsulation, inject } from "@angular/core";
import { RecursicaJsonService } from "../recursica-json.service";

const STEP_ORDER = [
  "000",
  "050",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "1000",
] as const;

interface ColorToken {
  $type: string;
  $value: string;
}

function isColorToken(value: unknown): value is ColorToken {
  return (
    typeof value === "object" &&
    value !== null &&
    "$type" in value &&
    (value as ColorToken).$type === "color" &&
    "$value" in value &&
    typeof (value as ColorToken).$value === "string"
  );
}

interface ColorStep {
  step: string;
  swatchStyle: string;
}

interface ColorScale {
  scaleId: string;
  alias: string;
  steps: ColorStep[];
}

interface TokensShape {
  tokens?: { colors?: Record<string, Record<string, unknown>> };
}

function getColorScales(tokensData: TokensShape): ColorScale[] {
  const colors = tokensData.tokens?.colors ?? {};

  return Object.entries(colors).map(([scaleId, scaleEntries]) => {
    const alias =
      typeof scaleEntries["alias"] === "string"
        ? (scaleEntries["alias"] as string)
        : scaleId;
    const steps = STEP_ORDER.filter((step) => {
      const entry = scaleEntries[step];
      return entry !== undefined && isColorToken(entry);
    }).map((step) => {
      const cssVar = `--recursica_tokens_colors_${scaleId}_${step}`;
      return {
        step,
        swatchStyle: `width: 60px; height: 20px; flex-shrink: 0; background-color: var(${cssVar});`,
      };
    });
    return { scaleId, alias, steps };
  });
}

/**
 * Direct Angular port of `@recursica/storybook-template`'s
 * `tokens/Color.stories.tsx` (`ColorPalette`) — see this folder's
 * `color-demo.stories.ts` for the story wiring and shared rationale.
 */
@Component({
  selector: "storybook-demo-color",
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      style="padding: 24px; font-family: system-ui, sans-serif; display: flex; flex-direction: row; gap: 12px; flex-wrap: wrap;"
    >
      @for (scale of colorScales; track scale.scaleId) {
        <section
          style="display: flex; flex-direction: column; align-items: flex-start;"
        >
          <h2 style="margin-bottom: 4px; font-size: 12px; font-weight: 600;">
            {{ scale.scaleId }} ({{ scale.alias }})
          </h2>
          <div
            style="display: flex; flex-direction: column; gap: 0; border-radius: 4px; overflow: hidden; border: 1px solid rgba(0,0,0,0.1);"
          >
            @for (step of scale.steps; track step.step) {
              <div
                style="display: flex; flex-direction: row; align-items: center; gap: 4px;"
              >
                <div [style]="step.swatchStyle"></div>
                <span style="font-size: 10px; color: #666;">{{
                  step.step
                }}</span>
              </div>
            }
          </div>
        </section>
      }
    </div>
  `,
})
export class ColorDemoComponent {
  private readonly recursicaJson = inject(RecursicaJsonService);
  readonly colorScales: ColorScale[] = getColorScales(
    this.recursicaJson.tokensJson as TokensShape,
  );
}
