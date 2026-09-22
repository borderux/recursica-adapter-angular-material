import { Component, Input, ViewEncapsulation } from "@angular/core";

export type RecursicaGridBreakpoint = "xs" | "sm" | "md" | "lg" | "xl";
export type RecursicaGridResponsiveValue =
  | number
  | Partial<Record<"base" | RecursicaGridBreakpoint, number>>;

function toResponsiveRecord(
  value: RecursicaGridResponsiveValue | undefined,
): Partial<Record<"base" | RecursicaGridBreakpoint, number>> {
  if (value === undefined) {
    return {};
  }
  return typeof value === "number" ? { base: value } : value;
}

/**
 * `Grid.Col` — see `grid.component.ts`'s class doc comment for the full
 * "no design tokens, no Material candidate" reasoning shared with `Grid`
 * itself, not repeated here.
 *
 * ## Responsive `span`/`offset`: CSS custom properties + `@media`, not JS breakpoint matching
 *
 * Mantine's own `Grid.Col` resolves `span={{ xs: 12, sm: 6, md: 3 }}`-style
 * responsive objects via its own internal breakpoint/media-query CSS
 * generation. There's no Mantine here to generate that, so this component
 * sets one CSS custom property per breakpoint directly on its host
 * (`--col-span-base`/`--col-span-xs`/etc.), and `grid.component.css`
 * resolves the effective span at each breakpoint via `@media (min-width: ...)`
 * blocks reading whichever variable is actually set (falling back to the
 * next-smaller breakpoint's value when a given breakpoint doesn't override
 * it — the same "mobile-first, override upward" cascade Mantine's own
 * responsive props follow). Breakpoint values (`36em`/`48em`/`62em`/`75em`/`88em`
 * for xs/sm/md/lg/xl) are Mantine's own hardcoded defaults (confirmed in
 * `@mantine/core`'s compiled `styles.css`), reused here for the same reason
 * `Container`'s size scale reuses them — there is no Recursica breakpoint
 * token to reference instead.
 *
 * ## `visibleFrom`/`hiddenFrom`: same breakpoint scale, plain `display: none`
 *
 * `hiddenFrom="sm"` hides the column at `sm` and above; `visibleFrom="sm"`
 * hides it *below* `sm`. Implemented as `[attr.data-hidden-from]`/
 * `[attr.data-visible-from]`, matched by the same `@media` blocks.
 */
@Component({
  selector: "rec-grid-col",
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./grid.component.css",
  host: {
    "[style.--col-span-base]": "spanRecord.base ?? null",
    "[style.--col-span-xs]": "spanRecord.xs ?? null",
    "[style.--col-span-sm]": "spanRecord.sm ?? null",
    "[style.--col-span-md]": "spanRecord.md ?? null",
    "[style.--col-span-lg]": "spanRecord.lg ?? null",
    "[style.--col-span-xl]": "spanRecord.xl ?? null",
    "[style.--col-offset-base]": "offsetRecord.base ?? null",
    "[style.--col-offset-xs]": "offsetRecord.xs ?? null",
    "[style.--col-offset-sm]": "offsetRecord.sm ?? null",
    "[style.--col-offset-md]": "offsetRecord.md ?? null",
    "[style.--col-offset-lg]": "offsetRecord.lg ?? null",
    "[style.--col-offset-xl]": "offsetRecord.xl ?? null",
    "[style.order]": "order ?? null",
    "[attr.data-hidden-from]": "hiddenFrom ?? null",
    "[attr.data-visible-from]": "visibleFrom ?? null",
  },
  template: `<ng-content />`,
})
export class GridColComponent {
  @Input() span: RecursicaGridResponsiveValue = 1;
  @Input() offset?: RecursicaGridResponsiveValue;
  @Input() order?: number;
  @Input() visibleFrom?: RecursicaGridBreakpoint;
  @Input() hiddenFrom?: RecursicaGridBreakpoint;

  get spanRecord(): Partial<Record<"base" | RecursicaGridBreakpoint, number>> {
    return toResponsiveRecord(this.span);
  }

  get offsetRecord(): Partial<
    Record<"base" | RecursicaGridBreakpoint, number>
  > {
    return toResponsiveRecord(this.offset);
  }
}
