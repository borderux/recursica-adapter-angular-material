import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { AvatarComponent } from "./avatar.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * genesis adapter's own `Avatar.stories.tsx` / `test/golden/ui-kit-avatar--*.png`.
 */
const meta: Meta<AvatarComponent> = {
  title: "UI-Kit/Avatar",
  component: AvatarComponent,
  decorators: [
    moduleMetadata({
      imports: [AvatarComponent],
    }),
  ],
  argTypes: {
    variant: { control: "select", options: ["solid", "outline", "ghost"] },
    size: { control: "radio", options: ["default", "small", "large"] },
    src: { control: "text" },
  },
  args: {
    size: "default",
    variant: "solid",
  },
};
export default meta;

type Story = StoryObj<AvatarComponent>;

export const Default: Story = {
  render: () => ({
    template: `<rec-avatar size="default" variant="solid"></rec-avatar>`,
  }),
};

export const TextSolidDefault: Story = {
  render: () => ({
    template: `<rec-avatar size="default" variant="solid">JD</rec-avatar>`,
  }),
};

export const ImageLarge: Story = {
  render: () => ({
    template: `
      <rec-avatar
        size="large"
        src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=250&q=80"
      ></rec-avatar>
    `,
  }),
};

export const IconSmallGhost: Story = {
  render: () => ({
    template: `
      <ng-template #userIcon>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </ng-template>
      <rec-avatar size="small" variant="ghost" [icon]="userIcon"></rec-avatar>
    `,
  }),
};
