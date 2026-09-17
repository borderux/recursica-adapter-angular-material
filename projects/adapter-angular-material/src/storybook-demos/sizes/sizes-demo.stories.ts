import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { SizesDemoComponent } from "./sizes-demo.component";

/**
 * Generic, framework-agnostic Recursica demo story — ported natively for
 * Angular from `@recursica/storybook-template`'s `tokens/Sizes.stories.tsx`
 * (a React/Vite-only package, confirmed unusable in this project the same
 * way `@recursica/adapter-common` is — see
 * `docs/CREATING_AN_ADAPTER.md`'s decision-log entry on the package's
 * `stories` folder never shipping to npm). This demo and its ten siblings
 * under `src/storybook-demos/` show Recursica's design tokens/theme/brand
 * layers, independent of any specific UI-kit adapter — they read the real
 * root `recursica_*.json` files via `RecursicaJsonService`
 * (`../recursica-json.service.ts`), so editing those files and rebuilding
 * Storybook updates this story automatically.
 *
 * Lives outside `src/lib/` (this repo's real, public component API — see
 * `src/public-api.ts`) because these demos are Storybook-only tooling, not
 * Recursica components: no `rec-` selector prefix (see
 * `eslint.config.mjs`'s override for this folder), never exported from
 * `public-api.ts`, and — like every other `*.stories.ts` file in this
 * repo — never reachable from `public-api.ts`'s import graph, so ng-packagr
 * never bundles it into the published package even though it's typechecked
 * by `tsconfig.lib.json` (`include: ["src/**\/*.ts"]`) like everything else
 * under `src/`.
 */
const meta: Meta<SizesDemoComponent> = {
  title: "Tokens/Sizes",
  component: SizesDemoComponent,
  decorators: [moduleMetadata({ imports: [SizesDemoComponent] })],
  parameters: {
    layout: "padded",
  },
};
export default meta;

type Story = StoryObj<SizesDemoComponent>;

export const Default: Story = {
  render: () => ({
    template: `<storybook-demo-sizes />`,
  }),
};
