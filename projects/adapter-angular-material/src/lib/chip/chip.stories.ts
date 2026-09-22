import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { ChipComponent } from "./chip.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * variants in the React reference's own `Chip.stories.tsx` /
 * `test/golden/ui-kit-chip--*.png`.
 */
const meta: Meta<ChipComponent> = {
  title: "UI-Kit/Chip",
  component: ChipComponent,
  decorators: [
    moduleMetadata({
      imports: [ChipComponent],
    }),
  ],
  argTypes: {
    error: {
      control: "boolean",
      description: "Applies the error state styling dynamically.",
    },
    disabled: {
      control: "boolean",
      description: "Applies disabled token states.",
    },
    checked: {
      control: "boolean",
      description: "Forces the visual selected state.",
    },
  },
};
export default meta;

type Story = StoryObj<ChipComponent>;

// The Default story exposing native properties for the playground.
export const Default: Story = {
  args: {
    error: false,
    disabled: false,
  },
  render: (args) => ({
    props: args,
    template: `<rec-chip [error]="error" [disabled]="disabled">Default Chip</rec-chip>`,
  }),
};

// Static stories for regression snapshots — matches
// ui-kit-chip--unselected.png / --selected.png / --error-state.png /
// --error-selected.png / --removable.png / --with-leading-icon.png /
// --with-leading-icon-selected.png exactly.

export const Unselected: Story = {
  render: () => ({
    template: `<rec-chip [checked]="false">Unselected</rec-chip>`,
  }),
};

export const Selected: Story = {
  render: () => ({
    // A no-op (checkedChange) binding is enough to mark this chip
    // interactive — matches the React reference's own `onChange={() => {}}`
    // on this exact story (see Chip.stories.tsx), which exists purely to
    // enable the pointer cursor / focusability, not to actually re-render.
    template: `<rec-chip [checked]="true" (checkedChange)="$event">Selected</rec-chip>`,
  }),
};

export const ErrorState: Story = {
  render: () => ({
    template: `<rec-chip [error]="true" [checked]="false">Error</rec-chip>`,
  }),
};

export const ErrorSelected: Story = {
  render: () => ({
    template: `<rec-chip [error]="true" [checked]="true" (checkedChange)="$event">Error Selected</rec-chip>`,
  }),
};

export const Removable: Story = {
  render: () => ({
    template: `<rec-chip [checked]="false" (remove)="onRemove()">Dismissible</rec-chip>`,
    props: {
      onRemove: () => console.log("Removal Action Triggered"),
    },
  }),
};

export const WithLeadingIcon: Story = {
  render: () => ({
    template: `
      <ng-template #leadingIcon>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 8v4"></path>
          <path d="M12 16h.01"></path>
        </svg>
      </ng-template>
      <rec-chip [checked]="false" [icon]="leadingIcon">Leading Icon</rec-chip>
    `,
  }),
};

// Selecting a chip with a leading icon swaps in the checkmark rather than
// showing both — matches the checkmark-replaces-leading-icon behavior
// chip.component.ts's class doc comment documents.
export const WithLeadingIconSelected: Story = {
  render: () => ({
    template: `
      <ng-template #leadingIcon>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 8v4"></path>
          <path d="M12 16h.01"></path>
        </svg>
      </ng-template>
      <rec-chip [checked]="true" [icon]="leadingIcon" (checkedChange)="$event">Leading Icon Selected</rec-chip>
    `,
  }),
};

// Verification-only stories (not part of the golden regression set) — a
// real, fully-wired uncontrolled toggle and a removable chip that actually
// disappears, so real end-to-end behavior (not just static rendering) can
// be exercised with a real Playwright click. See IMPLEMENTATION_NOTES.md's
// Verification section.

export const InteractiveToggle: Story = {
  render: () => ({
    template: `<rec-chip [defaultChecked]="false" (checkedChange)="checked = $event">{{ checked ? 'Selected' : 'Click to select' }}</rec-chip>`,
    props: { checked: false },
  }),
};

export const InteractiveRemovable: Story = {
  render: () => ({
    template: `
      @if (visible) {
        <rec-chip [checked]="false" (remove)="visible = false">Click x to remove</rec-chip>
      } @else {
        <span data-testid="removed">Chip removed</span>
      }
    `,
    props: { visible: true },
  }),
};
