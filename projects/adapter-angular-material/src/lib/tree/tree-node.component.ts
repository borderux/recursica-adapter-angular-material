import {
  Component,
  ElementRef,
  Input,
  ViewEncapsulation,
  inject,
} from "@angular/core";
import { ButtonComponent } from "../button/button.component";
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
  imports: [TreeNodeComponent, ButtonComponent],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrl: "./tree-node.component.css",
  host: {
    class: "node",
    role: "treeitem",
    "[attr.tabindex]": "context?.isFocusTarget(node.value) ? 0 : -1",
    "(focus)": "context?.setFocusTarget(node.value)",
    "[attr.data-value]": "node.value",
    "[attr.aria-expanded]":
      "hasChildren ? (isExpanded ? 'true' : 'false') : null",
    "[attr.aria-selected]": "isSelected ? 'true' : 'false'",
    "[style.--tree-level]": "level",
    "(click)": "onRowClick($event)",
    "(keydown)": "onKeydown($event)",
  },
  template: `
    <div
      class="row"
      [attr.data-has-children]="hasChildren ? '' : null"
      [attr.data-expanded]="hasChildren && isExpanded ? '' : null"
    >
      <!-- Mantine's reference renders a real Recursica text-variant small Button here; same
           here. Stays out of the tab order and off the a11y tree — the row is the only focusable
           element. -->
      <span
        class="expandButton"
        aria-hidden="true"
        (mousedown)="$event.preventDefault()"
        (click)="onToggleClick($event)"
      >
        <rec-button
          variant="text"
          size="small"
          [iconOnly]="true"
          ariaLabel="Toggle subtree"
          [buttonTabIndex]="-1"
          [icon]="expandGlyph"
        />
      </span>
      <ng-template #expandGlyph>
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
      </ng-template>
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

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly context = inject(TREE_CONTEXT, { optional: true });

  get hasChildren(): boolean {
    return this.node.children !== undefined;
  }

  get isExpanded(): boolean {
    return this.context?.isExpanded(this.node.value) ?? false;
  }

  get isSelected(): boolean {
    return this.context?.isSelected(this.node.value) ?? false;
  }

  onRowClick(event: MouseEvent): void {
    // This host sits inside its parent node's host (the subtree is nested) — without this the
    // click would bubble and also select every ancestor, the last one winning.
    event.stopPropagation();
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
      case "ArrowDown":
        event.preventDefault();
        this.context?.moveFocus(this.element.nativeElement, "next");
        return;
      case "ArrowUp":
        event.preventDefault();
        this.context?.moveFocus(this.element.nativeElement, "prev");
        return;
      case "Home":
        event.preventDefault();
        this.context?.moveFocus(this.element.nativeElement, "first");
        return;
      case "End":
        event.preventDefault();
        this.context?.moveFocus(this.element.nativeElement, "last");
        return;
      case "ArrowRight":
        if (this.hasChildren) {
          event.preventDefault();
          if (!this.isExpanded) {
            this.context?.toggleExpanded(this.node.value);
          } else {
            this.context?.moveFocus(this.element.nativeElement, "child");
          }
        }
        return;
      case "ArrowLeft":
        event.preventDefault();
        if (this.hasChildren && this.isExpanded) {
          this.context?.toggleExpanded(this.node.value);
        } else {
          this.context?.moveFocus(this.element.nativeElement, "parent");
        }
        return;
      default:
        return;
    }
  }
}
