import { Component, ViewEncapsulation } from "@angular/core";

/**
 * `Table.Thead` — an element-selector component (`rec-table-thead`, not an
 * attribute selector on a real `<thead>`) — this repo's own eslint config
 * enforces `@angular-eslint/component-selector: { type: "element", prefix:
 * "rec" }` repo-wide (no exemption for real, published components; the
 * `input[recDemoFormControl]` attribute-selector precedent in
 * `form-control-wrapper.stories.ts` lives in Storybook-only demo code,
 * which the same config file exempts separately — not a precedent for
 * real components).
 *
 * A first instinct here (rejected) was that a non-`<thead>` element
 * between `<rec-table>`'s inner `<table>` and this component's own
 * `<ng-content>` would trigger browser HTML-parsing "foster parenting"
 * (invalid table content silently relocated out of the table). That
 * quirk is specific to the HTML5 *parsing* algorithm (tokenizing markup
 * text into a DOM tree) — Angular never parses this template as an HTML
 * string; it compiles to imperative `createElement`/`appendChild` calls,
 * which build the DOM tree directly with no tree-construction/foster-
 * parenting pass at all. The real constraint is CSS table *layout*, not
 * DOM validity — solved with `:host { display: table-header-group }`
 * below: the CSS table-layout algorithm's anonymous-box generation keys
 * off computed `display` values, not tag names, so an element explicitly
 * declaring a table-participant `display` value lays out correctly
 * regardless of its actual tag. `role="rowgroup"` restores the implicit
 * ARIA semantics a real `<thead>` would have carried automatically (tag-
 * name-based implicit role mapping does *not* follow from a CSS `display`
 * override the way table layout participation does).
 */
@Component({
  selector: "rec-table-thead",
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./table-thead.component.css",
  host: { role: "rowgroup" },
  template: `<ng-content />`,
})
export class TableTheadComponent {}
