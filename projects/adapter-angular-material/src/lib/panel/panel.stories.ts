import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { PanelComponent } from "./panel.component";
import { PanelFooterComponent } from "./panel-footer.component";
import { ButtonComponent } from "../button/button.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * reference's own `Panel.stories.tsx`. Each story starts `opened`, matching
 * `modal.stories.ts`'s own "starts opened so it's visible without pressing
 * a button first" convention — `opened`/`(openedChange)` reassigned inline
 * in the template, the same controlled-value convention used throughout
 * this adapter's stories.
 */
const meta: Meta<PanelComponent> = {
  title: "UI-Kit/Panel",
  component: PanelComponent,
  decorators: [
    moduleMetadata({
      imports: [PanelComponent, PanelFooterComponent, ButtonComponent],
    }),
  ],
};
export default meta;

type Story = StoryObj<PanelComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <rec-panel title="Panel Title" placement="right" [opened]="opened" (openedChange)="opened = $event">
        This is the panel body content area. Panels slide in from the edge of the screen to reveal supplementary information, navigation options, or toolsets.
        <rec-panel-footer>
          <rec-button variant="outline" (click)="opened = false">Cancel</rec-button>
          <rec-button variant="solid" (click)="opened = false">Save</rec-button>
        </rec-panel-footer>
      </rec-panel>
      <rec-button variant="solid" (click)="opened = true">Open Panel</rec-button>
    `,
    props: { opened: true },
  }),
};

export const LeftPlacement: Story = {
  render: () => ({
    template: `
      <rec-panel title="Navigation" placement="left" [opened]="opened" (openedChange)="opened = $event">
        A panel sliding in from the left, commonly used for navigation menus or sidebars.
      </rec-panel>
      <rec-button variant="outline" (click)="opened = true">Open Left Panel</rec-button>
    `,
    props: { opened: true },
  }),
};

const scrollingParagraphs = Array.from(
  { length: 20 },
  (_, i) =>
    `<p>Paragraph ${i + 1}: This is sample content to demonstrate the scrollable behavior of the panel when content exceeds the viewport height.</p>`,
).join("\n");

export const ScrollableContent: Story = {
  render: () => ({
    template: `
      <rec-panel title="Scrollable Panel" placement="right" [opened]="opened" (openedChange)="opened = $event">
        ${scrollingParagraphs}
        <rec-panel-footer>
          <rec-button variant="outline" (click)="opened = false">Close</rec-button>
          <rec-button variant="solid" (click)="opened = false">Apply</rec-button>
        </rec-panel-footer>
      </rec-panel>
      <rec-button variant="solid" (click)="opened = true">Open Scrollable Panel</rec-button>
    `,
    props: { opened: true },
  }),
};

export const LongTitle: Story = {
  render: () => ({
    template: `
      <rec-panel
        title="This is a ridiculously long panel title designed to test how the header CSS handles text overflow and whether it truncates correctly or breaks the layout"
        placement="right"
        [opened]="opened"
        (openedChange)="opened = $event"
      >
        Check the header to see if the long title is handled gracefully without pushing the close button off screen.
      </rec-panel>
      <rec-button variant="solid" (click)="opened = true">Open Long Title Panel</rec-button>
    `,
    props: { opened: true },
  }),
};
