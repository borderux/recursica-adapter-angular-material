import { NgTemplateOutlet } from "@angular/common";
import {
  Component,
  ElementRef,
  Input,
  TemplateRef,
  ViewEncapsulation,
  ViewChild,
  inject,
} from "@angular/core";
import type { FocusableOption } from "@angular/cdk/a11y";
import {
  RECURSICA_ARIA_LABELLING_INPUTS,
  RecursicaAriaLabelling,
} from "../utils/recursica-aria";
import { TABS_CONTEXT } from "./tabs-context";

/**
 * Recursica `Tabs.Tab` — Angular Material adapter.
 *
 * REAL implementation, part of `Tabs`'s compound API (see
 * `tabs.component.ts`'s class doc comment for why this is hand-built
 * rather than wrapping `MatTab`). This is the clickable tab button only —
 * its associated body lives in a separate, `value`-matched
 * `<rec-tabs-panel>`, matching the genesis adapter's real `Tabs.Tab`/
 * `Tabs.Panel` split exactly (unlike `MatTab`, which fuses both).
 *
 * Implements CDK's `FocusableOption` (`focus()`/`disabled`/`getLabel()`)
 * so `TabsListComponent`'s `FocusKeyManager` can drive real roving-tabindex
 * arrow-key navigation across a `QueryList<TabComponent>` — the same CDK
 * primitive Material's own components use internally, without needing
 * `MatTab`/`MatTabGroup` itself.
 *
 * `leftSection`/`rightSection` are `TemplateRef`s, not projected-content
 * slots — same translation as `Button`'s `icon` / `MenuItem`'s
 * `leftSection`/`rightSection`.
 */
function sanitize(value: string): string {
  return value.trim().replace(/\s+/g, "-");
}

@Component({
  selector: "rec-tabs-tab",
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.Emulated,
  hostDirectives: [
    {
      directive: RecursicaAriaLabelling,
      inputs: RECURSICA_ARIA_LABELLING_INPUTS,
    },
  ],
  host: { "[attr.title]": "null" },
  styleUrl: "./tabs-tab.component.css",
  template: `
    <button
      #button
      type="button"
      class="tab"
      role="tab"
      [id]="tabId"
      [attr.aria-label]="aria.ariaLabel ?? null"
      [attr.aria-labelledby]="aria.ariaLabelledby ?? null"
      [attr.aria-describedby]="aria.ariaDescribedby ?? null"
      [attr.title]="title ?? null"
      [attr.aria-selected]="isActive"
      [attr.aria-controls]="panelId"
      [attr.aria-disabled]="disabled ? true : null"
      [attr.data-active]="isActive ? '' : null"
      [attr.data-disabled]="disabled ? '' : null"
      [disabled]="disabled"
      [tabIndex]="isActive ? 0 : -1"
      (click)="onClick()"
    >
      @if (leftSection) {
        <span class="section" data-position="left">
          <ng-container [ngTemplateOutlet]="leftSection" />
        </span>
      }
      <span class="label"><ng-content /></span>
      @if (rightSection) {
        <span class="section" data-position="right">
          <ng-container [ngTemplateOutlet]="rightSection" />
        </span>
      }
    </button>
  `,
})
export class TabComponent implements FocusableOption {
  /** Matches this tab to its sibling `<rec-tabs-panel [value]="...">` and to `Tabs`'s active `value`. */
  @Input({ required: true }) value!: string;

  @Input() disabled = false;

  /** `title` of the inner `button[role=tab]`. */
  @Input() title?: string;

  @Input() leftSection?: TemplateRef<unknown>;
  @Input() rightSection?: TemplateRef<unknown>;

  @ViewChild("button", { static: true })
  private readonly buttonRef!: ElementRef<HTMLButtonElement>;

  private readonly ctx = inject(TABS_CONTEXT, { optional: true });
  protected readonly aria = inject(RecursicaAriaLabelling);

  /** Exposed so `TabsListComponent` can match a native `focusin` target back to this component — see its own `onFocusIn()`. */
  get nativeElement(): HTMLButtonElement {
    return this.buttonRef.nativeElement;
  }

  get isActive(): boolean {
    return this.ctx?.activeValue === this.value;
  }

  get tabId(): string {
    return this.ctx?.tabId(this.value) ?? `rec-tab-${sanitize(this.value)}`;
  }

  get panelId(): string {
    return (
      this.ctx?.panelId(this.value) ?? `rec-tabpanel-${sanitize(this.value)}`
    );
  }

  onClick(): void {
    if (this.disabled) return;
    this.ctx?.select(this.value);
  }

  /**
   * `FocusableOption.focus()` — called by `TabsListComponent`'s `FocusKeyManager`.
   * The interface's own `origin` parameter is optional, and this
   * implementation doesn't need it — a fewer-parameter function is a
   * valid implementation of an interface method with an optional
   * parameter (standard TS/JS contravariant parameter compatibility), so
   * it's omitted entirely rather than kept as a dead, unused placeholder.
   */
  focus(): void {
    this.buttonRef.nativeElement.focus();
  }

  /** `ListKeyManagerOption.getLabel()` — powers `FocusKeyManager`'s typeahead. */
  getLabel(): string {
    return this.buttonRef.nativeElement.textContent?.trim() ?? "";
  }
}
