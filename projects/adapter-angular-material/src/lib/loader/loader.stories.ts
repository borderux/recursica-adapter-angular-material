import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { LoaderComponent } from "./loader.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention (no 🚧 prefix,
 * no `_InDevelopmentStub`). Every story runs inside the global
 * `ThemeProviderComponent`/layer-0 decorator (`.storybook/preview.ts`), so
 * `data-recursica-theme` and layer-0 tokens are real for every story with no
 * extra wrapping needed here.
 */
const meta: Meta<LoaderComponent> = {
  title: "UI-Kit/Loader",
  component: LoaderComponent,
  decorators: [moduleMetadata({ imports: [LoaderComponent] })],
  argTypes: {
    variant: { control: "radio", options: ["oval", "bars", "dots"] },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "small", "default", "large"],
    },
    animate: { control: "boolean" },
    overStyled: { control: "boolean" },
    overClass: { control: "text" },
  },
  args: {
    variant: "oval",
    size: "default",
    animate: true,
  },
};
export default meta;

type Story = StoryObj<LoaderComponent>;

const template = `<rec-loader [variant]="variant" [size]="size" [animate]="animate" />`;

/** Default — real oval spinner, real indicator-color/thickness-size tokens. */
export const Default: Story = {
  render: (args) => ({ props: args, template }),
};

/**
 * Built from scratch in plain CSS (no Angular Material/token backing —
 * see IMPLEMENTATION_NOTES.md), matching the real underlying Mantine
 * `Bars` primitive's own compiled markup/CSS exactly: 3 bars, staggered
 * scale+opacity animation.
 */
export const Bars: Story = {
  args: { variant: "bars" },
  render: (args) => ({ props: args, template }),
};

/** Matches the real underlying Mantine `Dots` primitive exactly: 3 dots, middle one delayed. */
export const Dots: Story = {
  args: { variant: "dots" },
  render: (args) => ({ props: args, template }),
};

export const Small: Story = {
  args: { size: "small" },
  render: (args) => ({ props: args, template }),
};

export const Large: Story = {
  args: { size: "large" },
  render: (args) => ({ props: args, template }),
};

/** `animate: false` freezes rotation — useful for deterministic snapshots. */
export const AnimationFrozen: Story = {
  args: { animate: false },
  render: (args) => ({ props: args, template }),
};

/**
 * `overStyled` escape hatch: `overClass`/`overStyle` are only
 * forwarded onto the wrapped `<mat-progress-spinner>` when `overStyled` is
 * `true`. This story sets a real inline color via `overStyle` to prove
 * it actually reaches the wrapped element — see `docs/STYLING_SYSTEM.md` §6.
 *
 * Uses a color deliberately far from the real token default (a red/pink,
 * same family as this override's first draft, `#e91e63`, which resolved
 * correctly but was too visually similar to the default to tell apart at a
 * glance — confirmed via computed styles, not a guess). A bright, unrelated
 * blue makes the override unmistakable regardless of the default token.
 */
export const OverStyledEscapeHatch: Story = {
  args: {
    overStyled: true,
    overStyle: {
      "--loader-color": "#2962ff",
    },
  },
  render: (args) => ({
    props: args,
    template: `<rec-loader [variant]="variant" [size]="size" [overStyled]="overStyled" [overStyle]="overStyle" />`,
  }),
};
