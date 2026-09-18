import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { ButtonComponent } from "./button.component";

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
  decorators: [moduleMetadata({ imports: [ButtonComponent] })],
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

const labelTemplate = `
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
    Button
  </rec-button>
`;

export const Solid: Story = {
  args: { variant: "solid" },
  render: (args) => ({ props: args, template: labelTemplate }),
};

export const Outline: Story = {
  args: { variant: "outline" },
  render: (args) => ({ props: args, template: labelTemplate }),
};

export const Text: Story = {
  args: { variant: "text" },
  render: (args) => ({ props: args, template: labelTemplate }),
};

/** All three variants side by side, for a direct visual comparison. */
export const AllVariants: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px; align-items: center;">
        <rec-button variant="solid">Solid</rec-button>
        <rec-button variant="outline">Outline</rec-button>
        <rec-button variant="text">Text</rec-button>
      </div>
    `,
  }),
};

export const Small: Story = {
  args: { size: "small" },
  render: (args) => ({ props: args, template: labelTemplate }),
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => ({ props: args, template: labelTemplate }),
};

/**
 * Loading-state composition: the composed real `<rec-loader>` renders in
 * place of the (visually hidden, still-in-DOM) label, and the button is
 * disabled. See `button.component.ts`'s "Loading-state composition" doc
 * comment.
 */
export const Loading: Story = {
  args: { loading: true },
  render: (args) => ({ props: args, template: labelTemplate }),
};

export const LoadingOutline: Story = {
  args: { loading: true, variant: "outline" },
  render: (args) => ({ props: args, template: labelTemplate }),
};

/**
 * `useRecursicaLoader: false` — Material has nothing built-in to fall back
 * to (unlike Mantine), so this renders no visual loading indicator at all;
 * the button is still disabled while `loading`.
 */
export const LoadingWithoutRecursicaLoader: Story = {
  args: { loading: true, useRecursicaLoader: false },
  render: (args) => ({ props: args, template: labelTemplate }),
};

/** `icon`: a `TemplateRef` rendered via `*ngTemplateOutlet` — see class doc comment. */
export const WithIcon: Story = {
  render: () => ({
    template: `
      <ng-template #star>
        <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" aria-hidden="true">
          <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 9.2l7.1-.6z" />
        </svg>
      </ng-template>
      <rec-button [icon]="star">With icon</rec-button>
    `,
  }),
};

/** `iconOnly`: no label text, `data-content="icon-only"` sizing tokens. */
export const IconOnly: Story = {
  render: () => ({
    template: `
      <ng-template #star>
        <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" aria-hidden="true">
          <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 9.2l7.1-.6z" />
        </svg>
      </ng-template>
      <rec-button [icon]="star" [iconOnly]="true" ariaLabel="Favorite"></rec-button>
    `,
  }),
};

/**
 * `overStyled` escape hatch: `overClass`/`overStyle` are only
 * forwarded onto the wrapped `<button matButton>` when `overStyled` is
 * `true`. This story sets a real inline style via `overStyle` to prove
 * it actually reaches the wrapped element — see `docs/STYLING_SYSTEM.md` §6.
 *
 * Uses an unmistakable color (not a border) deliberately: the `solid`
 * variant's own `border-color` token resolves to transparent by design (a
 * filled button's shape comes from its background, not a visible border),
 * so a border-only override here would apply correctly but render
 * invisibly — true but not a convincing demo. `background-color` is always
 * visible regardless of variant/token values.
 */
export const OverStyledEscapeHatch: Story = {
  args: {
    overStyled: true,
    overStyle: { "background-color": "magenta", "border-color": "cyan" },
  },
  render: (args) => ({
    props: args,
    template: `
      <rec-button
        [variant]="variant"
        [overStyled]="overStyled"
        [overStyle]="overStyle"
      >
        Over-styled
      </rec-button>
    `,
  }),
};
