import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { TabsComponent } from "./tabs.component";
import { TabsListComponent } from "./tabs-list.component";
import { TabComponent } from "./tabs-tab.component";
import { TabPanelComponent } from "./tabs-panel.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention, mirroring the
 * source-of-truth `Tabs.stories.tsx`'s own story names
 * (Default/Outline/Pills/Vertical/Inverted) and its Gallery/Messages/
 * Settings example content.
 */
const meta: Meta<TabsComponent> = {
  title: "UI-Kit/Tabs",
  component: TabsComponent,
  decorators: [
    moduleMetadata({
      imports: [
        TabsComponent,
        TabsListComponent,
        TabComponent,
        TabPanelComponent,
      ],
    }),
  ],
  argTypes: {
    variant: {
      control: "radio",
      options: ["default", "outline", "pills"],
    },
    orientation: {
      control: "radio",
      options: ["horizontal", "vertical"],
    },
    inverted: {
      control: "boolean",
    },
  },
};
export default meta;

type Story = StoryObj<TabsComponent>;

/*
 * SVGs are inlined directly as literal template markup, not bound via
 * `[innerHTML]` from a string — Angular's default `DomSanitizer` strips
 * `<svg>` content out of `[innerHTML]` bindings entirely (not in its
 * innerHTML safe-list), which was confirmed live here: the icon slot
 * rendered as an empty `<span>` until switched to this approach.
 */
const template = `
  <div style="width: 600px;">
    <rec-tabs [variant]="variant" [orientation]="orientation" [inverted]="inverted" defaultValue="gallery">
      <rec-tabs-list>
        <rec-tabs-tab value="gallery" [leftSection]="galleryTpl">Gallery</rec-tabs-tab>
        <rec-tabs-tab value="messages" [leftSection]="messagesTpl">Messages</rec-tabs-tab>
        <rec-tabs-tab value="settings" [leftSection]="settingsTpl" disabled>Settings</rec-tabs-tab>
      </rec-tabs-list>

      <ng-template #galleryTpl>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
      </ng-template>
      <ng-template #messagesTpl>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
      </ng-template>
      <ng-template #settingsTpl>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
      </ng-template>

      <rec-tabs-panel value="gallery">Gallery tab content</rec-tabs-panel>
      <rec-tabs-panel value="messages">Messages tab content</rec-tabs-panel>
      <rec-tabs-panel value="settings">Settings tab content</rec-tabs-panel>
    </rec-tabs>
  </div>
`;

export const Default: Story = {
  render: (args) => ({
    props: { ...args },
    template,
  }),
  args: {
    variant: "default",
    orientation: "horizontal",
    inverted: false,
  },
};

export const Outline: Story = {
  render: (args) => ({
    props: { ...args },
    template,
  }),
  args: {
    variant: "outline",
    orientation: "horizontal",
    inverted: false,
  },
};

export const Pills: Story = {
  render: (args) => ({
    props: { ...args },
    template,
  }),
  args: {
    variant: "pills",
    orientation: "horizontal",
    inverted: false,
  },
};

export const Vertical: Story = {
  render: (args) => ({
    props: { ...args },
    template,
  }),
  args: {
    variant: "default",
    orientation: "vertical",
    inverted: false,
  },
};

export const Inverted: Story = {
  render: (args) => ({
    props: { ...args },
    template,
  }),
  args: {
    variant: "default",
    orientation: "horizontal",
    inverted: true,
  },
};

/**
 * `overStyled` escape hatch on the root — `overClass`/`overStyle` are only
 * forwarded onto `.root` when `overStyled` is `true`, see
 * `docs/STYLING_SYSTEM.md` §6.
 */
export const OverStyledEscapeHatch: Story = {
  render: () => ({
    template: `
      <div style="width: 600px;">
        <rec-tabs defaultValue="one" [overStyled]="true" [overStyle]="{ 'border-bottom': '2px solid #2962ff' }">
          <rec-tabs-list>
            <rec-tabs-tab value="one">One</rec-tabs-tab>
            <rec-tabs-tab value="two">Two</rec-tabs-tab>
          </rec-tabs-list>
          <rec-tabs-panel value="one">First panel.</rec-tabs-panel>
          <rec-tabs-panel value="two">Second panel.</rec-tabs-panel>
        </rec-tabs>
      </div>
    `,
  }),
};
