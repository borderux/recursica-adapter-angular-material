import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { AccordionComponent } from "./accordion.component";
import { AccordionItemComponent } from "./accordion-item.component";
import { AccordionControlComponent } from "./accordion-control.component";
import { AccordionPanelComponent } from "./accordion-panel.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention, mirroring the
 * source-of-truth `Accordion.stories.tsx`'s own story names exactly
 * (Default/WithIcons/LongTitleTruncation/Disabled).
 *
 * No `Multiple` demo story (has no equivalent on the source-of-truth side)
 * and no `OverStyledEscapeHatch` demo story — both removed as unwanted story
 * clutter (per the task brief for this component).
 */
const meta: Meta<AccordionComponent> = {
  title: "UI-Kit/Accordion",
  component: AccordionComponent,
  decorators: [
    moduleMetadata({
      imports: [
        AccordionComponent,
        AccordionItemComponent,
        AccordionControlComponent,
        AccordionPanelComponent,
      ],
    }),
  ],
};
export default meta;

type Story = StoryObj<AccordionComponent>;

/*
 * SVGs are inlined directly as literal template markup, not bound via
 * `[innerHTML]` — Angular's default `DomSanitizer` strips `<svg>` content
 * out of `[innerHTML]` bindings entirely, confirmed live by `Tabs`' own
 * stories (see tabs.stories.ts's identical header comment).
 */

export const Default: Story = {
  render: () => ({
    template: `
      <rec-accordion defaultValue="item-1" style="width: 480px;">
        <rec-accordion-item value="item-1">
          <rec-accordion-control>Billing and Membership</rec-accordion-control>
          <rec-accordion-panel>
            You can manage your billing directly from the dashboard tab. All
            payments are processed automatically.
          </rec-accordion-panel>
        </rec-accordion-item>

        <rec-accordion-item value="item-2">
          <rec-accordion-control>Refund Policy</rec-accordion-control>
          <rec-accordion-panel>
            We offer a 30-day money-back guarantee for all new subscriptions.
          </rec-accordion-panel>
        </rec-accordion-item>

        <rec-accordion-item value="item-3">
          <rec-accordion-control>Technical Support</rec-accordion-control>
          <rec-accordion-panel>
            Our support team is available 24/7 via live chat or email.
          </rec-accordion-panel>
        </rec-accordion-item>
      </rec-accordion>
    `,
  }),
};

export const WithIcons: Story = {
  render: () => ({
    template: `
      <rec-accordion defaultValue="security" style="width: 480px;">
        <rec-accordion-item value="security">
          <rec-accordion-control [leftIcon]="iconTpl">
            Security Settings
          </rec-accordion-control>
          <rec-accordion-panel>
            Enable two-factor authentication (2FA) and monitor active sessions
            below.
          </rec-accordion-panel>
        </rec-accordion-item>

        <rec-accordion-item value="privacy">
          <rec-accordion-control [leftIcon]="iconTpl">
            Privacy Configuration
          </rec-accordion-control>
          <rec-accordion-panel>
            Choose what data is shared with our analytics partners.
          </rec-accordion-panel>
        </rec-accordion-item>
      </rec-accordion>

      <ng-template #iconTpl>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
      </ng-template>
    `,
  }),
};

export const LongTitleTruncation: Story = {
  render: () => ({
    template: `
      <div style="max-width: 320px;">
        <rec-accordion defaultValue="long-title">
          <rec-accordion-item value="long-title">
            <rec-accordion-control [leftIcon]="iconTpl">
              This is a deliberately very long accordion item title used to
              verify that overflowing text truncates with a CSS ellipsis
              instead of wrapping or overflowing the header
            </rec-accordion-control>
            <rec-accordion-panel>
              The header label above should truncate to a single line with a
              trailing ellipsis (…) rather than wrapping onto multiple lines
              or pushing the chevron out of view.
            </rec-accordion-panel>
          </rec-accordion-item>

          <rec-accordion-item value="short-title">
            <rec-accordion-control [leftIcon]="iconTpl">
              Short Title
            </rec-accordion-control>
            <rec-accordion-panel>
              A short title in the same accordion for visual comparison.
            </rec-accordion-panel>
          </rec-accordion-item>
        </rec-accordion>
      </div>

      <ng-template #iconTpl>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
      </ng-template>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    template: `
      <rec-accordion defaultValue="expanded-disabled" style="width: 480px;">
        <rec-accordion-item value="expanded-disabled" [disabled]="true">
          <rec-accordion-control [leftIcon]="iconTpl">Expanded and Disabled</rec-accordion-control>
          <rec-accordion-panel>
            This item starts expanded so the panel content's dimming can be
            verified alongside the control's, not just the collapsed header.
          </rec-accordion-panel>
        </rec-accordion-item>

        <rec-accordion-item value="collapsed-disabled" [disabled]="true">
          <rec-accordion-control [leftIcon]="iconTpl">Collapsed and Disabled</rec-accordion-control>
          <rec-accordion-panel>
            Clicking or tabbing to this control should have no effect.
          </rec-accordion-panel>
        </rec-accordion-item>

        <rec-accordion-item value="enabled">
          <rec-accordion-control [leftIcon]="iconTpl">Enabled, for Comparison</rec-accordion-control>
          <rec-accordion-panel>
            A normal, interactive item alongside the disabled ones above.
          </rec-accordion-panel>
        </rec-accordion-item>
      </rec-accordion>

      <ng-template #iconTpl>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
      </ng-template>
    `,
  }),
};
