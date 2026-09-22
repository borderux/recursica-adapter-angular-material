import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { AssistiveElementComponent } from "./assistive-element.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention.
 */
const meta: Meta<AssistiveElementComponent> = {
  title: "UI-Kit/AssistiveElement",
  component: AssistiveElementComponent,
  decorators: [moduleMetadata({ imports: [AssistiveElementComponent] })],
  argTypes: {
    assistiveVariant: { control: "radio", options: ["help", "error"] },
    assistiveWithIcon: { control: "boolean" },
  },
  args: {
    assistiveVariant: "help",
    assistiveWithIcon: true,
  },
};
export default meta;

type Story = StoryObj<AssistiveElementComponent>;

export const DefaultHelp: Story = {
  render: (args) => ({
    props: args,
    template: `
      <rec-assistive-element [assistiveVariant]="assistiveVariant" [assistiveWithIcon]="assistiveWithIcon">
        This is a standard assistive layout explaining specific configurations.
      </rec-assistive-element>
    `,
  }),
};

export const ErrorState: Story = {
  args: { assistiveVariant: "error" },
  render: (args) => ({
    props: args,
    template: `
      <rec-assistive-element [assistiveVariant]="assistiveVariant" [assistiveWithIcon]="assistiveWithIcon">
        Invalid property. You must satisfy the constraints outlined above.
      </rec-assistive-element>
    `,
  }),
};

export const NoIconHelp: Story = {
  args: { assistiveWithIcon: false },
  render: (args) => ({
    props: args,
    template: `
      <rec-assistive-element [assistiveVariant]="assistiveVariant" [assistiveWithIcon]="assistiveWithIcon">
        Fallback textual representation without visual injection targets.
      </rec-assistive-element>
    `,
  }),
};

/**
 * `overStyled` escape hatch: `overClass`/`overStyle` are only forwarded
 * onto this component's own root `<div>` when `overStyled` is `true` — see
 * `docs/STYLING_SYSTEM.md` §6.
 *
 * Uses `background-color`/`padding`, not `color`: the root's own inline
 * `color` would be inherited by `.textWrapper`, but `.textWrapper` has its
 * own directly-matching color rule — a directly-matching rule on a
 * descendant always wins over an inherited value from an ancestor,
 * regardless of the ancestor's specificity, so a `color` override here
 * would silently appear to do nothing. `background-color` has no such
 * competing rule and is unmistakable.
 */
export const OverStyledEscapeHatch: Story = {
  args: {
    overStyled: true,
    overStyle: {
      "background-color": "#2962ff",
      padding: "8px",
      "border-radius": "4px",
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <rec-assistive-element [overStyled]="overStyled" [overStyle]="overStyle">
        Over-styled assistive text.
      </rec-assistive-element>
    `,
  }),
};
