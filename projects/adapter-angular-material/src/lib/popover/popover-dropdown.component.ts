import {
  AfterViewInit,
  Component,
  OnDestroy,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
  inject,
} from "@angular/core";
import { POPOVER_CONTEXT } from "./popover-context";

/**
 * `Popover.Dropdown` — captures its own projected content as a
 * `TemplateRef` and hands it to `PopoverComponent` via DI, which renders
 * it (via `ngTemplateOutlet`) inside the real CDK overlay only while open.
 * A near-verbatim copy of `HoverCardDropdownComponent` — see its own class
 * doc comment for the full "real, honest trade-off, not full lazy
 * instantiation" reasoning (content is instantiated once up front as part
 * of the caller's view, not re-instantiated per open), which applies
 * identically here.
 */
@Component({
  selector: "rec-popover-dropdown",
  encapsulation: ViewEncapsulation.Emulated,
  template: `
    <ng-template #contentTpl>
      <ng-content />
    </ng-template>
  `,
})
export class PopoverDropdownComponent implements AfterViewInit, OnDestroy {
  @ViewChild("contentTpl")
  private readonly contentTemplate!: TemplateRef<unknown>;

  private readonly context = inject(POPOVER_CONTEXT, { optional: true });

  ngAfterViewInit(): void {
    this.context?.registerDropdownTemplate(this.contentTemplate);
  }

  ngOnDestroy(): void {
    this.context?.registerDropdownTemplate(null);
  }
}
