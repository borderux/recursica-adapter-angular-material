import { Component, ViewEncapsulation } from "@angular/core";
import { HeadingComponent } from "../../lib/heading/heading.component";
import { LinkComponent } from "../../lib/link/link.component";
import { StackComponent } from "../../lib/stack/stack.component";
import { TextComponent } from "../../lib/text/text.component";

interface AdapterCard {
  title: string;
  description: string;
  href: string;
  linkLabel: string;
}

/**
 * Supported-adapters list. Ported from `@recursica/storybook-template`'s
 * `AdaptersContent`, adding this adapter. Only public adapters are listed.
 */
const ADAPTERS: AdapterCard[] = [
  {
    title: "Mantine Adapter (Default)",
    description:
      "Built on top of Mantine v8. This is our primary, most robust adapter recommended for most new React applications.",
    href: "https://borderux.github.io/recursica-adapter-mantine-v8/",
    linkLabel: "Switch to Mantine Storybook",
  },
  {
    title: "MUI Adapter",
    description:
      "Built on top of Material UI (MUI) v7. Use this adapter if your project is heavily tied to the MUI ecosystem but needs to conform to Recursica guidelines.",
    href: "https://borderux.github.io/recursica-adapter-mui-v7/",
    linkLabel: "Switch to MUI Storybook",
  },
  {
    title: "Angular Material Adapter",
    description:
      "Built on top of Angular Material. Use this adapter for Angular applications that need to conform to Recursica guidelines.",
    href: "https://borderux.github.io/recursica-adapter-angular-material/",
    linkLabel: "Switch to Angular Material Storybook",
  },
];

@Component({
  selector: "storybook-demo-adapters",
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [HeadingComponent, LinkComponent, StackComponent, TextComponent],
  template: `
    <rec-stack gap="rec-xl" class="storybook-demo-adapters">
      <rec-heading [order]="1">Recursica Adapters</rec-heading>
      <rec-text>
        Recursica provides a strict design token enforcing layer, but we do not
        build native components from scratch. Instead, we use
        <strong>Adapters</strong> to map our unified design system onto
        industry-leading UI Kits. This allows you to leverage the power of
        established frameworks while maintaining strict brand consistency.
      </rec-text>
      @for (adapter of adapters; track adapter.href) {
        <rec-stack gap="rec-md" class="storybook-demo-adapters-card">
          <rec-heading [order]="2">{{ adapter.title }}</rec-heading>
          <rec-text>{{ adapter.description }}</rec-text>
          <rec-link
            [href]="adapter.href"
            target="_blank"
            rel="noopener noreferrer"
            >{{ adapter.linkLabel }}</rec-link
          >
        </rec-stack>
      }
    </rec-stack>
  `,
  styles: [
    `
      .storybook-demo-adapters {
        max-width: 640px;
      }
      .storybook-demo-adapters-card {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 24px;
      }
    `,
  ],
})
export class AdaptersDemoComponent {
  readonly adapters = ADAPTERS;
}
