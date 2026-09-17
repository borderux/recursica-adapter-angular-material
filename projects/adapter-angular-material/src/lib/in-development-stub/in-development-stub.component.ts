import { Component, Input, ViewEncapsulation } from "@angular/core";

/**
 * Shared placeholder rendered by every not-yet-implemented Recursica
 * component stub (see `docs/CREATING_AN_ADAPTER.md` step 9).
 *
 * Every stub component's own template delegates to this one so the
 * placeholder markup/copy only ever needs to change in a single place.
 * This is not part of the adapter's public component set — it is not
 * exported from `public-api.ts`, but it is exported from the internal
 * `src/lib/index.ts` barrel so stub components across folders can import it.
 */
@Component({
  selector: "rec-in-development-stub",
  imports: [],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./in-development-stub.component.css",
  template: `
    <div class="in-development-stub" role="note">
      <span aria-hidden="true">🚧</span>
      <span>
        Not yet implemented{{ componentName ? " — " + componentName : "" }}
      </span>
    </div>
  `,
})
export class InDevelopmentStubComponent {
  /** Optional label naming which Recursica component this placeholder stands in for. */
  @Input() componentName?: string;
}
