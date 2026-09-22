import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { SegmentedControlComponent } from "./segmented-control.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * reference's own `SegmentedControl.stories.tsx` exactly: Default,
 * FullWidth, Vertical, Disabled, WithIcons.
 */
const meta: Meta<SegmentedControlComponent> = {
  title: "UI-Kit/SegmentedControl",
  component: SegmentedControlComponent,
  decorators: [
    moduleMetadata({
      imports: [SegmentedControlComponent],
    }),
  ],
  argTypes: {
    orientation: { control: "radio", options: ["horizontal", "vertical"] },
    fullWidth: { control: "boolean" },
    disabled: { control: "boolean" },
  },
};
export default meta;

type Story = StoryObj<SegmentedControlComponent>;

export const Default: Story = {
  args: {
    data: ["React", "Angular", "Vue", "Svelte"],
    orientation: "horizontal",
    fullWidth: false,
  },
};

export const FullWidth: Story = {
  args: {
    data: ["Daily", "Weekly", "Monthly"],
    fullWidth: true,
  },
};

export const Vertical: Story = {
  args: {
    data: ["Option 1", "Option 2", "Option 3"],
    orientation: "vertical",
  },
};

export const Disabled: Story = {
  args: {
    data: ["Preview", "Code", "Edit"],
    disabled: true,
  },
};

export const WithIcons: Story = {
  render: () => ({
    template: `
      <ng-template #checkIcon>
        <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </ng-template>
      <rec-segmented-control
        [data]="[
          { value: 'daily', label: 'Daily', icon: checkIcon },
          { value: 'weekly', label: 'Weekly', icon: checkIcon },
          { value: 'monthly', label: 'Monthly', icon: checkIcon }
        ]"
      ></rec-segmented-control>
    `,
  }),
};
