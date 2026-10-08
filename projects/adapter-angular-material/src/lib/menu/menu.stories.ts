import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { MenuComponent } from "./menu.component";
import { MenuItemComponent } from "./menu-item.component";
import { MenuDividerComponent } from "./menu-divider.component";
import { MenuLabelComponent } from "./menu-label.component";
import { MenuTriggerForDirective } from "./menu-trigger-for.directive";
import { ButtonComponent } from "../button/button.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention.
 */
const meta: Meta<MenuComponent> = {
  title: "UI-Kit/Menu",
  component: MenuComponent,
  decorators: [
    moduleMetadata({
      imports: [
        MenuComponent,
        MenuItemComponent,
        MenuDividerComponent,
        MenuLabelComponent,
        MenuTriggerForDirective,
        ButtonComponent,
      ],
    }),
  ],
  argTypes: {
    xPosition: { control: "radio", options: ["before", "after"] },
    yPosition: { control: "radio", options: ["above", "below"] },
  },
  args: {
    xPosition: "after",
    yPosition: "below",
  },
};
export default meta;

type Story = StoryObj<MenuComponent>;

export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `
      ${menuIconsTemplate}${searchIconTemplate}
        <rec-button variant="solid" [recMenuTriggerFor]="menu" [recMenuInitiallyOpen]="true">Toggle Menu</rec-button>
        <rec-menu #menu [xPosition]="xPosition" [yPosition]="yPosition">
          <rec-menu-label>Application</rec-menu-label>
          <rec-menu-item [leftSection]="settingsIcon">Settings</rec-menu-item>
          <rec-menu-item [leftSection]="messageIcon">Messages</rec-menu-item>
          <rec-menu-item [leftSection]="imageIcon">Gallery</rec-menu-item>
          <rec-menu-item [leftSection]="searchIcon">Search</rec-menu-item>
          <rec-menu-divider />
          <rec-menu-label>Danger zone</rec-menu-label>
          <rec-menu-item [leftSection]="arrowsIcon">Transfer my data</rec-menu-item>
          <rec-menu-item [leftSection]="trashIcon">Delete my account</rec-menu-item>
        </rec-menu>
    `,
  }),
};

export const WithLabelAndSelection: Story = {
  render: (args) => ({
    props: args,
    template: `
        <rec-button variant="solid" [recMenuTriggerFor]="menu">Open menu</rec-button>
        <rec-menu #menu [xPosition]="xPosition" [yPosition]="yPosition">
          <rec-menu-label>Sort by</rec-menu-label>
          <rec-menu-item [selected]="true">Name</rec-menu-item>
          <rec-menu-item>Date modified</rec-menu-item>
          <rec-menu-item>Size</rec-menu-item>
        </rec-menu>
    `,
  }),
};

/**
 * Mirrors the reference's own `WithDisabledItems` — `rec-menu-item` already
 * supports `disabled` (confirmed in `menu-item.component.ts`), so this only
 * needed a new story, not a component change.
 */
export const WithDisabledItems: Story = {
  render: (args) => ({
    props: args,
    template: `
      ${menuIconsTemplate}${searchIconTemplate}
        <rec-button variant="solid" [recMenuTriggerFor]="menu" [recMenuInitiallyOpen]="true">Menu with Disabled</rec-button>
        <rec-menu #menu [xPosition]="xPosition" [yPosition]="yPosition">
          <rec-menu-item [leftSection]="settingsIcon">Settings</rec-menu-item>
          <rec-menu-item [leftSection]="searchIcon" [disabled]="true">Search (disabled)</rec-menu-item>
          <rec-menu-item [leftSection]="messageIcon">Messages</rec-menu-item>
          <rec-menu-item [leftSection]="trashIcon" [disabled]="true">Delete (disabled)</rec-menu-item>
        </rec-menu>
    `,
  }),
};

/**
 * Mirrors the reference's own `WithSubmenus` — `[subMenu]` on `rec-menu-item`
 * wires `MatMenuTrigger` directly onto that item's own `<button
 * mat-menu-item>`, so `MatMenuItem`'s native submenu detection (chevron,
 * hover-open, keyboard nesting) activates with no extra state or directives —
 * see `menu-item.component.ts`'s class doc comment for why this needed a
 * `subMenu` input rather than reusing `[recMenuTriggerFor]`.
 */
