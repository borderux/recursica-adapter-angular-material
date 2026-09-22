import type { Meta, StoryObj } from "@storybook/angular";
import { moduleMetadata } from "@storybook/angular";
import { TableComponent } from "./table.component";
import { TableTheadComponent } from "./table-thead.component";
import { TableTbodyComponent } from "./table-tbody.component";
import { TableTfootComponent } from "./table-tfoot.component";
import { TableTrComponent } from "./table-tr.component";
import { TableThComponent } from "./table-th.component";
import { TableTdComponent } from "./table-td.component";

/**
 * Real implementation stories (docs/CREATING_AN_ADAPTER.md step 10) — not a
 * stub, so the title uses the `"UI-Kit/<Name>"` convention. Mirrors the
 * reference's own `Table.stories.tsx` exactly: Default, SortedColumn,
 * SelectedAndDisabledRows, CurrencyColumnWithFooter.
 */
const meta: Meta<TableComponent> = {
  title: "UI-Kit/Table",
  component: TableComponent,
  decorators: [
    moduleMetadata({
      imports: [
        TableComponent,
        TableTheadComponent,
        TableTbodyComponent,
        TableTfootComponent,
        TableTrComponent,
        TableThComponent,
        TableTdComponent,
      ],
    }),
  ],
};
export default meta;

type Story = StoryObj<TableComponent>;

const elements = [
  { position: 6, mass: 12.011, symbol: "C", name: "Carbon" },
  { position: 7, mass: 14.007, symbol: "N", name: "Nitrogen" },
  { position: 8, mass: 15.999, symbol: "O", name: "Oxygen" },
  { position: 9, mass: 18.998, symbol: "F", name: "Fluorine" },
  { position: 10, mass: 20.18, symbol: "Ne", name: "Neon" },
];

export const Default: Story = {
  render: () => ({
    template: `
      <rec-table>
        <rec-table-thead>
          <rec-table-tr>
            <rec-table-th>Element position</rec-table-th>
            <rec-table-th>Element name</rec-table-th>
            <rec-table-th>Symbol</rec-table-th>
            <rec-table-th>Atomic mass</rec-table-th>
          </rec-table-tr>
        </rec-table-thead>
        <rec-table-tbody>
          @for (el of elements; track el.name) {
            <rec-table-tr>
              <rec-table-td>{{ el.position }}</rec-table-td>
              <rec-table-td>{{ el.name }}</rec-table-td>
              <rec-table-td>{{ el.symbol }}</rec-table-td>
              <rec-table-td>{{ el.mass }}</rec-table-td>
            </rec-table-tr>
          }
        </rec-table-tbody>
      </rec-table>
    `,
    props: { elements },
  }),
};

export const SortedColumn: Story = {
  render: () => ({
    template: `
      <rec-table>
        <rec-table-thead>
          <rec-table-tr>
            <rec-table-th>Element position</rec-table-th>
            <rec-table-th>Element name</rec-table-th>
            <rec-table-th>Symbol</rec-table-th>
            <rec-table-th sorted="asc">Atomic mass</rec-table-th>
          </rec-table-tr>
        </rec-table-thead>
        <rec-table-tbody>
          @for (el of sorted; track el.name) {
            <rec-table-tr>
              <rec-table-td>{{ el.position }}</rec-table-td>
              <rec-table-td>{{ el.name }}</rec-table-td>
              <rec-table-td>{{ el.symbol }}</rec-table-td>
              <rec-table-td>{{ el.mass }}</rec-table-td>
            </rec-table-tr>
          }
        </rec-table-tbody>
      </rec-table>
    `,
    props: { sorted: [...elements].sort((a, b) => a.mass - b.mass) },
  }),
};

export const SelectedAndDisabledRows: Story = {
  render: () => ({
    template: `
      <rec-table>
        <rec-table-thead>
          <rec-table-tr>
            <rec-table-th>Element position</rec-table-th>
            <rec-table-th>Element name</rec-table-th>
            <rec-table-th>Symbol</rec-table-th>
            <rec-table-th>Atomic mass</rec-table-th>
          </rec-table-tr>
        </rec-table-thead>
        <rec-table-tbody>
          @for (el of elements; track el.name; let i = $index) {
            <rec-table-tr [selected]="i === 0" [disabled]="i === elements.length - 1">
              <rec-table-td>{{ el.position }}</rec-table-td>
              <rec-table-td>{{ el.name }}</rec-table-td>
              <rec-table-td>{{ el.symbol }}</rec-table-td>
              <rec-table-td>{{ el.mass }}</rec-table-td>
            </rec-table-tr>
          }
        </rec-table-tbody>
      </rec-table>
    `,
    props: { elements },
  }),
};

export const CurrencyColumnWithFooter: Story = {
  render: () => {
    const prices = [
      { item: "Widget", price: 19.99 },
      { item: "Gadget", price: 49.5 },
      { item: "Gizmo", price: 9.25 },
    ];
    const total = prices.reduce((sum, row) => sum + row.price, 0);
    return {
      template: `
        <rec-table>
          <rec-table-thead>
            <rec-table-tr>
              <rec-table-th>Item</rec-table-th>
              <rec-table-th variant="currency">Price</rec-table-th>
            </rec-table-tr>
          </rec-table-thead>
          <rec-table-tbody>
            @for (row of prices; track row.item) {
              <rec-table-tr>
                <rec-table-td>{{ row.item }}</rec-table-td>
                <rec-table-td variant="currency">\${{ row.price.toFixed(2) }}</rec-table-td>
              </rec-table-tr>
            }
          </rec-table-tbody>
          <rec-table-tfoot>
            <rec-table-tr>
              <rec-table-td>Total</rec-table-td>
              <rec-table-td variant="currency">\${{ total.toFixed(2) }}</rec-table-td>
            </rec-table-tr>
          </rec-table-tfoot>
        </rec-table>
      `,
      props: { prices, total },
    };
  },
};
