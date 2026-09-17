import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { ThemeProviderComponent } from "./theme-provider.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention.
 *
 * Unlike `Layer`'s own stories, these don't need a manually-added
 * `data-recursica-theme` wrapper `<div>` — `rec-theme-provider` sets that
 * attribute itself, on `document.documentElement`, which is what makes the
 * `theme` control here meaningfully different from `Layer`'s stories: toggling
 * it actually flips the real page-level theme attribute, not a local one.
 */
const meta: Meta<ThemeProviderComponent> = {
  title: "UI-Kit/RecursicaThemeProvider",
  component: ThemeProviderComponent,
  decorators: [moduleMetadata({ imports: [ThemeProviderComponent] })],
  argTypes: {
    theme: {
      control: "radio",
      options: ["light", "dark"],
    },
  },
};
export default meta;

type Story = StoryObj<ThemeProviderComponent>;

const template = `
  <rec-theme-provider [theme]="theme">
    Theme: {{ theme }} — this box's background/text color come from layer 0's
    real --recursica_brand_layer_0_* variables, driven by data-recursica-theme
    on document.documentElement.
  </rec-theme-provider>
`;

export const Light: Story = {
  args: { theme: "light" },
  render: (args) => ({ props: args, template }),
};

export const Dark: Story = {
  args: { theme: "dark" },
  render: (args) => ({ props: args, template }),
};

/**
 * Use the Controls panel's "theme" radio control to toggle light/dark live
 * and confirm the rendered layer-0 background/text colors actually change —
 * proving `ngOnChanges` reactively re-applies `data-recursica-theme` on
 * `document.documentElement` at runtime, not just once at first render (the
 * Angular-idiomatic equivalent of the React source's
 * `useEffect(() => { ... }, [theme])`).
 */
export const ToggleTheme: Story = {
  args: { theme: "light" },
  render: (args) => ({ props: args, template }),
};
