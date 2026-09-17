import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { LayerComponent } from "./layer.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention (no 🚧 prefix,
 * no `_InDevelopmentStub`).
 *
 * Each story wraps its `<rec-layer>` in a plain `<div data-recursica-theme="light">`
 * so `recursica_variables_scoped.css`'s theme+layer cascade
 * (`[data-recursica-theme="light"] [data-recursica-layer="N"]`) resolves
 * real, non-transparent colors — see that file's own header comment. The
 * token CSS itself is loaded globally for all stories via
 * `.storybook/preview.ts`.
 */
const meta: Meta<LayerComponent> = {
  title: "UI-Kit/Layer",
  component: LayerComponent,
  decorators: [moduleMetadata({ imports: [LayerComponent] })],
};
export default meta;

type Story = StoryObj<LayerComponent>;

export const Layer0: Story = {
  render: () => ({
    template: `
      <div data-recursica-theme="light">
        <rec-layer [layer]="0">Layer 0 — base page surface</rec-layer>
      </div>
    `,
  }),
};

export const Layer1: Story = {
  render: () => ({
    template: `
      <div data-recursica-theme="light">
        <rec-layer [layer]="1">Layer 1 — raised surface</rec-layer>
      </div>
    `,
  }),
};

export const Layer2: Story = {
  render: () => ({
    template: `
      <div data-recursica-theme="light">
        <rec-layer [layer]="2">Layer 2 — further raised surface</rec-layer>
      </div>
    `,
  }),
};

export const Layer3: Story = {
  render: () => ({
    template: `
      <div data-recursica-theme="light">
        <rec-layer [layer]="3">Layer 3 — topmost surface</rec-layer>
      </div>
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
      <div data-recursica-theme="light">
        <rec-layer [layer]="1" [contentsOnly]="true">
          contentsOnly — no box, no data-recursica-layer attribute
        </rec-layer>
      </div>
    `,
  }),
};
