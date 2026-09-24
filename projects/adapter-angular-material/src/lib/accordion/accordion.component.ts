import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ViewEncapsulation,
  signal,
} from "@angular/core";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";
import { ACCORDION_CONTEXT, AccordionContext } from "./accordion-context";

/**
 * Recursica `Accordion` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10), hand-built
 * rather than wrapping `MatAccordion`/`MatExpansionPanel` — see
 * IMPLEMENTATION_NOTES.md's "Material adoption audit" section for the full
 * investigation. Short version: `MatExpansionPanel`/`MatExpansionPanelHeader`
 * both declare `encapsulation: ViewEncapsulation.None` and build a fused
 * header (title + description + built-in chevron SVG in one `mat-content`
 * wrapper, fixed 48px/64px collapsed/expanded heights) that doesn't match
 * Recursica's token-driven `control`/`label`/`chevron`/`icon` split — the
 * same category of blocker `Tabs` hit with `MatTabGroup` (see
 * `tabs/IMPLEMENTATION_NOTES.md`), just against a different Material module.
 *
 * Composable API mirrors the source-of-truth `Accordion.tsx` structurally
 * (`Accordion` / `Accordion.Item` / `Accordion.Control` / `Accordion.Panel`)
 * as four separate components (`rec-accordion` / `rec-accordion-item` /
 * `rec-accordion-control` / `rec-accordion-panel`) — Angular has no dot-
 * notation static-property export convention, so these are plain named
 * exports composed by selector in a caller's template, same convention as
 * `Card`'s `Header`/`Footer`/`Content`/`Section` and `Tabs`'
 * `List`/`Tab`/`Panel`.
 *
 * **No hybrid `title`/`leftIcon`-on-Item convenience API** — unlike the
 * source-of-truth, `<rec-accordion-item>` never auto-constructs a control.
 * `<rec-accordion-control>` is always required, explicitly composed by the
 * caller. See IMPLEMENTATION_NOTES.md's "Hybrid API vs. explicit
 * composition" section for the full reasoning (short version: Angular's
 * `<ng-content>` *can* technically support the same conditional-auto-build
 * shape the React reference uses, but doing so would mean maintaining two
 * parallel composition paths for a convenience that saves exactly one line
 * of template per item — `Tabs`, the closest structural precedent in this
 * adapter, made the same call and never grew a hybrid shortcut either).
 *
 * State (open/closed per item, `multiple`) is provided to descendant
 * `AccordionItemComponent`/`AccordionControlComponent`/
 * `AccordionPanelComponent` instances via `ACCORDION_CONTEXT` — Angular's
 * DI-based equivalent of the implicit DOM-attribute state Mantine relies on.
 * Internally, open items are always tracked as a `string[]` regardless of
 * `multiple` (empty array = nothing open) — simpler than mirroring Mantine's
 * split `string | null` (single) vs. `string[]` (multiple) value shape,
 * normalized back to the public `value`/`defaultValue`/`valueChange`
 * contract (`string | string[] | null`) at the input/output boundary only.
 */
@Component({
  selector: "rec-accordion",
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./accordion.component.css",
  providers: [{ provide: ACCORDION_CONTEXT, useExisting: AccordionComponent }],
  template: `
    <div
      class="root"
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
    >
      <ng-content />
    </div>
  `,
})
export class AccordionComponent
  implements AccordionContext, RecursicaOverStyled, OnInit
{
  /** `RecursicaAccordionProps.multiple` — allow more than one item open at once. When this
   * flips from `true` to `false` with more than one item open, only the first (by open order)
   * stays open — same "collapse to the first" behavior Mantine's own Accordion applies. */
  @Input() multiple = false;

  /**
   * Controlled open value(s). `undefined` (never bound) means uncontrolled — this component
   * tracks its own open state internally, seeded from `defaultValue`. Widened to also accept
   * `null` (meaning "nothing open") beyond the canonical `RecursicaAccordionProps.value`'s
   * `string | string[]` — a harmless, permissive superset matching `Tabs.value`'s own
   * `string | null` precedent, since "no item open" needs a representable controlled state.
   */
  @Input() value?: string | string[] | null;

  /** Initial open value(s) for the uncontrolled case. */
  @Input() defaultValue: string | string[] | null = null;

  /** Emitted whenever the open value(s) change, whether controlled or uncontrolled. Always
   * emits the shape matching `multiple` (a `string[]` when `multiple`, else `string | null`). */
  @Output() valueChange = new EventEmitter<string | string[] | null>();

  /** `RecursicaAccordionProps.chevron` — custom chevron overriding the default expand/collapse
   * indicator for every item; rendered via `*ngTemplateOutlet`, same translation as `Button`'s
   * `icon` (see that component's class doc comment). A single `<rec-accordion-control>` can
   * still override this per-item via its own `chevron` input. */
  @Input() chevron?: TemplateRef<unknown>;

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  private readonly _uncontrolledOpen = signal<string[]>([]);

  ngOnInit(): void {
    this._uncontrolledOpen.set(this.normalize(this.defaultValue));
  }

  private normalize(value: string | string[] | null | undefined): string[] {
    if (value == null) return [];
    return Array.isArray(value) ? value : [value];
  }

  private get openValues(): string[] {
    return this.value !== undefined
      ? this.normalize(this.value)
      : this._uncontrolledOpen();
  }

  isOpen(value: string): boolean {
    return this.openValues.includes(value);
  }

  toggle(value: string): void {
    const current = this.openValues;
    const isCurrentlyOpen = current.includes(value);
    let next: string[];
    if (this.multiple) {
      next = isCurrentlyOpen
        ? current.filter((v) => v !== value)
        : [...current, value];
    } else {
      next = isCurrentlyOpen ? [] : [value];
    }

    if (this.value === undefined) {
      this._uncontrolledOpen.set(next);
    }
    this.valueChange.emit(this.multiple ? next : (next[0] ?? null));
  }

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }
}
