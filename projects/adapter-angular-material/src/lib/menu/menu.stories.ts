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
      <div style="padding: 64px;">
        <rec-button variant="solid" [recMenuTriggerFor]="menu">Open menu</rec-button>
        <rec-menu #menu [xPosition]="xPosition" [yPosition]="yPosition">
          <rec-menu-item>Profile</rec-menu-item>
          <rec-menu-item>Settings</rec-menu-item>
          <rec-menu-divider />
          <rec-menu-item disabled>Disabled action</rec-menu-item>
          <rec-menu-item>Log out</rec-menu-item>
        </rec-menu>
      </div>
    `,
  }),
};

export const WithLabelAndSelection: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="padding: 64px;">
        <rec-button variant="solid" [recMenuTriggerFor]="menu">Open menu</rec-button>
        <rec-menu #menu [xPosition]="xPosition" [yPosition]="yPosition">
          <rec-menu-label>Sort by</rec-menu-label>
          <rec-menu-item [selected]="true">Name</rec-menu-item>
          <rec-menu-item>Date modified</rec-menu-item>
          <rec-menu-item>Size</rec-menu-item>
        </rec-menu>
      </div>
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

export const WithIcons: Story = {
  render: (args) => ({
    props: args,
    template: `
      ${searchIconTemplate}
      <div style="padding: 64px;">
        <rec-button variant="solid" [recMenuTriggerFor]="menu">Open menu</rec-button>
        <rec-menu #menu [xPosition]="xPosition" [yPosition]="yPosition">
          <rec-menu-item [leftSection]="searchIcon">Search</rec-menu-item>
          <rec-menu-item [leftSection]="searchIcon">Find replace</rec-menu-item>
        </rec-menu>
      </div>
    `,
  }),
};

/**
 * `overStyled` escape hatch: `overClass` is only forwarded onto the real
 * dropdown panel (via `MatMenu`'s `panelClass`) when `overStyled` is
 * `true` — see `menu.component.ts`'s class doc comment for why there's no
 * `overStyle` counterpart, same reasoning as `Tooltip`.
 *
 * The override rule is injected straight into `document.head` via plain
 * DOM APIs, not written as a `<style>` tag in this story's own template —
 * see `tooltip.stories.ts`'s identical demo plumbing for why a template
 * `<style>` tag silently fails here (Angular's `ViewEncapsulation.Emulated`
 * scopes it, and the overlay-rendered panel never carries that scoping
 * attribute).
 */
if (
  typeof document !== "undefined" &&
  !document.getElementById("rec-menu-overstyled-demo-style")
) {
  const style = document.createElement("style");
  style.id = "rec-menu-overstyled-demo-style";
  style.textContent = `
    .mat-mdc-menu-panel.rec-menu-overstyled-demo {
      background-color: #2962ff !important;
    }
    .mat-mdc-menu-panel.rec-menu-overstyled-demo .mat-mdc-menu-item {
      color: white !important;
    }
  `;
  document.head.appendChild(style);
}

export const OverStyledEscapeHatch: Story = {
  args: {
    overStyled: true,
    overClass: "rec-menu-overstyled-demo",
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="padding: 64px;">
        <rec-button variant="solid" [recMenuTriggerFor]="menu">Open menu</rec-button>
        <rec-menu #menu [overStyled]="overStyled" [overClass]="overClass">
          <rec-menu-item>Profile</rec-menu-item>
          <rec-menu-item>Settings</rec-menu-item>
        </rec-menu>
      </div>
    `,
  }),
};
