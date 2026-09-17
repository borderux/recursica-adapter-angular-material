import { Component, ViewEncapsulation, inject } from "@angular/core";
import { RecursicaJsonService } from "../recursica-json.service";

interface OpacityEntry {
  $type?: string;
  $value?: number | null;
}

interface TokensShape {
  tokens?: {
    opacities?: Record<string, OpacityEntry>;
  };
}

interface OpacityRow {
  key: string;
  value: number | null;
  barStyle: string;
}

function getOpacities(data: TokensShape): OpacityRow[] {
  const opacities = data.tokens?.opacities ?? {};

  return Object.entries(opacities)
    .filter(([name]) => !name.startsWith("$"))
    .filter(([, entry]) => entry && typeof entry === "object")
    .map(([key, entry]) => {
      const cssVar = `--recursica_tokens_opacities_${key}`;
      const value = entry?.$value ?? null;
      return {
        key,
        value,
        barStyle: `flex: 1; height: 32px; background-color: #333; opacity: var(${cssVar}); border-radius: 4px;`,
      };
    });
}

/**
 * Direct Angular port of `@recursica/storybook-template`'s
 * `tokens/Opacities.stories.tsx` (`OpacitiesPalette`) — see
 * `../sizes/sizes-demo.stories.ts` for the full rationale shared by every
 * demo under `src/storybook-demos/`.
 */
@Component({
  selector: "storybook-demo-opacities",
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      style="padding: 24px; font-family: system-ui, sans-serif; display: flex; flex-direction: column; gap: 20px;"
    >
      @for (item of opacities; track item.key) {
        <section style="display: flex; align-items: center; gap: 16px;">
          <h2
            style="margin: 0; font-size: 14px; font-weight: 600; min-width: 100px;"
          >
            {{ item.key }}{{ item.value !== null ? " — " + item.value : "" }}
          </h2>
          <div [style]="item.barStyle"></div>
        </section>
      }
    </div>
  `,
})
export class OpacitiesDemoComponent {
  private readonly recursicaJson = inject(RecursicaJsonService);
  readonly opacities: OpacityRow[] = getOpacities(
    this.recursicaJson.tokensJson as TokensShape,
  );
}
