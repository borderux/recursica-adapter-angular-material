import { Component, Input, ViewEncapsulation } from "@angular/core";
import {
  RecursicaOverStyled,
  resolveOverStyle,
} from "../utils/recursica-over-styled";

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
 * ## Sub-components are `rec-table-*` elements styled `display: table-*` — not real `<tr>`/`<th>`/`<td>` tags
 *
 * A first instinct here (rejected) was an attribute selector on the real
 * semantic tag (`tr[recTableTr]`, `td[recTableTd]`, matching `MatRow`'s
 * own `selector: 'mat-row, tr[mat-row]'`), reasoning that a `<rec-table-tr>`
 * custom element nested between `<rec-table-tbody>` and `<rec-table-td>`
 * would trigger browser HTML-parsing "foster parenting" the way invalid
 * markup text would. That reasoning doesn't survive contact with two real
 * findings: (1) this repo's own `eslint.config.mjs` enforces
 * `@angular-eslint/component-selector: { type: "element", prefix: "rec" }`
 * repo-wide for real, published components (no exemption the way
 * `form-control-wrapper.stories.ts`'s own `input[recDemoFormControl]`
 * demo-only control gets) — attribute selectors on native tags are
 * flagged by `eslint`, confirmed live, not assumed; and (2) foster
 * parenting is a *parsing*-algorithm quirk (tokenizing HTML text into a
 * DOM tree) that doesn't apply to Angular's runtime DOM construction at
 * all (`createElement`/`appendChild` calls, no text-parsing pass). The
 * real constraint is CSS table *layout*, solved directly: every
 * sub-component's own `:host` declares the matching table-participant
 * `display` value (`table-header-group`/`table-row-group`/
 * `table-footer-group`/`table-row`/`table-cell`) — the CSS table-layout
 * algorithm's anonymous-box generation keys off computed `display`
 * values, not tag names, so this lays out identically to a real
 * `<table>` regardless of the underlying custom-element tag. Each
 * sub-component's own `host: { role: '...' }` restores the implicit ARIA
 * semantics (`rowgroup`/`row`/`columnheader`/`cell`) a real `<thead>`/
 * `<tr>`/`<th>`/`<td>` would have carried automatically — a CSS `display`
 * override does not imply an ARIA role the way it implies layout
 * participation, so this is set explicitly rather than assumed to follow.
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
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./table.component.css",
  template: `
    <table
      class="root"
      [class]="resolvedOverStyle.class"
      [style]="resolvedOverStyle.style"
    >
      <ng-content />
    </table>
  `,
})
export class TableComponent implements RecursicaOverStyled {
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
