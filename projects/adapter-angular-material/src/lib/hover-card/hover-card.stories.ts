import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { HoverCardComponent } from "./hover-card.component";
import { HoverCardTargetComponent } from "./hover-card-target.component";
import { HoverCardDropdownComponent } from "./hover-card-dropdown.component";
import { ButtonComponent } from "../button/button.component";
import { TextComponent } from "../text/text.component";
import { GroupComponent } from "../group/group.component";
import { StackComponent } from "../stack/stack.component";
import { AvatarComponent } from "../avatar/avatar.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * genesis adapter's own `HoverCard.stories.tsx` /
 * `test/golden/ui-kit-hovercard--*.png`.
 */
const meta: Meta<HoverCardComponent> = {
  title: "UI-Kit/HoverCard",
  component: HoverCardComponent,
  decorators: [
    moduleMetadata({
      imports: [
        HoverCardComponent,
        HoverCardTargetComponent,
        HoverCardDropdownComponent,
        ButtonComponent,
        TextComponent,
        GroupComponent,
        StackComponent,
        AvatarComponent,
      ],
    }),
  ],
  argTypes: {
    position: {
      control: "select",
      options: [
        "bottom",
        "bottom-start",
        "bottom-end",
        "top",
        "top-start",
        "top-end",
        "left",
        "left-start",
        "left-end",
        "right",
        "right-start",
        "right-end",
      ],
    },
    withBeak: { control: "boolean" },
    offset: { control: "number" },
    openDelay: { control: "number" },
    closeDelay: { control: "number" },
    disabled: { control: "boolean" },
  },
};
export default meta;

type Story = StoryObj<HoverCardComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <rec-hover-card position="top" [withBeak]="true" [offset]="5" [openDelay]="0" [closeDelay]="150">
        <rec-hover-card-target>
          <rec-button variant="solid">Hover me</rec-button>
        </rec-hover-card-target>
        <rec-hover-card-dropdown>
          <rec-text>This is a hover card with informational content that appears when you hover over the target element.</rec-text>
        </rec-hover-card-dropdown>
      </rec-hover-card>
    `,
  }),
};

export const WithoutBeak: Story = {
  render: () => ({
    template: `
      <rec-hover-card position="top" [withBeak]="false" [offset]="5">
        <rec-hover-card-target>
          <rec-button variant="outline">Without Beak</rec-button>
        </rec-hover-card-target>
        <rec-hover-card-dropdown>
          <rec-text>This hover card has the beak disabled, showing a clean dropdown without the pointing indicator.</rec-text>
        </rec-hover-card-dropdown>
      </rec-hover-card>
    `,
  }),
};

export const RichContent: Story = {
  render: () => ({
    template: `
      <rec-hover-card position="top" [offset]="5">
        <rec-hover-card-target>
          <rec-button variant="solid">User Profile</rec-button>
        </rec-hover-card-target>
        <rec-hover-card-dropdown>
          <rec-group>
            <rec-avatar alt="User avatar"></rec-avatar>
            <rec-stack>
              <rec-text>Jane Doe</rec-text>
              <rec-text>Software Engineer at Recursica</rec-text>
            </rec-stack>
          </rec-group>
        </rec-hover-card-dropdown>
      </rec-hover-card>
    `,
  }),
};
