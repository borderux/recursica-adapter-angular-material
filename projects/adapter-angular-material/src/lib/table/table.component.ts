import { Component, Input, ViewEncapsulation, inject } from "@angular/core";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";
import {
  RECURSICA_ARIA_LABELLING_INPUTS,
  RECURSICA_ELEMENT_ID_INPUTS,
  RecursicaAriaLabelling,
  RecursicaElementId,
} from "../utils/recursica-aria";

/**
 * Recursica `Table` — Angular Material adapter.
 *
 * REAL implementation (`docs/CREATING_AN_ADAPTER.md` step 10). The stub's
 * own `IMPLEMENTATION_NOTES.md` guessed `MatTable`/`MatTableDataSource` —
 * a headless, data-source-driven table where columns are declared via
 * `*matColumnDef`/`*matCellDef` structural directives. Re-investigated
 * against the real reference before building: `Table.tsx` is **not**
 * data-source-driven at all — it's a thin, compound wrapper around plain
 * HTML table markup (confirmed by reading it directly: `Table`/`Thead`/
 * `Tbody`/`Tr`/`Th`/`Td`/`Tfoot`/`Caption`/`ScrollContainer`, each just a
 * styled native element with a couple of Recursica-specific data
 * attributes). `MatTable`'s entire value proposition — column
 * definitions, `MatTableDataSource`, sort/paginate glue — solves a problem
 * this reference doesn't have; adopting it would mean building a
 * `columns`/`dataSource` API this design system's own reference component
 * doesn't expose, then translating every golden story's literal
 * `<Table.Tr><Table.Td>...` composition back into that shape for no
 * benefit. **Decision**: hand-built, plain native table elements with
 * Recursica token styling — no Material adoption, the same category of
 * decision `Card`/`Flex`/`Grid` already made for structural, non-interactive
 * primitives elsewhere in this adapter.
 *
 * ## Sub-components: `rec-table-*` elements by default, native `th`/`td` selectors for the cell parts
 *
 * Every sub-component is a `rec-table-*` element styled `display:
 * table-*` (`table-header-group`/`table-row-group`/`table-footer-group`/
 * `table-row`/`table-cell`): the CSS table-layout algorithm keys off
 * computed `display`, not tag names, so this lays out like a real
 * `<table>`. Each sub-component's `host: { role: '...' }` restores the
 * implicit ARIA semantics (`rowgroup`/`row`/`columnheader`/`cell`) a real
 * `<thead>`/`<tr>`/`<th>`/`<td>` would carry, since a CSS `display`
 * override does not imply an ARIA role.
 *
 * The repo's `eslint.config.mjs` enforces element-type component selectors
 * with the `rec` prefix, so the row/group parts stay `rec-table-*` only.
 * `TableThComponent` and `TableTdComponent` additionally accept the native
 * attribute forms `th[recTableTh]` and `td[recTableTd]`, where the host IS
 * a real `th`/`td`; the cell-only inputs `colSpan`, `rowSpan` and `scope`
 * only take effect in that form (see `IMPLEMENTATION_NOTES.md`).
 *
 * ## Styling: each sub-component owns its own scoped `:host` CSS, not shared descendant selectors
 *
 * The reference's own `Table.module.css` uses plain descendant selectors
 * from a single `.root` class on the `<table>` element itself (`.root th`,
 * `.root td`, etc.) — that only works because Mantine's `Table` renders
 * one flat DOM tree with no component-boundary CSS scoping. This adapter's
 * sub-components are separate Angular components, each with its own
 * `ViewEncapsulation.Emulated` `_ngcontent-*` hash on its own host element
 * — `TableComponent`'s own scoped CSS cannot reach a `rec-table-th` a
 * *different* component (`TableThComponent`) creates, the same
 * encapsulation-boundary reachability rule (not a CDK-portal one this
 * time) that every other "compound" component in this adapter already
 * accounts for. Each sub-component that needs real token styling
 * (`Tr`/`Th`/`Td`/`Tfoot`) carries its own `:host`-scoped rules instead of
 * relying on inherited descendant selectors from the root.
 *
 * ## Not built: `Table.Caption`/`Table.ScrollContainer`
 *
 * Confirmed by reading `Table.stories.tsx` directly: all 4 golden stories
 * (Default, SortedColumn, SelectedAndDisabledRows, CurrencyColumnWithFooter)
 * use only `Table`/`Thead`/`Tbody`/`Tr`/`Th`/`Td`/`Tfoot` — neither
 * `Caption` nor `ScrollContainer` appears in any of them. Building two
 * additional sub-components with no golden coverage would be speculative
 * scope, the same reasoning `Modal`'s/`HoverCard`'s own granular
 * sub-components were skipped for elsewhere in this adapter.
 */
@Component({
  selector: "rec-table",
  hostDirectives: [
    {
      directive: RecursicaAriaLabelling,
      inputs: RECURSICA_ARIA_LABELLING_INPUTS,
    },
    { directive: RecursicaElementId, inputs: RECURSICA_ELEMENT_ID_INPUTS },
  ],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./table.component.css",
  template: `
    <table
      class="root"
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
      [attr.id]="elementId.id ?? null"
      [attr.aria-label]="aria.ariaLabel ?? null"
      [attr.aria-labelledby]="aria.ariaLabelledby ?? null"
      [attr.aria-describedby]="aria.ariaDescribedby ?? null"
    >
      <ng-content />
    </table>
  `,
})
export class TableComponent implements RecursicaOverStyled {
  /** `ariaLabel`, `ariaLabelledby`, `ariaDescribedby` and `id` land on the inner `<table>`, not the host. */
  protected readonly aria = inject(RecursicaAriaLabelling);
  protected readonly elementId = inject(RecursicaElementId);

  @Input() overStyled = false;
  @Input() overClass?: string;
  @Input() overStyle?: Record<string, string>;

  get resolvedOverStyle(): {
    class: string | null;
    style: Record<string, string> | null;
  } {
    return resolveOverStyle(this);
  }
}
