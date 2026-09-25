import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { ContainerComponent } from "./container.component";
import { TextComponent } from "../text/text.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention, mirroring the
 * source-of-truth `Container.stories.tsx`'s own story names exactly
 * (Default/SmallContainer/FluidContainer).
 *
 * The reference's own stories wrap `<Container>` in a raw padding+background
 * `<div>` purely to make the container's bounds visible — kept as a raw
 * `<div>` here too, a deliberate exception to the adapter's usual
 * raw-div-chrome playbook (`docs/COMPONENT_STORYBOOK_GUIDE.md` rule #2):
 * every `rec-*` flex primitive (`rec-stack`/`rec-group`/`rec-flex`) makes
 * its children flex items, and `Container`'s own centering CSS
 * (`margin-inline: auto` + `max-width`, no explicit `width`) is the classic
 * *block-box* auto-margin technique — as a flex item, a non-stretched cross
 * axis (or a non-grown main axis) sizes to content instead, and a stretched
 * cross axis (`rec-stack`'s own default) overrides the auto margins
 * entirely. Confirmed live: wrapping in `rec-stack` collapsed every story to
 * ~160px wide regardless of `size`/`fluid`. Only a plain block parent (no
 * flex/grid formatting context) reproduces the reference's own behavior,
 * which is itself why the reference uses a raw `<div>` here rather than its
 * own `Stack`/`Flex`. The white/border/padding styling applied directly to
 * `<Container>` in the reference is kept as `style=` on `<rec-container>` —
 * an exempt layout primitive, see that component's own class doc comment.
 */
const meta: Meta<ContainerComponent> = {
  title: "UI-Kit/Container",
  component: ContainerComponent,
  decorators: [
    moduleMetadata({
      imports: [ContainerComponent, TextComponent],
    }),
  ],
};
export default meta;

type Story = StoryObj<ContainerComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <div style="background-color: #f0f0f0; padding: 16px;">
        <rec-container style="background-color: white; padding: 16px; border: 1px solid #ccc;">
          <rec-text>
            This is a Container holding centered content. The background and
            border are added just to demonstrate the layout bounds visually.
          </rec-text>
        </rec-container>
      </div>
    `,
  }),
};

export const SmallContainer: Story = {
  render: () => ({
    template: `
      <div style="background-color: #f0f0f0; padding: 16px;">
        <rec-container size="sm" style="background-color: white; padding: 16px; border: 1px solid #ccc;">
          <rec-text>Small Container Layout</rec-text>
        </rec-container>
      </div>
    `,
  }),
};

export const FluidContainer: Story = {
  render: () => ({
    template: `
      <div style="background-color: #f0f0f0; padding: 16px;">
        <rec-container [fluid]="true" style="background-color: white; padding: 16px; border: 1px solid #ccc;">
          <rec-text>Fluid Container Layout</rec-text>
        </rec-container>
      </div>
    `,
  }),
};
