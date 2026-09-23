import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { ButtonComponent } from "./button.component";
import { LayerComponent } from "../layer/layer.component";
import { StackComponent } from "../stack/stack.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention (no 🚧 prefix,
 * no `_InDevelopmentStub`). Every story runs inside the global
 * `ThemeProviderComponent`/layer-0 decorator (`.storybook/preview.ts`), so
 * `data-recursica-theme`/`data-recursica-layer="0"` are real for every
 * story — this component's color tokens are theme+layer scoped
 * (`recursica_variables_scoped.css`), so this matters for real rendering,
 * not just cosmetics.
 */
const meta: Meta<ButtonComponent> = {
  title: "UI-Kit/Button",
  component: ButtonComponent,
  decorators: [
    moduleMetadata({
      imports: [ButtonComponent, LayerComponent, StackComponent],
    }),
  ],
  argTypes: {
    variant: { control: "radio", options: ["solid", "outline", "text"] },
    size: { control: "radio", options: ["default", "small"] },
    loading: { control: "boolean" },
    loaderVariant: { control: "radio", options: ["oval", "bars", "dots"] },
    useRecursicaLoader: { control: "boolean" },
    disabled: { control: "boolean" },
    disableRipple: { control: "boolean" },
    disabledInteractive: { control: "boolean" },
    overStyled: { control: "boolean" },
    overClass: { control: "text" },
  },
  args: {
    variant: "solid",
    size: "default",
    loading: false,
    useRecursicaLoader: true,
    disabled: false,
  },
};
export default meta;

type Story = StoryObj<ButtonComponent>;

/**
 * `label` isn't a real `@Input()` on `ButtonComponent` (text is projected via
 * `<ng-content>`, not bound) — so it can't live in a `StoryObj<ButtonComponent>`'s
 * strictly-typed `args`. This generates a template with the label baked in as
 * a literal, keeping every other control (`variant`/`size`/etc.) real-args-bound.
 */
function withLabel(label: string): string {
  return `
    <rec-button
      [variant]="variant"
      [size]="size"
      [loading]="loading"
      [loaderVariant]="loaderVariant"
      [useRecursicaLoader]="useRecursicaLoader"
      [disabled]="disabled"
      [disableRipple]="disableRipple"
      [disabledInteractive]="disabledInteractive"
    >
      ${label}
    </rec-button>
  `;
}

/**
 * Story names/text/args mirror the genesis adapter's own
 * `Button.stories.tsx` exactly (`Default`, `SolidDefault`, `OutlineSmall`,
 * `TextWithIcon`, `IconOnly`) — a direct visual comparison between the two
 * adapters only means anything if both are rendering the same content.
 */
export const Default: Story = {
  args: { variant: "solid", size: "default" },
  render: (args) => ({ props: args, template: withLabel("Explore Button") }),
};

export const SolidDefault: Story = {
  args: { variant: "solid", size: "default" },
  render: (args) => ({ props: args, template: withLabel("Solid Default") }),
};

export const OutlineSmall: Story = {
  args: { variant: "outline", size: "small" },
  render: (args) => ({ props: args, template: withLabel("Outline Small") }),
};

export const DisabledSolid: Story = {
  args: { disabled: true },
  render: (args) => ({ props: args, template: withLabel("Disabled Solid") }),
};

/** Mirrors the reference's own `LayerOneSolid` — a solid button on an elevated (layer 1) surface. */
export const LayerOneSolid: Story = {
  args: { variant: "solid", size: "default" },
  render: (args) => ({
    props: args,
    template: `
      <rec-layer [layer]="1" style="padding: 24px; display: block;">
        ${withLabel("Layer 1 Solid")}
      </rec-layer>
    `,
  }),
};

/**
 * Mirrors the reference's own `TruncatedLabel` — a long label inside a
 * width-constrained container, demonstrating the component's own existing
 * `.labelText` ellipsis/`max-width` CSS (already built, not added for this
 * story — see `button.component.css`).
 */
export const TruncatedLabel: Story = {
  args: { variant: "solid", size: "default" },
  render: (args) => ({
    props: args,
    template: `
      <rec-stack style="max-width: 250px;">
        ${withLabel(
          "This is an exceptionally long button label designed to demonstrate how the component handles text overflow by applying an ellipsis rather than breaking the layout or wrapping to multiple lines.",
        )}
      </rec-stack>
    `,
  }),
};

/**
 * Loading-state composition: the composed real `<rec-loader>` renders in
 * place of the (visually hidden, still-in-DOM) label, and the button is
 * disabled. See `button.component.ts`'s "Loading-state composition" doc
 * comment.
 */
export const Loading: Story = {
  args: { loading: true },
  render: (args) => ({ props: args, template: withLabel("Explore Button") }),
};

/**
 * `icon`: a `TemplateRef` rendered via `*ngTemplateOutlet` — see class doc
 * comment. Same magnifying-glass SVG as the genesis adapter's own
 * `TextWithIcon`/`IconOnly` stories, for a direct visual comparison.
 */
const searchIconTemplate = `
  <ng-template #searchIcon>
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  </ng-template>
`;

export const TextWithIcon: Story = {
  render: () => ({
    template: `
      ${searchIconTemplate}
      <rec-button variant="text" [icon]="searchIcon">Text With Icon</rec-button>
    `,
  }),
};

/** `iconOnly`: no label text, `data-content="icon-only"` sizing tokens. */
export const IconOnly: Story = {
  render: () => ({
    template: `
      ${searchIconTemplate}
      <rec-button [icon]="searchIcon" [iconOnly]="true" ariaLabel="Search"></rec-button>
    `,
  }),
};
