import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { LayerComponent } from "./layer.component";
import { StackComponent } from "../stack/stack.component";
import { TextComponent } from "../text/text.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention (no 🚧 prefix,
 * no `_InDevelopmentStub`).
 *
 * Mirrors the reference's own `Layer.stories.tsx` — found in the shared
 * `@recursica/storybook-template` package (`templates/../stories/components/Layer.stories.tsx`
 * as installed), not in `recursica-adapter-mantine-v8`'s own `src/components/Layer/`
 * folder (which holds only `USAGE.md`) — easy to miss on a per-adapter-repo
 * search alone. Real story set: `Default`, `NestedLayers`, `ContentsOnly`.
 *
 * `Default` relies on the global `layer`/`withLayer` Storybook args +
 * decorator (`.storybook/preview.ts`/`storybook-layer-wrapper.component.ts`
 * — ported directly from the reference's own identical mechanism), which
 * wraps *every* story in this Storybook in an outer `rec-layer` by default
 * — no per-story manual wrap needed here, matching the reference's own
 * plain, unwrapped `Default` JSX exactly.
 *
 * No per-story `data-recursica-theme="light"` wrapper `<div>` either (an
 * earlier draft of this file had one on every story) — `rec-theme-provider`
 * (wired globally via `StorybookThemeSyncComponent`, `.storybook/preview.ts`)
 * already sets the real `data-recursica-theme` attribute on
 * `document.documentElement` for every story, following Storybook's own
 * light/dark toolbar toggle. A hardcoded per-story `light` div would have
 * silently defeated that toggle for this component specifically (a
 * descendant `[data-recursica-theme="light"]` div out-scopes the real
 * `dark` value on `<html>` for CSS selectors that key off it) — removed
 * as part of this fix, not left in place.
 */
const meta: Meta<LayerComponent> = {
  title: "UI-Kit/Layer",
  component: LayerComponent,
  decorators: [
    moduleMetadata({
      imports: [LayerComponent, StackComponent, TextComponent],
    }),
  ],
};
export default meta;

type Story = StoryObj<LayerComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <rec-stack style="padding: 24px;">
        <rec-text>This content sits directly on the layer applied by the story's outer Layer wrapper — use the withLayer/layer Story Controls to preview layers 0-3.</rec-text>
      </rec-stack>
    `,
  }),
};

export const NestedLayers: Story = {
  render: () => ({
    template: `
      <rec-layer [layer]="1" style="padding: 24px; display: block;">
        Layer 1
        <rec-layer [layer]="2" style="padding: 24px; margin-top: 16px; display: block;">
          Layer 2
          <rec-layer [layer]="3" style="padding: 24px; margin-top: 16px; display: block;">
            Layer 3
          </rec-layer>
        </rec-layer>
      </rec-layer>
    `,
  }),
};

/**
 * `contentsOnly`: no box is rendered (`display: contents`), so no
 * background/border/padding shows — `data-recursica-layer` itself is
 * omitted. Children still participate in the surrounding cascade. This is
 * the expected, correct rendering for this story, not a bug.
 */
export const ContentsOnly: Story = {
  render: () => ({
    template: `
      <rec-layer [layer]="1" [contentsOnly]="true">
        <rec-stack style="border: 1px dashed currentColor; padding: 24px;">
          <rec-text>This box comes from a plain child Stack, not Layer itself — with contentsOnly, Layer renders no box of its own and applies no layer styling.</rec-text>
        </rec-stack>
      </rec-layer>
    `,
  }),
};
