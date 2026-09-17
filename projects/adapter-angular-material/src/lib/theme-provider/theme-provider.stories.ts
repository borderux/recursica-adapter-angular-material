import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { ThemeProviderComponent } from "./theme-provider.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention.
 **/
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
    on document.documentElement. Use the Controls panel's "theme" radio to
    toggle this story's own theme directly.
  </rec-theme-provider>
`;

export const Default: Story = {
  args: { theme: "light" },
  render: (args) => ({ props: args, template }),
};
