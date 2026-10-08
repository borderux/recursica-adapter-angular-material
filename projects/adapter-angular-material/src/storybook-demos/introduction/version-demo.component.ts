import { Component, ViewEncapsulation } from "@angular/core";
import { HeadingComponent } from "../../lib/heading/heading.component";
import { GroupComponent } from "../../lib/group/group.component";
import { LinkComponent } from "../../lib/link/link.component";
import { StackComponent } from "../../lib/stack/stack.component";
import pkg from "../../../../../package.json";

/**
 * Ported from the Mantine adapter's `Version.tsx`. The Mantine version also
 * renders `CHANGELOG.md` inline; here it links to the changelog on GitHub
 * instead, since Storybook's Angular webpack config has no raw-file loader
 * or markdown renderer.
 */
@Component({
  selector: "storybook-demo-version",
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [GroupComponent, HeadingComponent, LinkComponent, StackComponent],
  template: `
    <rec-stack gap="rec-md">
      <rec-heading [order]="1"
        >Angular Material Adapter v{{ version }}</rec-heading
      >
      <rec-group gap="rec-md">
        <rec-link
          href="https://github.com/borderux/recursica-adapter-angular-material"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub Repository
        </rec-link>
        <rec-link
          href="https://github.com/borderux/recursica-adapter-angular-material/blob/main/CHANGELOG.md"
          target="_blank"
          rel="noopener noreferrer"
        >
          Changelog
        </rec-link>
        <rec-link
          href="https://recursica.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Documentation & Website
        </rec-link>
      </rec-group>
    </rec-stack>
  `,
})
export class VersionDemoComponent {
  readonly version = pkg.version;
}
