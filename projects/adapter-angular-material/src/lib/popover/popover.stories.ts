import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { PopoverComponent } from "./popover.component";
import { PopoverTargetComponent } from "./popover-target.component";
import { PopoverDropdownComponent } from "./popover-dropdown.component";
import { ButtonComponent } from "../button/button.component";
import { TextComponent } from "../text/text.component";
import { GroupComponent } from "../group/group.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * reference's own `Popover.stories.tsx` exactly: `Default` (click-toggle,
 * uncontrolled/closed to start), `SolidDefault` (`defaultOpened` seeds it
 * open — a static representation, same as the reference's own "static
 * representation of an opened popover" story), `WithoutBeak` (`defaultOpened`,
 * `withBeak="false"`, `position="bottom"`).
 */
const meta: Meta<PopoverComponent> = {
  title: "UI-Kit/Popover",
  component: PopoverComponent,
  decorators: [
    moduleMetadata({
      imports: [
        PopoverComponent,
        PopoverTargetComponent,
        PopoverDropdownComponent,
        ButtonComponent,
        TextComponent,
        GroupComponent,
      ],
    }),
  ],
  argTypes: {
    position: {
      control: "select",
      options: [
        "top",
        "top-start",
        "top-end",
        "bottom",
        "bottom-start",
        "bottom-end",
        "left",
        "left-start",
        "left-end",
        "right",
        "right-start",
        "right-end",
      ],
    },
    withBeak: { control: "boolean" },
    width: { control: "number" },
    disabled: { control: "boolean" },
  },
};
export default meta;

type Story = StoryObj<PopoverComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <rec-popover position="top" [withBeak]="true" [width]="250">
        <rec-popover-target>
          <rec-button variant="solid">Toggle Popover</rec-button>
        </rec-popover-target>
        <rec-popover-dropdown>
          <rec-text>This is the popover content. It can contain any elements you want to display when the user clicks the target.</rec-text>
        </rec-popover-dropdown>
      </rec-popover>
    `,
  }),
};

export const SolidDefault: Story = {
  render: () => ({
    template: `
      <rec-group justify="center" wrap="nowrap" style="padding: 100px;">
        <rec-popover position="top" [withBeak]="true" [width]="200" [defaultOpened]="true">
          <rec-popover-target>
            <rec-button variant="solid">Toggle Popover</rec-button>
          </rec-popover-target>
          <rec-popover-dropdown>
            <rec-text>This is a static representation of an opened popover with a beak.</rec-text>
          </rec-popover-dropdown>
        </rec-popover>
      </rec-group>
    `,
  }),
};

export const WithoutBeak: Story = {
  render: () => ({
    template: `
      <rec-group justify="center" wrap="nowrap" style="padding: 100px;">
        <rec-popover position="bottom" [withBeak]="false" [width]="200" [defaultOpened]="true">
          <rec-popover-target>
            <rec-button variant="outline">Bottom Popover</rec-button>
          </rec-popover-target>
          <rec-popover-dropdown>
            <rec-text>This popover is positioned at the bottom and has no beak.</rec-text>
          </rec-popover-dropdown>
        </rec-popover>
      </rec-group>
    `,
  }),
};
