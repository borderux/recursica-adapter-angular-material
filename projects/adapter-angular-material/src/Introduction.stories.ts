import type { Meta, StoryObj } from "@storybook/angular";
import pkg from "../package.json";

// Ported from recursica-adapter-mantine-v8's src/Introduction.stories.tsx.
// No real Recursica components (Container/Stack/Heading/Text/Link/Button) exist
// in this adapter yet -- see docs/CREATING_AN_ADAPTER.md step 9 -- so these
// stories render plain HTML/CSS via @storybook/angular's inline `template`
// instead of a real `@Component`. Once this adapter's own components exist,
// consider rebuilding these using them, the way the genesis adapter does.

const DOCS_URL = "https://recursica.com";
const FORGE_URL = "https://forge.recursica.com";

const sharedStyles = `
  .rec-intro { padding: 32px 0; max-width: 640px; font-family: sans-serif; }
  .rec-intro h1 { font-size: 28px; margin: 0 0 4px; }
  .rec-intro h2 { font-size: 20px; margin: 0 0 12px; }
  .rec-intro p { line-height: 1.5; margin: 0 0 16px; }
  .rec-intro section { margin-bottom: 32px; }
  .rec-intro a { color: #1971c2; }
  .rec-intro code { display: block; padding: 12px; background: #f5f5f5; border-radius: 6px; font-size: 13px; }
  .rec-intro__btn { display: inline-block; padding: 8px 16px; border-radius: 6px; background: #1971c2; color: #fff; text-decoration: none; font-size: 14px; }
`;

const meta = {
  title: "Introduction",
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Welcome: Story = {
  render: () => ({
    styles: [sharedStyles],
    template: `
      <div class="rec-intro">
        <h1>Recursica Design System (Angular Material Adapter)</h1>
        <p><a href="https://material.angular.dev" target="_blank" rel="noreferrer">material.angular.dev</a></p>
        <p>
          This Storybook showcases the Recursica design system implemented for the
          <strong>Angular Material UI Kit</strong>. It provides reusable components that
          map our design tokens to Angular Material's component layer.
        </p>

        <section>
          <h2>Looking for another UI Kit?</h2>
          <p>Are you using a different UI Kit (like Mantine or Material UI for React)? Recursica provides multiple adapters for different frameworks.</p>
          <a class="rec-intro__btn" href="./?path=/story/introduction--adapters" target="_parent">View Supported Adapters</a>
        </section>

        <section>
          <h2>Installation</h2>
          <p>To install the Angular Material adapter in your project, run:</p>
          <code>npm install @recursica/adapter-angular-material @angular/material @angular/cdk</code>
        </section>

        <section>
          <h2>Tokens</h2>
          <p>
            Raw design tokens (colors, sizes, font weights, opacities, etc.) that feed the
            theme and components. These are the primitive values defined in your token set
            and exposed as CSS custom properties.
          </p>
        </section>

        <section>
          <h2>Theme</h2>
          <p>
            Brand and theme layer built on top of tokens. Typography types, dimensions, and
            layout grids are defined here. Theme uses the tokens and exposes both CSS
            variables and helper classes (e.g. typography classes) for consistent styling
            across the product.
          </p>
        </section>

        <section>
          <h2>Configuring Recursica</h2>
          <p>
            To modify the Recursica configuration (tokens, brand, theme), go to
            <a href="${FORGE_URL}" target="_blank" rel="noopener noreferrer">${FORGE_URL}</a>.
            Changes there drive the tokens and theme you see in this Storybook.
          </p>
        </section>

        <section>
          <h2>Documentation</h2>
          <p>
            For full documentation, guides, and API reference, visit
            <a href="${DOCS_URL}" target="_blank" rel="noopener noreferrer">${DOCS_URL}</a>.
          </p>
        </section>
      </div>
    `,
  }),
};

export const Adapters: Story = {
  render: () => ({
    styles: [sharedStyles],
    template: `
      <div class="rec-intro">
        <h1>Recursica Adapters</h1>
        <p>
          Recursica provides a strict design token enforcing layer, but we do not build
          native components from scratch. Instead, we use <strong>Adapters</strong> to map
          our unified design system onto industry-leading UI Kits. This allows you to
          leverage the power of established frameworks while maintaining strict brand
          consistency.
        </p>
        <section>
          <h2>Mantine Adapter (Default)</h2>
          <p>Built on top of Mantine v8. This is our primary, most robust adapter, recommended for most new React applications.</p>
          <a class="rec-intro__btn" href="/recursica/storybook/mantine-adapter/" target="_parent">Switch to Mantine Storybook</a>
        </section>
        <section>
          <h2>MUI Adapter</h2>
          <p>Built on top of Material UI (MUI) v7. Use this adapter if your project is heavily tied to the MUI ecosystem but needs to conform to Recursica guidelines.</p>
          <a class="rec-intro__btn" href="/recursica/storybook/mui-adapter/" target="_parent">Switch to MUI Storybook</a>
        </section>
        <section>
          <h2>Angular Material Adapter</h2>
          <p>Built on top of Angular Material 20+. Use this adapter for Angular applications that need to conform to Recursica guidelines.</p>
          <a class="rec-intro__btn" href="/recursica/storybook/angular-material-adapter/" target="_parent">You are here</a>
        </section>
      </div>
    `,
  }),
};

export const VersionInfoStory: Story = {
  name: "Version Info",
  render: () => ({
    styles: [sharedStyles],
    template: `
      <div class="rec-intro">
        <h1>Angular Material Adapter v${pkg.version}</h1>
        <p>
          <a href="https://github.com/borderux/recursica-adapter-angular-material" target="_blank" rel="noopener noreferrer">GitHub Repository</a>
          &nbsp;&middot;&nbsp;
          <a href="https://recursica.com" target="_blank" rel="noopener noreferrer">Documentation &amp; Website</a>
        </p>
        <p><em>Full changelog rendering is deferred until CHANGELOG.md exists (docs/CREATING_AN_ADAPTER.md step 6).</em></p>
      </div>
    `,
  }),
};
