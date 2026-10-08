import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { BreadcrumbComponent } from "./breadcrumb.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * genesis adapter's own `Breadcrumb.stories.tsx` /
 * `test/golden/ui-kit-breadcrumb--*.png`.
 *
 * `LastItemAsLink` isn't mirrored — see `breadcrumb.component.ts`'s class
 * doc comment: this component's declarative `items` API makes the last
 * crumb non-interactive by construction, so there's no way to reproduce
 * "a caller-supplied link slips through as the current page" through the
 * public API at all, unlike the reference's own runtime safety net.
 */
const meta: Meta<BreadcrumbComponent> = {
  title: "UI-Kit/Breadcrumb",
  component: BreadcrumbComponent,
  decorators: [
    moduleMetadata({
      imports: [BreadcrumbComponent],
    }),
  ],
  argTypes: {
    separator: { control: "text" },
  },
};
export default meta;

type Story = StoryObj<BreadcrumbComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <rec-breadcrumb
        [items]="[
          { label: 'Dashboard', href: '#' },
          { label: 'Settings', href: '#' },
          { label: 'Security' }
        ]"
      ></rec-breadcrumb>
    `,
  }),
};

export const CustomSeparator: Story = {
  render: () => ({
    template: `
      <rec-breadcrumb
        separator="→"
        [items]="[
          { label: 'Root', href: '#' },
          { label: 'Branch', href: '#' },
          { label: 'Leaf' }
        ]"
      ></rec-breadcrumb>
    `,
  }),
};

/** Passthrough check: aria and id land on the inner `nav`, not on `rec-breadcrumb`. */
export const Accessibility: Story = {
  render: () => ({
    template: `
      <rec-breadcrumb
        aria-label="A11Y-LABEL"
        aria-describedby="a11y-desc"
        id="a11y-id"
        [items]="[{ label: 'Home', href: '#' }, { label: 'Current' }]"
      ></rec-breadcrumb>
      <span id="a11y-desc" hidden>Description</span>
    `,
  }),
};
