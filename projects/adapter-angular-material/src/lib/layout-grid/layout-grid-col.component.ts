import { Component, Input, ViewEncapsulation } from "@angular/core";

export type RecursicaLayoutGridBreakpoint = "xs" | "sm" | "md" | "lg" | "xl";
type BreakpointKey = "base" | RecursicaLayoutGridBreakpoint;

/** `"auto"` shares the row's leftover width, `"content"` hugs its content. */
export type RecursicaLayoutGridSpan = number | "auto" | "content";
export type RecursicaLayoutGridResponsiveSpan =
  | RecursicaLayoutGridSpan
  | Partial<Record<BreakpointKey, RecursicaLayoutGridSpan>>;
export type RecursicaLayoutGridResponsiveOffset =
  | number
  | Partial<Record<BreakpointKey, number>>;

const BREAKPOINTS: BreakpointKey[] = ["base", "xs", "sm", "md", "lg", "xl"];

const COLUMNS = "var(--recursica_brand_layout-grids_columns)";
const GAP = "var(--recursica_brand_layout-grids_column-gutter)";
// One column's width: the row minus every gutter, split by the (breakpoint-aware) column count.
const COLUMN_WIDTH = `((100% - (${COLUMNS} - 1) * ${GAP}) / ${COLUMNS})`;

function toRecord<T>(value: T | Partial<Record<BreakpointKey, T>> | undefined) {
  if (value === undefined) return {} as Partial<Record<BreakpointKey, T>>;
  return typeof value === "object" && value !== null
    ? (value as Partial<Record<BreakpointKey, T>>)
    : ({ base: value } as Partial<Record<BreakpointKey, T>>);
}

function sizing(span: RecursicaLayoutGridSpan) {
  if (span === "auto") {
    return { basis: "0", max: "100%", grow: "1" };
  }
  if (span === "content") {
    return { basis: "auto", max: "100%", grow: "0" };
  }
  // Clamped to the current column count, so span 6 fills the row at 3 columns.
  const n = `min(${span}, ${COLUMNS})`;
  const width = `calc(${COLUMN_WIDTH} * ${n} + (${n} - 1) * ${GAP})`;
  return { basis: width, max: width, grow: "0" };
}

/**
 * `LayoutGrid.Col` — see `layout-grid.component.ts`'s class doc comment for the layout model.
 *
 * ## Responsive `span`/`offset`
 *
 * `span`/`offset` accept a value or a `{ base, xs, sm, md, lg, xl }` map. This component resolves
 * the map mobile-first (a breakpoint with no entry inherits the next-smaller one) and writes the
 * resulting `--col-basis-*`/`--col-max-*`/`--col-grow-*`/`--col-offset-*` custom properties for
 * every breakpoint on its host; `layout-grid-col.component.css` selects them with `@media`
 * blocks. An omitted span is 12 columns, like Mantine's `Grid.Col`. Because the widths are
 * expressed against `--recursica_brand_layout-grids_columns`, they follow Forge's per-breakpoint
 * column count.
 *
 * ## `visibleFrom`/`hiddenFrom`
 *
 * `hiddenFrom="sm"` hides the column at `sm` and above; `visibleFrom="sm"` hides it below `sm`.
 */
@Component({
  selector: "rec-layout-grid-col",
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./layout-grid-col.component.css",
  host: {
    "[style]": "hostVars",
    "[style.order]": "order ?? null",
    "[attr.data-hidden-from]": "hiddenFrom ?? null",
    "[attr.data-visible-from]": "visibleFrom ?? null",
  },
  template: `<ng-content />`,
})
export class LayoutGridColComponent {
  @Input() span: RecursicaLayoutGridResponsiveSpan = 12;
  @Input() offset?: RecursicaLayoutGridResponsiveOffset;
  @Input() order?: number;
  @Input() visibleFrom?: RecursicaLayoutGridBreakpoint;
  @Input() hiddenFrom?: RecursicaLayoutGridBreakpoint;

  get hostVars(): Record<string, string> {
    const spans = toRecord<RecursicaLayoutGridSpan>(this.span);
    const offsets = toRecord<number>(this.offset);
    const vars: Record<string, string> = {};
    let span: RecursicaLayoutGridSpan = 12;
    let offset = 0;
    for (const bp of BREAKPOINTS) {
      span = spans[bp] ?? span;
      offset = offsets[bp] ?? offset;
      const { basis, max, grow } = sizing(span);
      vars[`--col-basis-${bp}`] = basis;
      vars[`--col-max-${bp}`] = max;
      vars[`--col-grow-${bp}`] = grow;
      // Offset is a number of columns, so it moves by that many column widths plus gutters.
      vars[`--col-offset-${bp}`] =
        `calc((${COLUMN_WIDTH} + ${GAP}) * min(${offset}, ${COLUMNS}))`;
    }
    return vars;
  }
}
