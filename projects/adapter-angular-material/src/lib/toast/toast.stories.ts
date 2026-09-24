import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { ToastComponent } from "./toast.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Story set
 * mirrors the genesis adapter's own real `Toast.stories.tsx`: one story per
 * variant, a with/without-close-button pair, and a with-icon story — see
 * `toast.component.ts`'s class doc comment for why this is a plain,
 * directly-rendered component (not a popup/toast-stack story).
 */
const meta: Meta<ToastComponent> = {
  title: "UI-Kit/Toast",
  component: ToastComponent,
  decorators: [moduleMetadata({ imports: [ToastComponent] })],
  argTypes: {
    variant: { control: "radio", options: ["default", "error", "success"] },
    title: { control: "text" },
    withCloseButton: { control: "boolean" },
  },
  args: {
    variant: "default",
    title: "Update Available",
    withCloseButton: true,
  },
};
export default meta;

type Story = StoryObj<ToastComponent>;

export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `
      <rec-toast [variant]="variant" [title]="title" [withCloseButton]="withCloseButton">
        A new version of the application is available to download. Please
        restart your browser to apply the latest security patches and
        feature updates.
      </rec-toast>
    `,
  }),
};

export const Success: Story = {
  args: { variant: "success", title: "Changes Saved" },
  render: (args) => ({
    props: args,
    template: `
      <rec-toast [variant]="variant" [title]="title" [withCloseButton]="withCloseButton">
        Your changes have been saved successfully.
      </rec-toast>
    `,
  }),
};

export const ErrorState: Story = {
  args: { variant: "error", title: "Action Required" },
  render: (args) => ({
    props: args,
    template: `
      <rec-toast [variant]="variant" [title]="title" [withCloseButton]="withCloseButton">
        You must complete your profile setup before accessing this feature.
      </rec-toast>
    `,
  }),
};

export const WithoutCloseButton: Story = {
  args: { withCloseButton: false },
  render: (args) => ({
    props: args,
    template: `
      <rec-toast [variant]="variant" [title]="title" [withCloseButton]="withCloseButton">
        This notification has no dismiss affordance.
      </rec-toast>
    `,
  }),
};

/**
 * `icon`: a `TemplateRef` rendered via `*ngTemplateOutlet` — same slot
 * convention as `Button`/`Chip`/`Link`'s own `icon` inputs. Same
 * warning-triangle SVG shape as `AssistiveElement`'s `error` variant icon,
 * for a direct visual comparison.
 */
const warningIconTemplate = `
  <ng-template #warningIcon>
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  </ng-template>
`;

export const WithIcon: Story = {
  args: { variant: "error", title: "Action Required" },
  render: (args) => ({
    props: args,
    template: `
      ${warningIconTemplate}
      <rec-toast [variant]="variant" [title]="title" [withCloseButton]="withCloseButton" [icon]="warningIcon">
        You must complete your profile setup before accessing this feature.
      </rec-toast>
    `,
  }),
};

export const NoTitle: Story = {
  args: { title: undefined },
  render: (args) => ({
    props: args,
    template: `
      <rec-toast [variant]="variant" [withCloseButton]="withCloseButton">
        A message with no title, just a description.
      </rec-toast>
    `,
  }),
};
