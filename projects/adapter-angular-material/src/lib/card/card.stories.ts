import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { CardComponent } from "./card.component";
import { CardHeaderComponent } from "./card-header.component";
import { CardFooterComponent } from "./card-footer.component";
import { CardContentComponent } from "./card-content.component";
import { CardSectionComponent } from "./card-section.component";
import { ButtonComponent } from "../button/button.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention.
 */
const meta: Meta<CardComponent> = {
  title: "UI-Kit/Card",
  component: CardComponent,
  decorators: [
    moduleMetadata({
      imports: [
        CardComponent,
        CardHeaderComponent,
        CardFooterComponent,
        CardContentComponent,
        CardSectionComponent,
        ButtonComponent,
      ],
    }),
  ],
};
export default meta;

type Story = StoryObj<CardComponent>;

export const Default: Story = {
  render: () => ({
    template: `
      <div style="max-width: 400px;">
        <rec-card>
          <rec-card-content>
            A minimal card with just content, no header or footer.
          </rec-card-content>
        </rec-card>
      </div>
    `,
  }),
};

export const WithHeaderAndFooter: Story = {
  render: () => ({
    template: `
      <div style="max-width: 400px;">
        <rec-card>
          <rec-card-header>Card title</rec-card-header>
          <rec-card-content>
            This card has a header and footer, both bleeding edge-to-edge
            to the card's own border.
          </rec-card-content>
          <rec-card-footer>
            <rec-button variant="text" size="small">Cancel</rec-button>
            <rec-button variant="solid" size="small">Confirm</rec-button>
          </rec-card-footer>
        </rec-card>
      </div>
    `,
  }),
};

export const WithSection: Story = {
  render: () => ({
    template: `
      <div style="max-width: 400px;">
        <rec-card>
          <rec-card-section>
            <img src="https://picsum.photos/400/160" alt="" style="display: block; width: 100%; height: 160px; object-fit: cover;" />
          </rec-card-section>
          <rec-card-content>
            <strong>Photo card</strong>
            An edge-to-edge image section above the card's own padded content.
          </rec-card-content>
        </rec-card>
      </div>
    `,
  }),
};

/**
 * `overStyled` escape hatch: `overClass`/`overStyle` are only forwarded
 * onto this component's own root `<mat-card>` when `overStyled` is `true`
 * — see `docs/STYLING_SYSTEM.md` §6.
 */
export const OverStyledEscapeHatch: Story = {
  render: () => ({
    template: `
      <div style="max-width: 400px;">
        <rec-card [overStyled]="true" [overStyle]="{ 'background-color': '#2962ff33', 'border-color': '#2962ff' }">
          <rec-card-content>Over-styled card.</rec-card-content>
        </rec-card>
      </div>
    `,
  }),
};
