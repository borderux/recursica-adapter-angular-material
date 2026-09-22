import { Component, Input, ViewEncapsulation, inject } from "@angular/core";
import { TREE_CONTEXT } from "./tree-context";
import { RecursicaTreeNode } from "./tree-node-data";

/**
 * `TreeNode` — recursive: renders itself (`rec-tree-node` self-imported)
 * for `node.children` when expanded. Part of `Tree`'s hand-built
 * implementation (see `tree.component.ts`'s class doc comment for the
 * `@angular/cdk/tree` investigation this doesn't repeat).
 *
 * ## `role="treeitem"` lives in `host: {}`, this component's host is the `<li>`-equivalent — not a nested wrapper
 *
 * A first draft (rejected) put a `<li role="treeitem">` *inside* this
 * component's own template, with `rec-tree-node` itself as a plain
 * wrapping custom element around it. That breaks the real ARIA
 * parent-child relationship the WAI-ARIA tree pattern depends on: the
 * accessibility tree's "tree owns treeitem" nesting is derived from the
 * *DOM* ancestor chain of elements actually carrying `role="tree"`/
 * `role="treeitem"`/`role="group"` — inserting a non-role-bearing
 * `<rec-tree-node>` element between `<ul role="tree">` and `<li
 * role="treeitem">` puts a foreign element in that chain, the same class
 * of finding `table.component.ts`'s own class doc comment documents for
 * why `rec-table-tr` can't wrap a real `<tr>` either (there, a CSS
 * `display` layout problem; here, an ARIA ownership problem — different
 * mechanism, same "the wrapper approach breaks browser-computed
 * structure" root cause). Fixed the same way: no wrapper. `role`/
 * `tabindex`/`[attr.data-value]`/`[attr.aria-expanded]`/
 * `[attr.aria-selected]`/`[style.--tree-level]`/`(click)`/`(keydown)` all
 * live in this component's own `host: {}` metadata, so `<ul>`'s real
 * children are `rec-tree-node` elements directly carrying `role="treeitem"`
 * themselves — a valid ARIA parent-child chain regardless of the
 * non-`<li>` tag name (ARIA role computation keys off role attributes and
 * DOM nesting, not tag names, the same underlying reason this repo's
 * `rec-table-*` element selectors work for CSS table layout).
 *
 * `hasChildren = node.children !== undefined` (not `.length > 0`) —
 * matches the reference's own documented contract: an empty `children: []`
 * array still renders the expand chevron, just with nothing underneath
 * once expanded.
 *
 * The expand button and row-click selection are independent, matching the
 * reference's own fixed interaction pattern exactly: `toggleExpand()` is
 * only ever called from the chevron button's own `(click)`, which calls
 * `event.stopPropagation()` so it never also reaches this host's own
 * `(click)` (which calls `select()`). `tabindex="-1"` on the toggle button
 * keeps it out of the tab order — same reasoning the reference's own
 * `aria-hidden`/`tabIndex={-1}` combination documents: this component's
 * own host is the only focusable element, so the button never shows its
 * own focus state.
 *
 * **Known, documented simplification**: every node gets its own
 * `tabindex="0"` rather than a single shared roving tabindex across the
 * whole visible tree — see `tree.component.ts`'s class doc comment for
 * the full reasoning.
 */
@Component({
  selector: "rec-tree-node",
  imports: [TreeNodeComponent],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./tree-node.component.css",
  host: {
    class: "node",
    role: "treeitem",
    tabindex: "0",
    "[attr.data-value]": "node.value",
    "[attr.aria-expanded]":
      "hasChildren ? (isExpanded ? 'true' : 'false') : null",
    "[attr.aria-selected]": "isSelected ? 'true' : 'false'",
    "[style.--tree-level]": "level",
    "(click)": "onRowClick()",
    "(keydown)": "onKeydown($event)",
  },
  template: `
    <div
      class="row"
      [attr.data-has-children]="hasChildren ? '' : null"
      [attr.data-expanded]="hasChildren && isExpanded ? '' : null"
    >
      <button
        type="button"
        class="expandButton"
        aria-label="Toggle subtree"
        aria-hidden="true"
        tabindex="-1"
        (mousedown)="$event.preventDefault()"
        (click)="onToggleClick($event)"
      >
        <svg
          class="expandGlyph"
          viewBox="0 0 16 16"
          width="1em"
          height="1em"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M5 3l5 5-5 5" />
        </svg>
      </button>
      <span class="label" [attr.data-selected]="isSelected ? '' : null">{{
        node.label
      }}</span>
    </div>

    @if (hasChildren && isExpanded) {
      <ul class="subtree" role="group">
        @for (child of node.children; track child.value) {
          <rec-tree-node [node]="child" [level]="level + 1" />
        }
      </ul>
    }
  `,
})
export class TreeNodeComponent {
  @Input({ required: true }) node!: RecursicaTreeNode;
  @Input() level = 0;

  private readonly context = inject(TREE_CONTEXT, { optional: true });

  get hasChildren(): boolean {
    return this.node.children !== undefined;
  }

  get isExpanded(): boolean {
    return this.context?.isExpanded(this.node.value) ?? false;
  }

  get isSelected(): boolean {
    return this.context?.isSelected(this.node.value) ?? false;
  }

  onRowClick(): void {
    this.context?.select(this.node.value);
  }

  onToggleClick(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.hasChildren) return;
    this.context?.toggleExpanded(this.node.value);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.target !== event.currentTarget) return;
    switch (event.key) {
      case "Enter":
      case " ":
        event.preventDefault();
        this.context?.select(this.node.value);
        return;
      case "ArrowRight":
        if (this.hasChildren && !this.isExpanded) {
          event.preventDefault();
          this.context?.toggleExpanded(this.node.value);
        }
        return;
      case "ArrowLeft":
        if (this.hasChildren && this.isExpanded) {
          event.preventDefault();
          this.context?.toggleExpanded(this.node.value);
        }
        return;
      default:
        return;
    }
  }
}
