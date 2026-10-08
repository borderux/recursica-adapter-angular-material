import { Component, ViewEncapsulation } from "@angular/core";
import { ContainerComponent } from "../../lib/container/container.component";
import { GroupComponent } from "../../lib/group/group.component";
import { HeadingComponent } from "../../lib/heading/heading.component";
import { LinkComponent } from "../../lib/link/link.component";
import { StackComponent } from "../../lib/stack/stack.component";
import { TextComponent } from "../../lib/text/text.component";

const DOCS_URL = "https://recursica.com";
const FORGE_URL = "https://forge.recursica.com";

/**
 * Welcome page. Ported from the Mantine adapter's `Introduction.stories.tsx`
 * (`Welcome`), with Angular Material copy and install command.
 */
@Component({
  selector: "storybook-demo-introduction",
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    ContainerComponent,
    GroupComponent,
    HeadingComponent,
    LinkComponent,
    StackComponent,
    TextComponent,
  ],
  template: `
    <rec-container size="md">
      <rec-stack gap="rec-xl">
        <rec-group gap="rec-md" align="flex-start" wrap="nowrap">
          <svg
            width="80"
            height="80"
            viewBox="0 0 250 250"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              fill="#DD0031"
              d="m125 30-93.4 33.3 14.2 123.4L125 230l79.2-43.3 14.2-123.4z"
            />
            <path
              fill="#C3002F"
              d="M125 30v22.2-.1V230l79.2-43.3 14.2-123.4z"
            />
            <path
              fill="#FFF"
              d="M125 52.1 66.8 182.6h21.7l11.7-29.2h49.4l11.7 29.2h21.7zm17 83.3h-34l17-40.9z"
            />
          </svg>
          <rec-stack gap="rec-sm">
            <rec-heading [order]="1">
              Recursica Design System (Angular Material Adapter)
            </rec-heading>
            <rec-link
              href="https://material.angular.dev"
              target="_blank"
              rel="noreferrer"
            >
              material.angular.dev
            </rec-link>
          </rec-stack>
        </rec-group>
        <rec-text>
          This Storybook showcases the Recursica design system implemented for
          <strong>Angular Material</strong>. It provides reusable Angular
          components that map our design tokens to Angular Material's component
          layer.
        </rec-text>

        <rec-stack gap="rec-md">
          <rec-heading [order]="2">Looking for another UI Kit?</rec-heading>
          <rec-text>
            Are you using a different UI Kit (like Mantine or Material UI)?
            Recursica provides multiple adapters for different frameworks.
          </rec-text>
          <rec-link
            href="./?path=/story/introduction--adapters"
            target="_parent"
          >
            View Supported Adapters
          </rec-link>
        </rec-stack>

        <rec-stack gap="rec-md">
          <rec-heading [order]="2">Installation</rec-heading>
          <rec-text>
            To install the Angular Material adapter in your project, run:
          </rec-text>
          <code class="storybook-demo-introduction-code">
            npm install &#64;recursica/adapter-angular-material
            &#64;angular/material &#64;angular/cdk
          </code>
        </rec-stack>

        <rec-stack gap="rec-md">
          <rec-heading [order]="2">Tokens</rec-heading>
          <rec-text>
            Raw design tokens (colors, sizes, font weights, opacities, etc.)
            that feed the theme and components. These are the primitive values
            defined in your token set and exposed as CSS custom properties.
          </rec-text>
        </rec-stack>

        <rec-stack gap="rec-md">
          <rec-heading [order]="2">Theme</rec-heading>
          <rec-text>
            Brand and theme layer built on top of tokens. Typography types,
            dimensions, and layout grids are defined here. Theme uses the tokens
            and exposes both CSS variables and helper classes (e.g. typography
            classes) for consistent styling across the product.
          </rec-text>
        </rec-stack>

        <rec-stack gap="rec-md">
          <rec-heading [order]="2">Configuring Recursica</rec-heading>
          <rec-text>
            To modify the Recursica configuration (tokens, brand, theme), go to
            <rec-link
              [href]="forgeUrl"
              target="_blank"
              rel="noopener noreferrer"
              >{{ forgeUrl }}</rec-link
            >. Changes there drive the tokens and theme you see in this
            Storybook.
          </rec-text>
        </rec-stack>

        <rec-stack gap="rec-md">
          <rec-heading [order]="2">Documentation</rec-heading>
          <rec-text>
            For full documentation, guides, and API reference, visit
            <rec-link
              [href]="docsUrl"
              target="_blank"
              rel="noopener noreferrer"
              >{{ docsUrl }}</rec-link
            >.
          </rec-text>
        </rec-stack>
      </rec-stack>
    </rec-container>
  `,
  styles: [
    `
      .storybook-demo-introduction-code {
        display: block;
        padding: 12px;
        background-color: #f5f5f5;
        border-radius: 6px;
        font-size: 13px;
      }
    `,
  ],
})
export class IntroductionDemoComponent {
  readonly docsUrl = DOCS_URL;
  readonly forgeUrl = FORGE_URL;
}
