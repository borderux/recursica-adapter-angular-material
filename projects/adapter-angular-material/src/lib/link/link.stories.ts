import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { LinkComponent } from "./link.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * reference's own `Link.stories.tsx` story set (`Default`, `WithIcon`,
 * `InlineText`) — `Polymorphic` has no equivalent here since this adapter
 * (like every other component in it) doesn't offer Mantine's
 * `createPolymorphicComponent` root-element swap (see `avatar.component.ts`'s
 * class doc comment for the identical, established precedent).
 *
 * No dedicated `OverStyledEscapeHatch` story — that pattern was recently
 * removed adapter-wide (Button/AssistiveElement) as unwanted story clutter;
 * the underlying `overStyled`/`overClass`/`overStyle` inputs still exist on
 * the component and are exposed via `argTypes` below instead, matching
 * `button.stories.ts`'s current convention.
 */
const meta: Meta<LinkComponent> = {
  title: "UI-Kit/Link",
  component: LinkComponent,
  decorators: [
    moduleMetadata({
      imports: [LinkComponent],
    }),
  ],
  argTypes: {
    href: { control: "text" },
    overStyled: { control: "boolean" },
    overClass: { control: "text" },
  },
  args: {
    href: "#",
  },
};
export default meta;

type Story = StoryObj<LinkComponent>;

export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `<rec-link [href]="href">Link text</rec-link>`,
  }),
};

export const WithIcon: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ng-template #leadingIcon>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        </svg>
      </ng-template>
      <rec-link [href]="href" [icon]="leadingIcon">Link with Icon</rec-link>
    `,
  }),
};

export const InlineText: Story = {
  render: () => ({
    template: `
      <p>Here is some text with an <rec-link href="#">inline link</rec-link> inside it.</p>
    `,
  }),
};
