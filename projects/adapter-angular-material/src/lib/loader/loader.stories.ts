import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { LoaderComponent } from "./loader.component";
import { LayerComponent } from "../layer/layer.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Every story runs
 * inside the global `ThemeProviderComponent`/layer-0 decorator
 * (`.storybook/preview.ts`), so `data-recursica-theme` and layer-0 tokens
 * are real for every story with no extra wrapping needed here — except
 * `Default`/`LayerTwoOval` below, which each wrap their own explicit
 * `<rec-layer>` to mirror the reference's own `Layer`-wrapped stories.
 *
 * `Default`/`StaticOvalDefault`/`StaticBarsLarge`/`StaticDotsSmall`/
 * `LayerTwoOval` mirror the reference's own `Loader.stories.tsx` exactly —
 * each one combines `variant`+`size`+`animate`(+`layer`) into a single
 * named story the same way the reference does, rather than isolating one
 * axis per story. `Bars`/`Dots`/`Small`/`Large` (this adapter's own
 * pre-existing per-axis stories) are kept alongside them where they still
 * add coverage the 5 combined stories don't (see each story's own comment);
 * the old per-axis `Default`/`AnimationFrozen` were removed as exact
 * duplicates of the new `Default`/`StaticOvalDefault` (`oval`/`default`
 * size/animate=true and `oval`/`default` size/animate=false, respectively —
 * identical args, nothing lost).
 */
const meta: Meta<LoaderComponent> = {
  title: "UI-Kit/Loader",
  component: LoaderComponent,
  decorators: [moduleMetadata({ imports: [LoaderComponent, LayerComponent] })],
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

/**
 * Animated, oval, default size, wrapped in an explicit `layer={0}` context —
 * matches the reference's own `Default` exactly (real spinner rotation, not
 * frozen; not covered by visual regression there for the same reason).
 */
export const Default: Story = {
  args: {
    variant: "oval",
    size: "default",
  },
  render: (args) => ({
    props: args,
    template: `
      <rec-layer [layer]="0" style="padding: 24px; display: block;">
        ${template}
      </rec-layer>
    `,
  }),
};

/** `animate: false` freezes the oval spin — deterministic for visual regression. Matches the reference's own `StaticOvalDefault`. */
export const StaticOvalDefault: Story = {
  args: {
    variant: "oval",
    size: "default",
    animate: false,
  },
  render: (args) => ({ props: args, template }),
};

/** `animate: false` freezes the bars, `size: large` — matches the reference's own `StaticBarsLarge`. */
export const StaticBarsLarge: Story = {
  args: {
    variant: "bars",
    size: "large",
    animate: false,
  },
  render: (args) => ({ props: args, template }),
};

/** `animate: false` freezes the dots, `size: sm` — matches the reference's own `StaticDotsSmall`. */
export const StaticDotsSmall: Story = {
  args: {
    variant: "dots",
    size: "sm",
    animate: false,
  },
  render: (args) => ({ props: args, template }),
};

/**
 * Animated, oval, default size, wrapped in an explicit `layer={2}` context —
 * matches the reference's own `LayerTwoOval` exactly.
 */
export const LayerTwoOval: Story = {
  args: {
    variant: "oval",
    size: "default",
  },
  render: (args) => ({
    props: args,
    template: `
      <rec-layer [layer]="2" style="padding: 24px; display: block;">
        ${template}
      </rec-layer>
    `,
  }),
};

/**
 * Built from scratch in plain CSS (no Angular Material/token backing —
 * see IMPLEMENTATION_NOTES.md), matching the real underlying Mantine
 * `Bars` primitive's own compiled markup/CSS exactly: 3 bars, staggered
 * scale+opacity animation. Not covered by `StaticBarsLarge` above (that
 * one is frozen/large) — this is the animated/default-size case.
 */
export const Bars: Story = {
  args: { variant: "bars" },
  render: (args) => ({ props: args, template }),
};

/**
 * Matches the real underlying Mantine `Dots` primitive exactly: 3 dots,
 * middle one delayed. Not covered by `StaticDotsSmall` above (that one is
 * frozen/small) — this is the animated/default-size case.
 */
export const Dots: Story = {
  args: { variant: "dots" },
  render: (args) => ({ props: args, template }),
};

/** Animated oval at `size: small` — not covered by any of the 5 combined stories above. */
export const Small: Story = {
  args: { size: "small" },
  render: (args) => ({ props: args, template }),
};

/** Animated oval at `size: large` — not covered by any of the 5 combined stories above (`StaticBarsLarge` is `bars`, not `oval`). */
export const Large: Story = {
  args: { size: "large" },
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
