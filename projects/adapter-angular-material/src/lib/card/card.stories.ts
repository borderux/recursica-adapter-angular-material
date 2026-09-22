import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { CardComponent } from "./card.component";
import { CardHeaderComponent } from "./card-header.component";
import { CardFooterComponent } from "./card-footer.component";
import { CardContentComponent } from "./card-content.component";
import { CardSectionComponent } from "./card-section.component";
import { ButtonComponent } from "../button/button.component";
import { LayerComponent } from "../layer/layer.component";
import { TextComponent } from "../text/text.component";

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
        LayerComponent,
        TextComponent,
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
          <rec-card-header>Customer Activity Report</rec-card-header>
          <rec-card-content>
            Card inner section content body. Notice how this acts as padded
            content natively based on the overarching properties.
            Recursica's vertical gutter governs vertical spacing between
            siblings in the flex container.
            <br /><br />
            Another section showing the vertical gutter spacing.
          </rec-card-content>
          <rec-card-footer style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <span>Generated today</span>
            <rec-button variant="solid">View Details</rec-button>
          </rec-card-footer>
        </rec-card>
      </div>
    `,
  }),
};

export const HeaderlessAndFooterless: Story = {
  render: () => ({
    template: `
      <div style="max-width: 400px;">
        <rec-card>
          <rec-card-content>
            <strong>Notice</strong>
            This is a completely generic card payload dropping the Header
            and Footer specific elements, simply acting as a padded
            elevation boundary box directly mirroring native composability!
            <rec-button variant="solid">Acknowledge</rec-button>
          </rec-card-content>
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

/** Mirrors the reference's own `LayerDemonstration` — two cards side by side at layer 1/layer 2. */
export const LayerDemonstration: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 32px; background-color: #e9ecef; padding: 32px;">
        <rec-layer [layer]="1">
          <rec-card>
            <rec-card-header>Layer 1 Wrapper</rec-card-header>
            <rec-card-content>
              <rec-text>Content inside layer 1 card.</rec-text>
            </rec-card-content>
          </rec-card>
        </rec-layer>

        <rec-layer [layer]="2">
          <rec-card>
            <rec-card-header>Layer 2 Wrapper</rec-card-header>
            <rec-card-content>
              <rec-text>Content inside layer 2 card exposing a higher elevation drop shadow inherently cascaded.</rec-text>
            </rec-card-content>
          </rec-card>
        </rec-layer>
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
