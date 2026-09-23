import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { CardComponent } from "./card.component";
import { CardHeaderComponent } from "./card-header.component";
import { CardFooterComponent } from "./card-footer.component";
import { CardContentComponent } from "./card-content.component";
import { ButtonComponent } from "../button/button.component";
import { LayerComponent } from "../layer/layer.component";
import { TextComponent } from "../text/text.component";
import { GroupComponent } from "../group/group.component";

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
        ButtonComponent,
        LayerComponent,
        TextComponent,
        GroupComponent,
      ],
    }),
  ],
};
export default meta;

type Story = StoryObj<CardComponent>;

export const Default: Story = {
  render: () => ({
    template: `
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
          <rec-card-footer>
            <rec-group justify="space-between" align="center" style="width: 100%;">
              <rec-text>Generated today</rec-text>
              <rec-button variant="solid">View Details</rec-button>
            </rec-group>
          </rec-card-footer>
        </rec-card>
    `,
  }),
};

export const HeaderlessAndFooterless: Story = {
  render: () => ({
    template: `
        <rec-card>
          <rec-card-content>
            <rec-text variant="subtitle">Notice</rec-text>
            This is a completely generic card payload dropping the Header
            and Footer specific elements, simply acting as a padded
            elevation boundary box directly mirroring native composability!
            <rec-button variant="solid">Acknowledge</rec-button>
          </rec-card-content>
        </rec-card>
    `,
  }),
};