export const WithSubmenus: Story = {
  render: (args) => ({
    props: args,
    template: `
        <rec-button variant="solid" [recMenuTriggerFor]="menu" [recMenuInitiallyOpen]="true">Menu with Submenus</rec-button>
        <rec-menu #menu [xPosition]="xPosition" [yPosition]="yPosition">
          <rec-menu-item>Dashboard</rec-menu-item>
          <rec-menu-item [subMenu]="productsMenu">Products</rec-menu-item>
          <rec-menu-item [subMenu]="ordersMenu">Orders</rec-menu-item>
        </rec-menu>
        <rec-menu #productsMenu>
          <rec-menu-item>All products</rec-menu-item>
          <rec-menu-item>Categories</rec-menu-item>
          <rec-menu-item>Tags</rec-menu-item>
        </rec-menu>
        <rec-menu #ordersMenu>
          <rec-menu-item>Open</rec-menu-item>
          <rec-menu-item>Completed</rec-menu-item>
          <rec-menu-item>Cancelled</rec-menu-item>
        </rec-menu>
    `,
  }),
};

const searchIconTemplate = `
  <ng-template #searchIcon>
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  </ng-template>
`;

/** Icon templates matching the reference story's 14px stroke icons (settings/message/gallery/trash/transfer). */
const menuIconsTemplate = `
  <ng-template #settingsIcon>
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  </ng-template>
  <ng-template #messageIcon>
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  </ng-template>
  <ng-template #imageIcon>
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>
    </svg>
  </ng-template>
  <ng-template #trashIcon>
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  </ng-template>
  <ng-template #arrowsIcon>
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
    </svg>
  </ng-template>
`;

export const WithIcons: Story = {
  render: (args) => ({
    props: args,
    template: `
      ${searchIconTemplate}
        <rec-button variant="solid" [recMenuTriggerFor]="menu">Open menu</rec-button>
        <rec-menu #menu [xPosition]="xPosition" [yPosition]="yPosition">
          <rec-menu-item [leftSection]="searchIcon">Search</rec-menu-item>
          <rec-menu-item [leftSection]="searchIcon">Find replace</rec-menu-item>
        </rec-menu>
    `,
  }),
};

/** Passthrough check: aria lands on the open `role=menu` panel; item aria on the item button; label id on its inner div. */
export const Accessibility: Story = {
  render: () => ({
    template: `
      <rec-button id="a11y-trigger" variant="solid" [recMenuTriggerFor]="menu" [recMenuInitiallyOpen]="true">Toggle Menu</rec-button>
      <rec-menu #menu aria-label="A11Y-LABEL" aria-describedby="a11y-desc">
        <rec-menu-label id="a11y-id-label">Application</rec-menu-label>
        <rec-menu-item aria-label="A11Y-LABEL-ITEM" aria-describedby="a11y-desc-item" title="A11Y-TITLE-ITEM">Settings</rec-menu-item>
      </rec-menu>
      <span id="a11y-desc" hidden>Description</span>
      <span id="a11y-desc-item" hidden>Item description</span>
    `,
  }),
};

export const WithMaxHeight: Story = {
  render: () => ({
    template: `
        <rec-button variant="solid" [recMenuTriggerFor]="menu" [recMenuInitiallyOpen]="true">Scrolling menu (150px)</rec-button>
        <rec-menu #menu maxHeight="150px">
          <rec-menu-item>Item 1</rec-menu-item>
          <rec-menu-item>Item 2</rec-menu-item>
          <rec-menu-item>Item 3</rec-menu-item>
          <rec-menu-item>Item 4</rec-menu-item>
          <rec-menu-item>Item 5</rec-menu-item>
          <rec-menu-item>Item 6</rec-menu-item>
          <rec-menu-item>Item 7</rec-menu-item>
          <rec-menu-item>Item 8</rec-menu-item>
        </rec-menu>
    `,
  }),
};
